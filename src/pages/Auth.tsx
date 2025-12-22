import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import sportpairLogo from '@/assets/sportpair-logo.png';

const emailSchema = z.string().email('Ongeldig e-mailadres');
const passwordSchema = z.string().min(6, 'Wachtwoord moet minimaal 6 tekens zijn');
const MIN_AGE = 16;
const currentYear = new Date().getFullYear();
const birthYears = Array.from({ length: 100 }, (_, i) => currentYear - MIN_AGE - i);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setLoading(false);
        return;
      }
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Ongeldige inloggegevens');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Succesvol ingelogd!');
      }
    } else {
      if (!name.trim()) {
        toast.error('Vul je naam in');
        setLoading(false);
        return;
      }

      if (!birthYear) {
        toast.error('Selecteer je geboortejaar');
        setLoading(false);
        return;
      }

      const age = currentYear - parseInt(birthYear);
      if (age < MIN_AGE) {
        toast.error(`Je moet minimaal ${MIN_AGE} jaar oud zijn om te registreren`);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name, age }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Dit e-mailadres is al geregistreerd');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account aangemaakt! Je bent nu ingelogd.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 gradient-warm">
      <Card className="w-full max-w-md shadow-card border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <CardHeader className="text-center relative">
          <img 
            src={sportpairLogo} 
            alt="SportPair" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-glow"
          />
          <CardTitle className="text-2xl font-bold text-gradient">SportPair</CardTitle>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Log in op je account' : 'Maak een nieuw account'}
          </p>
        </CardHeader>
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Input
                    type="text"
                    placeholder="Je naam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="h-12 rounded-xl border-border/50 bg-secondary/50 focus:bg-card transition-colors"
                  />
                </div>
                <div>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger className="h-12 rounded-xl border-border/50 bg-secondary/50 focus:bg-card transition-colors">
                      <SelectValue placeholder="Geboortejaar" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {birthYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Input
                type="email"
                placeholder="E-mailadres"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-border/50 bg-secondary/50 focus:bg-card transition-colors"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Wachtwoord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-border/50 bg-secondary/50 focus:bg-card transition-colors"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl gradient-primary shadow-accent font-semibold text-base" 
              disabled={loading}
            >
              {loading ? 'Laden...' : isLogin ? 'Inloggen' : 'Registreren'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
            >
              {isLogin ? 'Nog geen account? Registreer je' : 'Al een account? Log in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
