import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VIOLATION_THRESHOLD = 3; // Ban after 3 violations

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, senderId, messageId } = await req.json();
    
    if (!message || !senderId) {
      return new Response(
        JSON.stringify({ error: 'Missing message or senderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is already banned
    const { data: bannedUser } = await supabase
      .from('banned_users')
      .select('id')
      .eq('user_id', senderId)
      .maybeSingle();

    if (bannedUser) {
      // Log the attempt from banned user
      await supabase.from('moderation_logs').insert({
        message_id: messageId || null,
        sender_id: senderId,
        message_content: message.substring(0, 500),
        is_approved: false,
        ai_reasoning: 'User is already banned - message blocked automatically',
        violation_type: 'BANNED_USER'
      });

      return new Response(
        JSON.stringify({ 
          approved: false, 
          reason: 'You have been banned from sending messages due to repeated guideline violations.',
          banned: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to moderate the message
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation AI for a sports/padel app. Analyze the message and determine if it violates community guidelines.

Guidelines that messages must follow:
- No hate speech, discrimination, or harassment
- No explicit sexual content
- No threats or violence
- No spam or advertising
- No sharing of personal contact information (phone numbers, addresses)
- No bullying or personal attacks
- Keep conversations respectful and sports-focused

Respond with a JSON object ONLY (no markdown):
{
  "approved": boolean,
  "reason": "detailed explanation of your decision - explain WHY the message was approved or rejected",
  "violation_type": "one of: HATE_SPEECH, SEXUAL_CONTENT, THREATS, SPAM, PERSONAL_INFO, BULLYING, OFF_TOPIC, or null if approved",
  "confidence": "HIGH, MEDIUM, or LOW - how confident you are in this decision"
}`
          },
          {
            role: 'user',
            content: `Analyze this message: "${message}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        // Log rate limit case
        await supabase.from('moderation_logs').insert({
          message_id: messageId || null,
          sender_id: senderId,
          message_content: message.substring(0, 500),
          is_approved: true,
          ai_reasoning: 'Rate limit exceeded - message allowed (fail-open)',
          violation_type: null
        });
        return new Response(
          JSON.stringify({ approved: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    console.log('AI moderation response:', aiResponse);

    let moderationResult;
    try {
      // Clean up potential markdown formatting
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      moderationResult = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      // Log parsing failure
      await supabase.from('moderation_logs').insert({
        message_id: messageId || null,
        sender_id: senderId,
        message_content: message.substring(0, 500),
        is_approved: true,
        ai_reasoning: `AI response parsing failed - message allowed. Raw response: ${aiResponse?.substring(0, 200)}`,
        violation_type: null
      });
      moderationResult = { approved: true };
    }

    // Log the moderation decision
    await supabase.from('moderation_logs').insert({
      message_id: messageId || null,
      sender_id: senderId,
      message_content: message.substring(0, 500),
      is_approved: moderationResult.approved,
      ai_reasoning: moderationResult.reason || (moderationResult.approved ? 'Message meets community guidelines' : 'Guideline violation'),
      violation_type: moderationResult.violation_type || null
    });

    // If message is not approved, record the violation
    if (!moderationResult.approved) {
      // Record the violation
      await supabase
        .from('user_violations')
        .insert({
          user_id: senderId,
          message_content: message.substring(0, 500),
          violation_reason: moderationResult.reason || 'Guideline violation'
        });

      // Check violation count
      const { count } = await supabase
        .from('user_violations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', senderId);

      const violationCount = count || 0;

      // Ban user if they exceed threshold
      if (violationCount >= VIOLATION_THRESHOLD) {
        await supabase
          .from('banned_users')
          .insert({
            user_id: senderId,
            reason: `Automatically banned after ${violationCount} guideline violations. Last violation: ${moderationResult.violation_type || 'Unknown'}`
          });

        // Log the ban
        await supabase.from('moderation_logs').insert({
          message_id: null,
          sender_id: senderId,
          message_content: `[SYSTEM] User banned after ${violationCount} violations`,
          is_approved: false,
          ai_reasoning: `User automatically banned after reaching ${VIOLATION_THRESHOLD} violations. Violation types: ${moderationResult.violation_type}`,
          violation_type: 'AUTO_BAN'
        });

        return new Response(
          JSON.stringify({ 
            approved: false, 
            reason: `You have been banned after ${violationCount} guideline violations.`,
            banned: true,
            violationCount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          approved: false, 
          reason: moderationResult.reason,
          violationCount,
          warningsLeft: VIOLATION_THRESHOLD - violationCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ approved: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Moderation error:', error);
    // Fail-open: allow message if moderation fails
    return new Response(
      JSON.stringify({ approved: true, error: 'Moderation unavailable' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
