import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateUserType, useEditUserType } from '@/hooks/useUsers';
const userTypeSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').regex(/^[a-z_]+$/, 'Nome deve conter apenas letras minúsculas e underscore'),
    display_name: z.string().min(2, 'Nome de exibição deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    is_active: z.boolean().default(true)
});
type UserTypeFormData = z.infer<typeof userTypeSchema>;
interface UserTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    userType?: any;
}
const UserTypeFormModal: React.FC<UserTypeFormModalProps> = ({ isOpen, onClose, userType })=>{
    const isEditing = !!userType;
    const { mutate: createUserType, isPending: isCreating } = useCreateUserType();
    const { mutate: editUserType, isPending: isUpdating } = useEditUserType();
    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<UserTypeFormData>({
        resolver: zodResolver(userTypeSchema),
        defaultValues: {
            name: '',
            display_name: '',
            description: '',
            is_active: true
        }
    });
    const watchedDisplayName = watch('display_name');
    useEffect(()=>{
        if (watchedDisplayName && !isEditing) {
            const generatedName = watchedDisplayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '').replace(/\s+/g, '_').trim();
            setValue('name', generatedName);
        }
    }, [
        watchedDisplayName,
        isEditing,
        setValue
    ]);
    useEffect(()=>{
        if (userType && isOpen) {
            reset({
                name: userType.name,
                display_name: userType.display_name,
                description: userType.description || '',
                is_active: userType.is_active !== false
            });
        } else if (!userType && isOpen) {
            reset({
                name: '',
                display_name: '',
                description: '',
                is_active: true
            });
        }
    }, [
        userType,
        isOpen,
        reset
    ]);
    const onSubmit = (data: UserTypeFormData)=>{
        console.log('Submetendo formulário de tipo de usuário:', data);
        if (isEditing) {
            editUserType({
                id: userType.id,
                ...data
            }, {
                onSuccess: ()=>{
                    onClose();
                    reset();
                }
            });
        } else {
            createUserType(data, {
                onSuccess: ()=>{
                    onClose();
                    reset();
                }
            });
        }
    };
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="user-type-form-modal">
      <DialogContent className="max-w-lg" data-spec-id="modal-content">
        <DialogHeader data-spec-id="modal-header">
          <DialogTitle data-spec-id="modal-title">
            {isEditing ? 'Editar Tipo de Usuário' : 'Novo Tipo de Usuário'}
          </DialogTitle>
          <DialogDescription data-spec-id="modal-description">
            {isEditing ? 'Edite as informações do tipo de usuário' : 'Crie um novo tipo de usuário para o sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-spec-id="user-type-form">
          {}
          <div className="space-y-4" data-spec-id="basic-info-section">
            <div className="space-y-2" data-spec-id="display-name-field">
              <Label htmlFor="display_name" data-spec-id="display-name-label">Nome de Exibição *</Label>
              <Input id="display_name" {...register('display_name')} placeholder="Ex: Médico Obstetra" data-spec-id="display-name-input"/>
              {errors.display_name && (<p className="text-sm text-red-600" data-spec-id="display-name-error">
                  {errors.display_name.message}
                </p>)}
            </div>

            <div className="space-y-2" data-spec-id="name-field">
              <Label htmlFor="name" data-spec-id="name-label">Nome Técnico *</Label>
              <Input id="name" {...register('name')} placeholder="Ex: medico_obstetra" data-spec-id="name-input" disabled={isEditing}/>
              <p className="text-xs text-gray-500" data-spec-id="name-help">
                {isEditing ? 'O nome técnico não pode ser alterado após a criação' : 'Gerado automaticamente. Use apenas letras minúsculas e underscore.'}
              </p>
              {errors.name && (<p className="text-sm text-red-600" data-spec-id="name-error">
                  {errors.name.message}
                </p>)}
            </div>

            <div className="space-y-2" data-spec-id="description-field">
              <Label htmlFor="description" data-spec-id="description-label">Descrição</Label>
              <Textarea id="description" {...register('description')} placeholder="Descreva as responsabilidades deste tipo de usuário..." rows={3} data-spec-id="description-input"/>
              {errors.description && (<p className="text-sm text-red-600" data-spec-id="description-error">
                  {errors.description.message}
                </p>)}
            </div>
          </div>



          {}
          <div className="flex justify-end gap-3 pt-4" data-spec-id="form-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating || isUpdating} data-spec-id="cancel-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating} data-spec-id="submit-button">
              {isCreating || isUpdating ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Tipo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
};
export default UserTypeFormModal;
