import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
interface ChangePasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}
const ChangePasswordDialog = ({ isOpen, onClose, userId, userName }: ChangePasswordDialogProps)=>{
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const resetForm = ()=>{
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setIsLoading(false);
    };
    const handleClose = ()=>{
        resetForm();
        onClose();
    };
    const validateForm = async ()=>{
        let requireCurrentPassword = true;
        try {
            const { data: user } = await supabase.from('users').select('password_hash').eq('id', userId).single();
            if (user?.password_hash === 'temp-hash') {
                requireCurrentPassword = false;
                console.log('ℹ️ Skipping current password validation for temp user');
            }
        } catch (error) {
            console.error('Error checking user password:', error);
        }
        if (requireCurrentPassword && !currentPassword.trim()) {
            toast.error('Digite sua senha atual');
            return false;
        }
        if (!newPassword.trim()) {
            toast.error('Digite a nova senha');
            return false;
        }
        if (newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres');
            return false;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return false;
        }
        if (requireCurrentPassword && currentPassword === newPassword) {
            toast.error('A nova senha deve ser diferente da atual');
            return false;
        }
        return true;
    };
    const handleChangePassword = async ()=>{
        if (!(await validateForm())) return;
        setIsLoading(true);
        console.log('🔐 Attempting to change password for user:', userId);
        try {
            const { data: user, error: fetchError } = await supabase.from('users').select('*').eq('id', userId).single();
            if (fetchError || !user) {
                console.error('❌ User not found:', fetchError);
                toast.error('Usuário não encontrado');
                return;
            }
            console.log('✅ User found:', user.name);
            if (user.password_hash === 'temp-hash') {
                console.log('ℹ️ User has temporary password, allowing change without current password verification');
            } else if (user.password_hash !== currentPassword) {
                console.log('❌ Current password incorrect. Expected:', user.password_hash, 'Got:', currentPassword);
                toast.error('Senha atual incorreta');
                return;
            } else {
                console.log('✅ Current password verified');
            }
            const { error: updateError } = await supabase.from('users').update({
                password_hash: newPassword,
                updated_at: new Date().toISOString()
            }).eq('id', userId);
            if (updateError) {
                console.error('❌ Error updating password:', updateError);
                toast.error('Erro ao alterar senha: ' + updateError.message);
                return;
            }
            console.log('✅ Password changed successfully for user:', userId);
            toast.success('Senha alterada com sucesso!');
            handleClose();
        } catch (error) {
            console.error('❌ Error changing password:', error);
            toast.error('Erro ao alterar senha. Tente novamente.');
        } finally{
            setIsLoading(false);
        }
    };
    return (<AlertDialog open={isOpen} onOpenChange={handleClose} data-spec-id="user-change-password-dialog">
      <AlertDialogContent className="max-w-md" data-spec-id="user-change-password-content">
        <AlertDialogHeader data-spec-id="user-change-password-header">
          <AlertDialogTitle data-spec-id="user-change-password-title">
            Alterar Senha
          </AlertDialogTitle>
          <AlertDialogDescription data-spec-id="user-change-password-description">
            {userName}, digite sua senha atual e escolha uma nova senha.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4" data-spec-id="change-password-form">
          <div className="space-y-2" data-spec-id="current-password-field">
            <Label htmlFor="currentPassword" data-spec-id="current-password-label">
              Senha Atual
            </Label>
            <div className="relative" data-spec-id="current-password-input-wrapper">
              <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} disabled={isLoading} className="pr-10" data-spec-id="current-password-input"/>
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={()=>setShowCurrentPassword(!showCurrentPassword)} disabled={isLoading} data-spec-id="current-password-toggle">
                {showCurrentPassword ? (<EyeOff className="h-4 w-4 text-gray-400" data-spec-id="current-password-hide-icon"/>) : (<Eye className="h-4 w-4 text-gray-400" data-spec-id="current-password-show-icon"/>)}
              </button>
            </div>
          </div>

          <div className="space-y-2" data-spec-id="new-password-field">
            <Label htmlFor="newPassword" data-spec-id="new-password-label">
              Nova Senha
            </Label>
            <div className="relative" data-spec-id="new-password-input-wrapper">
              <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} disabled={isLoading} className="pr-10" placeholder="Mínimo 6 caracteres" data-spec-id="new-password-input"/>
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={()=>setShowNewPassword(!showNewPassword)} disabled={isLoading} data-spec-id="new-password-toggle">
                {showNewPassword ? (<EyeOff className="h-4 w-4 text-gray-400" data-spec-id="new-password-hide-icon"/>) : (<Eye className="h-4 w-4 text-gray-400" data-spec-id="new-password-show-icon"/>)}
              </button>
            </div>
          </div>

          <div className="space-y-2" data-spec-id="confirm-password-field">
            <Label htmlFor="confirmPassword" data-spec-id="confirm-password-label">
              Confirmar Nova Senha
            </Label>
            <div className="relative" data-spec-id="confirm-password-input-wrapper">
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} disabled={isLoading} className="pr-10" data-spec-id="confirm-password-input"/>
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={()=>setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading} data-spec-id="confirm-password-toggle">
                {showConfirmPassword ? (<EyeOff className="h-4 w-4 text-gray-400" data-spec-id="confirm-password-hide-icon"/>) : (<Eye className="h-4 w-4 text-gray-400" data-spec-id="confirm-password-show-icon"/>)}
              </button>
            </div>
          </div>
        </div>

        <AlertDialogFooter data-spec-id="change-password-footer">
          <AlertDialogCancel onClick={handleClose} disabled={isLoading} data-spec-id="change-password-cancel">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleChangePassword} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700" data-spec-id="change-password-confirm">
            {isLoading ? 'Alterando...' : 'Alterar Senha'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
};
export default ChangePasswordDialog;
