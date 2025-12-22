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
    const { message, senderId } = await req.json();
    
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
  "reason": "string explaining why it was rejected (only if approved is false)"
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
        // Allow message through if rate limited (fail-open for UX)
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
      // Default to approved if parsing fails
      moderationResult = { approved: true };
    }

    // If message is not approved, record the violation
    if (!moderationResult.approved) {
      // Record the violation
      await supabase
        .from('user_violations')
        .insert({
          user_id: senderId,
          message_content: message.substring(0, 500), // Limit stored content
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
            reason: `Banned after ${violationCount} guideline violations`
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
