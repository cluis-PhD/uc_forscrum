'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Apple, 
  Chrome,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Header } from '../shared/Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AuthLoginProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  onLogin?: (userType: 'formador' | 'formando', userData?: any) => void;
}

export default function AuthLogin({ onBack, onNavigate, onLogin }: AuthLoginProps) {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'formador' | 'formando'>('formador');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleFormadorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validar campos vazios
      if (!email || !password) {
        toast.error('Por favor, preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      // Validar credenciais de formador (username: "Formador")
      if (email.toLowerCase() !== 'formador') {
        toast.error('Username incorreto. Use "Formador".');
        setIsLoading(false);
        return;
      }

      // Simular autenticação de formador
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Login de Formador com sucesso!');
      
      // Chamar callback de login
      if (onLogin) {
        onLogin('formador');
      } else if (onNavigate) {
        onNavigate('formadorDashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormandoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validar campos vazios
      if (!studentName || !password) {
        toast.error('Por favor, preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      // Buscar formando pelo nome
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-42b5d594/students`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar formandos');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.students)) {
        // Procurar formando pelo nome
        const student = data.students.find((s: any) => 
          s.name.toLowerCase() === studentName.toLowerCase()
        );

        if (!student) {
          toast.error('Formando não encontrado. Verifique o nome.');
          setIsLoading(false);
          return;
        }

        // Verificar password (deve ser "formando")
        if (password !== 'formando') {
          setPasswordError('A password padrão é "formando". Por favor, tente novamente.');
          setIsLoading(false);
          return;
        }

        toast.success(`Bem-vindo, ${student.name}!`);
        
        // Chamar callback de login com dados do formando
        if (onLogin) {
          onLogin('formando', student);
        } else if (onNavigate) {
          onNavigate('formandoDashboard', { student });
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error('Erro ao carregar dados de formandos.');
      }
    } catch (error) {
      console.error('Erro ao autenticar formando:', error);
      toast.error('Erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info('Google Login em desenvolvimento', {
      description: 'Funcionalidade disponível em breve',
    });
  };

  const handleAppleLogin = () => {
    toast.info('Apple Login em desenvolvimento', {
      description: 'Funcionalidade disponível em breve',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col dark:bg-slate-900 transition-colors duration-200">
      {/* Header consistente com o resto da app */}
      <Header 
        title="Login" 
        onBack={onBack}
        showProfile={false}
        showActions={false}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">forScrum</h1>
          <p className="text-muted-foreground dark:text-slate-400">Entre na sua conta</p>
        </div>

        {/* Formulário */}
        <Card className="w-full max-w-sm p-6 space-y-6 dark:bg-slate-800 dark:border-slate-700">
          {/* Seletor de Tipo de Utilizador */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg dark:bg-slate-700">
            <button
              type="button"
              onClick={() => setLoginType('formador')}
              className={`py-2 px-4 rounded-md text-[14px] font-medium transition-all ${
                loginType === 'formador'
                  ? 'bg-white text-[#4aa540] shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Formador
            </button>
            <button
              type="button"
              onClick={() => setLoginType('formando')}
              className={`py-2 px-4 rounded-md text-[14px] font-medium transition-all ${
                loginType === 'formando'
                  ? 'bg-white text-[#0b87ac] shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Formando
            </button>
          </div>

          <form onSubmit={loginType === 'formador' ? handleFormadorSubmit : handleFormandoSubmit} className="space-y-4">
            {loginType === 'formador' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                      aria-describedby="email-error"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline focus:outline-none focus:underline"
                      onClick={() => toast.info('Recuperação de password em breve')}
                    >
                      Esqueceu a password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      aria-describedby="password-error"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studentName">Nome do Formando</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="studentName"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Nome completo"
                      className="pl-10"
                      required
                      aria-describedby="student-name-error"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-formando">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="password-formando"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="formando"
                      className={`pl-10 ${passwordError ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      aria-describedby="password-error"
                      aria-invalid={!!passwordError}
                    />
                  </div>
                  {passwordError ? (
                    <p className="text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200" id="password-error" role="alert">
                      {passwordError}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Password padrão: <strong>formando</strong>
                    </p>
                  )}
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>

          {loginType === 'formador' && (
            <>
              {/* Divisor */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              {/* Botões SSO */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleGoogleLogin}
                  aria-label="Login com Google"
                >
                  <Chrome className="size-4" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleAppleLogin}
                  aria-label="Login com Apple"
                >
                  <Apple className="size-4" />
                  Apple
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Rodapé */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          © {new Date().getFullYear()} forScrum. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}