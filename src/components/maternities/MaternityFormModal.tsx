import React from 'react';
import { useForm } from 'react-hook-form';
import { useMaternities } from '@/hooks/useMaternities';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2 } from 'lucide-react';
interface MaternityFormData {
    name: string;
    is_active?: boolean;
}
interface MaternityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    maternity?: any;
}
const MaternityFormModal: React.FC<MaternityFormModalProps> = ({ isOpen, onClose, maternity })=>{
    const { createMaternity, updateMaternity, isCreating, isUpdating } = useMaternities();
    const isEditing = !!maternity;
    const isLoading = isCreating || isUpdating;
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<MaternityFormData>({
        defaultValues: {
            name: maternity?.name || '',
            is_active: maternity?.is_active !== undefined ? maternity.is_active : true
        }
    });
    React.useEffect(()=>{
        if (maternity) {
            reset({
                name: maternity.name || '',
                is_active: maternity.is_active !== undefined ? maternity.is_active : true
            });
        } else {
            reset({
                name: '',
                is_active: true
            });
        }
    }, [
        maternity,
        reset
    ]);
    const onSubmit = (data: MaternityFormData)=>{
        if (isEditing) {
            updateMaternity({
                id: maternity.id,
                ...data
            });
        } else {
            createMaternity(data);
        }
        onClose();
    };
    const handleClose = ()=>{
        reset();
        onClose();
    };
    const isActiveValue = watch('is_active');
    return (<Dialog open={isOpen} onOpenChange={handleClose} data-spec-id="OFoMocRnnIUREY0u">
      <DialogContent className="sm:max-w-md" data-spec-id="maternity-form-modal">
        <DialogHeader data-spec-id="modal-header">
          <DialogTitle className="flex items-center" data-spec-id="modal-title">
            <Building2 className="h-5 w-5 mr-2" data-spec-id="building-icon"/>
            {isEditing ? 'Editar Maternidade' : 'Nova Maternidade'}
          </DialogTitle>
          <DialogDescription data-spec-id="modal-description">
            {isEditing ? 'Atualize os dados da maternidade.' : 'Preencha os dados da nova maternidade.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-spec-id="maternity-form">
          <div className="space-y-2" data-spec-id="name-field">
            <Label htmlFor="name" data-spec-id="name-label">
              Nome da Maternidade *
            </Label>
            <Input id="name" {...register('name', {
        required: 'Nome é obrigatório'
    })} placeholder="Mater Dei Santo Agostinho" data-spec-id="name-input"/>
            {errors.name && (<p className="text-sm text-red-600" data-spec-id="name-error">
                {errors.name.message}
              </p>)}
          </div>



          {isEditing && (<div className="flex items-center space-x-2" data-spec-id="active-field">
              <Switch id="is_active" checked={isActiveValue} onCheckedChange={(checked)=>setValue('is_active', checked)} data-spec-id="active-switch"/>
              <Label htmlFor="is_active" className="text-sm" data-spec-id="active-label">
                Maternidade ativa
              </Label>
            </div>)}

          <DialogFooter data-spec-id="modal-footer">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} data-spec-id="cancel-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} data-spec-id="save-button">
              {isLoading ? (isEditing ? 'Atualizando...' : 'Criando...') : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
};
export default MaternityFormModal;
