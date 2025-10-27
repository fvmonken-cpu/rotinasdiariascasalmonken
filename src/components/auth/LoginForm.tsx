import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(3, 'Senha deve ter pelo menos 3 caracteres')
});
type LoginFormData = z.infer<typeof loginSchema>;
const LoginForm: React.FC = ()=>{
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });
    const onSubmit = async (data: LoginFormData)=>{
        try {
            setError('');
            setIsLoading(true);
            await login(data.email, data.password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally{
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" data-spec-id="login-container">
      <Card className="w-full max-w-md" data-spec-id="dELM0vgbwXgugykV">
        <CardHeader className="space-y-4" data-spec-id="gIWhBNKwogspSoz9">
          {}
          <div className="flex justify-center" data-spec-id="logo-container">
            <img src="https://cdn-pinspec-public.pinspec.ai/assets/Z8gZalhVAKjQV45OvNsVM.png" alt="Casal Monken" className="h-16 md:h-20 w-auto object-contain" data-spec-id="login-logo"/>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#D2AE6D]" data-spec-id="YzOXYlcYehI4EOyT">
            Sistema Casal Monken
          </CardTitle>
          <CardDescription className="text-center" data-spec-id="zNoHzczIVqGJfECX">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent data-spec-id="0g8qNqS4DSGnNEJh">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-spec-id="062DArUTk4d91yIg">
            <div className="space-y-2" data-spec-id="31fwbOYpI26OU873">
              <Label htmlFor="email" data-spec-id="ECjPZaGHbrgM2xM1">
                E-mail <span className="text-red-500" data-spec-id="DPU6VpVkmZJ8Oean">*</span>
              </Label>
              <Input id="email" type="email" placeholder="seu.email@casalmonken.com" {...register('email')} disabled={isLoading} data-spec-id="email-input"/>
              {errors.email && (<p className="text-sm text-red-500" data-spec-id="SeIZuSbjFnjlFLXc">{errors.email.message}</p>)}
            </div>

            <div className="space-y-2" data-spec-id="I5s6abAiLZLKpKuZ">
              <Label htmlFor="password" data-spec-id="QZ6mzTxJOkClCjuy">
                Senha <span className="text-red-500" data-spec-id="B8otMeggw5T23pY6">*</span>
              </Label>
              <Input id="password" type="password" placeholder="Digite sua senha" {...register('password')} disabled={isLoading} data-spec-id="password-input"/>
              {errors.password && (<p className="text-sm text-red-500" data-spec-id="S95p4A4LGPbjBXOB">{errors.password.message}</p>)}
            </div>

            {error && (<Alert variant="destructive" data-spec-id="8PLzmMr63AF4WPkj">
                <AlertCircle className="h-4 w-4" data-spec-id="Ama6EvLSj8nkTcrs"/>
                <AlertDescription data-spec-id="242urIOML6yWpgrN">{error}</AlertDescription>
              </Alert>)}

            <Button type="submit" className="w-full bg-[#D2AE6D] hover:bg-[#B8965A] text-white" disabled={isLoading} data-spec-id="login-button">
              {isLoading ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" data-spec-id="XuxAMQAWJL3GqKV4"/>
                  Entrando...
                </>) : ('Entrar')}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>);
};
export default LoginForm;
