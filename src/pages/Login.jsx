import React, { useState } from 'react';
    import { useNavigate, Link } from 'react-router-dom';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/customSupabaseClient';
    
    const Login = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [showResend, setShowResend] = useState(false);
      const { signIn } = useAuth();
      const navigate = useNavigate();
      const { toast } = useToast();
    
      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setShowResend(false);
        const { error } = await signIn(email, password);
        if (error) {
           if (error.message.includes('Email not confirmed')) {
            toast({
              variant: "destructive",
              title: "E-mail não confirmado",
              description: "Por favor, verifique sua caixa de entrada e confirme seu e-mail para continuar.",
            });
            setShowResend(true);
          } else {
            toast({
              variant: "destructive",
              title: "Falha no Login",
              description: "Verifique seu e-mail e senha.",
            });
          }
        } else {
          toast({
            title: "Login bem-sucedido!",
            description: "Bem-vindo de volta!",
          });
          navigate('/');
        }
        setLoading(false);
      };
    
      const handleResendConfirmation = async () => {
        setLoading(true);
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        });
        if (error) {
          toast({
            variant: "destructive",
            title: "Falha ao reenviar",
            description: error.message || "Não foi possível reenviar o e-mail de confirmação.",
          });
        } else {
          toast({
            title: "E-mail reenviado!",
            description: "Verifique sua caixa de entrada para o novo link de confirmação.",
          });
        }
        setLoading(false);
      };
    
      return (
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md p-8 space-y-8 glass-card"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold gradient-text">SysFina</h1>
              <p className="text-muted-foreground">Bem-vindo de volta! Faça login para continuar.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            {showResend && (
               <div className="text-center">
                  <p className="text-sm text-muted-foreground">Não recebeu o e-mail?</p>
                  <Button variant="link" onClick={handleResendConfirmation} disabled={loading}>
                    {loading ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                  </Button>
                </div>
            )}
             <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                    Cadastre-se
                </Link>
            </p>
          </motion.div>
        </div>
      );
    };
    
    export default Login;