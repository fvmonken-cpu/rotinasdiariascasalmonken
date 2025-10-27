import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useCreateUser, useEditUser } from '@/hooks/useUsers';
const userSchema = z.object({
    email: z.string().email('Email inválido'),
    full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    display_name: z.string().min(2, 'Nome de exibição deve ter pelo menos 2 caracteres'),
    password: z.string().optional(),
    user_type: z.string().min(1, 'Tipo de usuário é obrigatório'),
    is_admin: z.boolean().default(false)
});
type UserFormData = z.infer<typeof userSchema>;
interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: any;
    userTypes: any[];
    currentUser: any;
}
const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user, userTypes, currentUser })=>{
    const [showPassword, setShowPassword] = useState(false);
    const isEditing = !!user;
    const { mutate: createUser, isPending: isCreating } = useCreateUser();
    const { mutate: editUser, isPending: isUpdating } = useEditUser();
    const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            email: '',
            full_name: '',
            display_name: '',
            password: '',
            user_type: '',
            is_admin: false
        }
    });
    const watchedFullName = watch('full_name');
    useEffect(()=>{
        if (watchedFullName && !isEditing) {
            setValue('display_name', watchedFullName);
        }
    }, [
        watchedFullName,
        isEditing,
        setValue
    ]);
    useEffect(()=>{
        if (user && isOpen) {
            reset({
                email: user.email,
                full_name: user.full_name,
                display_name: user.display_name || user.full_name,
                password: '',
                user_type: user.user_type,
                is_admin: user.is_admin || false
            });
        } else if (!user && isOpen) {
            reset({
                email: '',
                full_name: '',
                display_name: '',
                password: '',
                user_type: '',
                is_admin: false
            });
        }
    }, [
        user,
        isOpen,
        reset
    ]);
    const onSubmit = (data: UserFormData)=>{
        console.log('Submetendo formulário de usuário:', data);
        if (isEditing) {
            const updateData: any = {
                ...data,
                id: user.id
            };
            if (!data.password) {
                delete updateData.password;
            }
            editUser(updateData, {
                onSuccess: ()=>{
                    onClose();
                    reset();
                }
            });
        } else {
            if (!data.password) {
                return;
            }
            createUser(data as any, {
                onSuccess: ()=>{
                    onClose();
                    reset();
                }
            });
        }
    };
    const canManageAdmin = (currentUser?.role === 'superusuario') || (currentUser?.role === 'administrativo');
    const canCreateSuperuser = false;
    const canEditThisUserAdmin = canManageAdmin && user?.id !== currentUser?.id;
    const isAdministrativeType = watch('user_type') === 'administrativo';
    const isEditingAdministrative = user?.user_type === 'administrativo';
    useEffect(()=>{
        if (isAdministrativeType) {
            setValue('is_admin', true);
        }
    }, [
        isAdministrativeType,
        setValue
    ]);
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="user-form-modal">
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-spec-id="modal-content">
        <DialogHeader data-spec-id="modal-header">
          <DialogTitle data-spec-id="modal-title">
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription data-spec-id="modal-description">
            {isEditing ? 'Edite as informações do usuário abaixo' : 'Preencha os dados do novo usuário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-spec-id="user-form">
          {}
          <div className="space-y-4" data-spec-id="basic-info-section">
            <h4 className="font-medium text-sm text-gray-900" data-spec-id="basic-info-title">
              Informações Básicas
            </h4>

            <div className="grid grid-cols-2 gap-4" data-spec-id="basic-info-grid">
              <div className="space-y-2" data-spec-id="full-name-field">
                <Label htmlFor="full_name" data-spec-id="full-name-label">Nome Completo *</Label>
                <Input id="full_name" {...register('full_name')} placeholder="Nome completo do usuário" data-spec-id="full-name-input"/>
                {errors.full_name && (<p className="text-sm text-red-600" data-spec-id="full-name-error">
                    {errors.full_name.message}
                  </p>)}
              </div>

              <div className="space-y-2" data-spec-id="display-name-field">
                <Label htmlFor="display_name" data-spec-id="display-name-label">Nome de Exibição *</Label>
                <Input id="display_name" {...register('display_name')} placeholder="Nome para exibição" data-spec-id="display-name-input"/>
                {errors.display_name && (<p className="text-sm text-red-600" data-spec-id="display-name-error">
                    {errors.display_name.message}
                  </p>)}
              </div>
            </div>

            <div className="space-y-2" data-spec-id="email-field">
              <Label htmlFor="email" data-spec-id="email-label">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" data-spec-id="email-input"/>
              {errors.email && (<p className="text-sm text-red-600" data-spec-id="email-error">
                  {errors.email.message}
                </p>)}
            </div>
          </div>

          <Separator data-spec-id="section-separator"/>

          {}
          <div className="space-y-4" data-spec-id="credentials-section">
            <h4 className="font-medium text-sm text-gray-900" data-spec-id="credentials-title">
              Credenciais de Acesso
            </h4>

            <div className="space-y-4" data-spec-id="credentials-grid">
              <div className="space-y-2" data-spec-id="password-field">
                <Label htmlFor="password" data-spec-id="password-label">
                  Senha {!isEditing && '*'}
                  {isEditing && <span className="text-xs text-gray-500" data-spec-id="va8NJSSw6HwxEj0N">(deixe vazio para manter)</span>}
                </Label>
                <div className="relative" data-spec-id="password-input-container">
                  <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} placeholder={isEditing ? 'Nova senha (opcional)' : 'Senha do usuário'} data-spec-id="password-input"/>
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={()=>setShowPassword(!showPassword)} data-spec-id="toggle-password-visibility">
                    {showPassword ? (<EyeOff className="h-4 w-4" data-spec-id="hide-password-icon"/>) : (<Eye className="h-4 w-4" data-spec-id="show-password-icon"/>)}
                  </Button>
                </div>
                {errors.password && (<p className="text-sm text-red-600" data-spec-id="password-error">
                    {errors.password.message}
                  </p>)}
              </div>
            </div>
          </div>

          <Separator data-spec-id="section-separator-2"/>

          {}
          <div className="space-y-4" data-spec-id="permissions-section">
            <h4 className="font-medium text-sm text-gray-900" data-spec-id="permissions-title">
              Tipo e Permissões
            </h4>

            <div className="space-y-2" data-spec-id="user-type-field">
              <Label htmlFor="user_type" data-spec-id="user-type-label">Tipo de Usuário *</Label>
              <Controller name="user_type" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="user-type-select">
                    <SelectTrigger data-spec-id="user-type-trigger">
                      <SelectValue placeholder="Selecione o tipo de usuário" data-spec-id="user-type-placeholder"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="user-type-content">
                      {userTypes.filter((type)=>!type.name.includes('super') && type.is_active !== false).map((type)=>(<SelectItem key={type.id} value={type.name} data-spec-id={`user-type-option-${type.name}`}>
                            {type.display_name}
                          </SelectItem>))}
                    </SelectContent>
                  </Select>)} data-spec-id="bxVZSLwgbGMPkzEm"/>
              {errors.user_type && (<p className="text-sm text-red-600" data-spec-id="user-type-error">
                  {errors.user_type.message}
                </p>)}
            </div>


            {canManageAdmin && (<div className="space-y-3" data-spec-id="admin-permissions">
                {}
                {(isAdministrativeType || isEditingAdministrative) && (<div className="space-y-2" data-spec-id="admin-automatic">
                    <div className="flex items-center space-x-2" data-spec-id="admin-automatic-display">
                      <Checkbox checked={true} disabled={true} data-spec-id="admin-checkbox-disabled"/>
                      <Label className="text-sm font-normal text-gray-600" data-spec-id="admin-checkbox-disabled-label">
                        Usuário Administrador (Automático para tipo Administrativo)
                      </Label>
                    </div>
                    <Alert data-spec-id="admin-automatic-alert">
                      <AlertCircle className="h-4 w-4" data-spec-id="admin-automatic-icon"/>
                      <AlertDescription className="text-xs" data-spec-id="admin-automatic-text">
                        Usuários do tipo Administrativo sempre possuem privilégios de administrador.
                      </AlertDescription>
                    </Alert>
                  </div>)}
                
                {}
                {!isAdministrativeType && !isEditingAdministrative && canEditThisUserAdmin && (<div className="space-y-2" data-spec-id="admin-editable">
                    <Controller name="is_admin" control={control} render={({ field })=>(<div className="flex items-center space-x-2" data-spec-id="admin-checkbox-container">
                        <Checkbox id="is_admin" checked={field.value} onCheckedChange={field.onChange} data-spec-id="admin-checkbox"/>
                        <Label htmlFor="is_admin" className="text-sm font-normal" data-spec-id="admin-checkbox-label">
                          Usuário Administrador
                        </Label>
                      </div>)} data-spec-id="lSlAbkzCViUDYzfr"/>
                    <Alert data-spec-id="admin-info-alert">
                      <AlertCircle className="h-4 w-4" data-spec-id="admin-info-icon"/>
                      <AlertDescription className="text-xs" data-spec-id="admin-info-text">
                        Usuários administradores têm acesso ampliado para gerenciar pacientes e registros.
                      </AlertDescription>
                    </Alert>
                  </div>)}
                
                {}
                {user?.id === currentUser?.id && (<Alert variant="destructive" data-spec-id="self-edit-warning">
                    <AlertCircle className="h-4 w-4" data-spec-id="self-edit-icon"/>
                    <AlertDescription className="text-xs" data-spec-id="self-edit-text">
                      Você não pode alterar seus próprios privilégios administrativos.
                    </AlertDescription>
                  </Alert>)}
              </div>)}
          </div>

          {}
          <div className="flex justify-end gap-3 pt-4" data-spec-id="form-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating || isUpdating} data-spec-id="cancel-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating} data-spec-id="submit-button">
              {isCreating || isUpdating ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
};
export default UserFormModal;
