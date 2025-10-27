import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Key, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEditUser } from '@/hooks/useUsers';
interface ChangePasswordViewProps {
    onBack: () => void;
}
const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ onBack })=>{
    const { user } = useAuth();
    const { mutate: editUser, isPending } = useEditUser();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<string[]>([]);
    const handleSubmit = (e: React.FormEvent)=>{
        e.preventDefault();
        const newErrors: string[] = [];
        if (!formData.currentPassword) {
            newErrors.push('Senha atual é obrigatória');
        }
        if (!formData.newPassword) {
            newErrors.push('Nova senha é obrigatória');
        } else if (formData.newPassword.length < 3) {
            newErrors.push('Nova senha deve ter pelo menos 3 caracteres');
        }
        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.push('Confirmação de senha não confere');
        }
        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        if (!user?.id) return;
        editUser({
            id: user.id,
            password: formData.newPassword
        }, {
            onSuccess: ()=>{
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setErrors([]);
                onBack();
            },
            onError: ()=>{
                setErrors([
                    'Erro ao alterar senha. Verifique sua senha atual.'
                ]);
            }
        });
    };
    const handleInputChange = (field: string, value: string)=>{
        setFormData((prev)=>({
                ...prev,
                [field]: value
            }));
        if (errors.length > 0) {
            setErrors([]);
        }
    };
    return (<div className="space-y-6" data-spec-id="change-password-view">
      <div className="flex items-center gap-4" data-spec-id="header-section">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-gray-800" data-spec-id="back-button">
          <ArrowLeft className="h-4 w-4 mr-2" data-spec-id="back-icon"/>
          Voltar
        </Button>
        
        <div data-spec-id="title-section">
          <h1 className="text-2xl font-bold text-gray-900" data-spec-id="page-title">
            Alterar Senha
          </h1>
          <p className="text-gray-600" data-spec-id="page-description">
            Atualize sua senha de acesso ao sistema
          </p>
        </div>
      </div>

      <Card className="max-w-md mx-auto" data-spec-id="password-form-card">
        <CardHeader data-spec-id="card-header">
          <CardTitle className="flex items-center gap-2" data-spec-id="card-title">
            <Key className="h-5 w-5" data-spec-id="key-icon"/>
            Alterar Senha
          </CardTitle>
        </CardHeader>
        
        <CardContent data-spec-id="card-content">
          <form onSubmit={handleSubmit} className="space-y-4" data-spec-id="password-form">
            <div className="space-y-2" data-spec-id="current-password-field">
              <Label htmlFor="currentPassword" data-spec-id="current-password-label">
                Senha Atual
              </Label>
              <Input id="currentPassword" type="password" value={formData.currentPassword} onChange={(e)=>handleInputChange('currentPassword', e.target.value)} disabled={isPending} data-spec-id="current-password-input"/>
            </div>

            <div className="space-y-2" data-spec-id="new-password-field">
              <Label htmlFor="newPassword" data-spec-id="new-password-label">
                Nova Senha
              </Label>
              <Input id="newPassword" type="password" value={formData.newPassword} onChange={(e)=>handleInputChange('newPassword', e.target.value)} disabled={isPending} data-spec-id="new-password-input"/>
            </div>

            <div className="space-y-2" data-spec-id="confirm-password-field">
              <Label htmlFor="confirmPassword" data-spec-id="confirm-password-label">
                Confirmar Nova Senha
              </Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e)=>handleInputChange('confirmPassword', e.target.value)} disabled={isPending} data-spec-id="confirm-password-input"/>
            </div>

            {errors.length > 0 && (<Alert variant="destructive" data-spec-id="error-alert">
                <AlertCircle className="h-4 w-4" data-spec-id="error-icon"/>
                <AlertDescription data-spec-id="error-description">
                  <ul className="list-disc list-inside space-y-1" data-spec-id="error-list">
                    {errors.map((error, index)=>(<li key={index} data-spec-id={`error-item-${index}`}>{error}</li>))}
                  </ul>
                </AlertDescription>
              </Alert>)}

            <div className="flex gap-2 pt-4" data-spec-id="form-actions">
              <Button type="button" variant="outline" onClick={onBack} disabled={isPending} className="flex-1" data-spec-id="cancel-button">
                Cancelar
              </Button>
              
              <Button type="submit" disabled={isPending} className="flex-1" data-spec-id="save-button">
                {isPending ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>);
};
export default ChangePasswordView;
