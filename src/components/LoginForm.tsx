import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';
const LoginForm = ()=>{
    const [email, setEmail] = useState(()=>{
        const savedEmail = localStorage.getItem('login_email_backup');
        return savedEmail || '';
    });
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading, isSupabaseConnected } = useSupabaseAuth();
    useEffect(()=>{
        console.log('📧 Email state changed:', email);
        if (!email) {
            const backup = localStorage.getItem('login_email_backup');
            if (backup) {
                console.log('🚨 Email zerado detectado! Restaurando backup:', backup);
                setEmail(backup);
            }
        }
    }, [
        email
    ]);
    useEffect(()=>{
        return ()=>{
            if (!email) {
                console.log('🔄 Component unmounting, preserving email backup');
            }
        };
    }, []);
    const handleSubmit = async (e: React.FormEvent)=>{
        e.preventDefault();
        setError('');
        const currentEmail = email;
        const currentPassword = password;
        console.log('📧 Email captured before login attempt:', currentEmail);
        console.log('🔐 Password captured before login attempt:', currentPassword);
        localStorage.setItem('login_email_backup', currentEmail);
        if (!email || !password) {
            setError('Por favor, preencha todos os campos');
            return;
        }
        try {
            await login(currentEmail, currentPassword);
            localStorage.removeItem('login_email_backup');
        } catch (error: any) {
            console.log('🔍 Login error caught, preserving email:', currentEmail);
            console.log('🔍 Current email state after error:', email);
            const preserveEmail = ()=>{
                const emailToPreserve = currentEmail || localStorage.getItem('login_email_backup') || '';
                console.log('🛡️ Preserving email with multiple protection:', emailToPreserve);
                setEmail(emailToPreserve);
                setPassword('');
                localStorage.setItem('login_email_backup', emailToPreserve);
            };
            preserveEmail();
            setTimeout(preserveEmail, 50);
            setTimeout(preserveEmail, 150);
            setTimeout(preserveEmail, 300);
            setError(error.message || 'Email ou senha incorretos. Verifique suas credenciais.');
            toast.error('Falha no login');
            console.log('📧 Email should remain:', currentEmail);
            console.log('📧 Email state immediately after error:', email);
            console.log('💾 Email backup saved in localStorage:', localStorage.getItem('login_email_backup'));
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4" data-spec-id="login-container">
      <Card className="w-full max-w-md shadow-xl" data-spec-id="HQa5RLIOZjqGKn1f">
        <CardHeader className="text-center space-y-4" data-spec-id="dKE19gpiSeqpil7j">
          <div className="mx-auto w-16 h-16 flex items-center justify-center" data-spec-id="login-logo-container">
            <img src="https://cdn-pinspec-public.pinspec.ai/assets/xZJjJVevo_1MOa-mMTMjr.png" alt="Espaço Casal Monken Logo" className="w-full h-full object-contain" data-spec-id="login-logo-image"/>
          </div>
          <div data-spec-id="9nqwGW4LJGUyn6zi">
            <CardTitle className="text-2xl font-bold text-gray-900" data-spec-id="Mg3jrpFxFewlNQLO">Espaço Casal Monken</CardTitle>
            <CardDescription className="text-gray-600" data-spec-id="4sj8SPbEHjU49Ksr">
              Acesse seu checklist diário
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6" data-spec-id="sIKJG3xYAHY3Bae6">
          <form onSubmit={handleSubmit} className="space-y-4" data-spec-id="JAojc8mZGQiYLtw3">
            <div className="space-y-2" data-spec-id="1nhSfKpOCLyNyr0f">
              <Label htmlFor="email" data-spec-id="x6ZlSsEjgd4cPe7D">Email</Label>
              <Input id="email" type="email" placeholder="Digite seu email" value={email} onChange={(e)=>setEmail(e.target.value)} disabled={isLoading} data-spec-id="email-input"/>
            </div>
            
            <div className="space-y-2" data-spec-id="fGSbKO5q6QDEtnqf">
              <Label htmlFor="password" data-spec-id="txKcJUu7kHC8mgLf">Senha</Label>
              <Input id="password" type="password" placeholder="Digite sua senha" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={isLoading} data-spec-id="password-input"/>
            </div>
            
            {error && (<Alert variant="destructive" data-spec-id="AqMh9gcCyzbbAS3h">
                <AlertDescription data-spec-id="KvrSEccKNk4VSNRI">{error}</AlertDescription>
              </Alert>)}
            
            <Button type="submit" className="w-full" disabled={isLoading} data-spec-id="login-button">
              {isLoading ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" data-spec-id="qVGIkZuYpSKD5805"/>
                  Entrando...
                </>) : ('Entrar')}
            </Button>
          </form>
          
          <div className="bg-blue-50 rounded-lg p-4 text-center" data-spec-id="login-info-section">
            <p className="text-sm text-blue-800" data-spec-id="login-info-text">
              <strong data-spec-id="HOq2uPVFeTbZ56mo">Sistema Profissional</strong><br data-spec-id="VtlLfZLAmMZHiDsZ"/>
              Entre com suas credenciais cadastradas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>);
};
export default LoginForm;
