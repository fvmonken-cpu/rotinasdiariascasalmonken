import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCancelBirth } from '@/hooks/usePatients';
import { Loader2, AlertTriangle } from 'lucide-react';
interface CancelBirthModalProps {
    isOpen: boolean;
    onClose: () => void;
    birthData: any;
}
const CancelBirthModal: React.FC<CancelBirthModalProps> = ({ isOpen, onClose, birthData })=>{
    const cancelBirthMutation = useCancelBirth();
    const handleCancel = async ()=>{
        try {
            await cancelBirthMutation.mutateAsync({
                bornPatientId: birthData.id,
                patientId: birthData.patient_id
            });
            onClose();
        } catch (error) {
            console.error('Erro ao cancelar nascimento:', error);
        }
    };
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="cancel-birth-modal">
      <DialogContent className="max-w-md" data-spec-id="cancel-birth-content">
        <DialogHeader data-spec-id="cancel-birth-header">
          <DialogTitle className="flex items-center gap-2" data-spec-id="cancel-birth-title">
            <AlertTriangle className="h-5 w-5 text-red-500" data-spec-id="warning-icon"/>
            Cancelar Registro de Nascimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" data-spec-id="cancel-birth-body">
          <Alert data-spec-id="warning-alert">
            <AlertTriangle className="h-4 w-4" data-spec-id="alert-icon"/>
            <AlertDescription data-spec-id="alert-description">
              Esta ação irá cancelar o registro de nascimento e devolver a paciente para a lista de gestantes ativas.
            </AlertDescription>
          </Alert>

          <div className="space-y-2" data-spec-id="birth-details">
            <p data-spec-id="patient-name">
              <strong data-spec-id="qeT4Qx6l6NAdAS8E">Paciente:</strong> {birthData?.full_name}
            </p>
            <p data-spec-id="baby-name">
              <strong data-spec-id="qRaX9Q8bLzmBjvfl">Bebê:</strong> {birthData?.baby_name}
            </p>
            <p data-spec-id="birth-date">
              <strong data-spec-id="HFM50BkoCsmZFec4">Data do Nascimento:</strong> {new Date(birthData?.birth_date).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-3" data-spec-id="consequences">
            <p className="text-sm font-medium text-gray-700" data-spec-id="consequences-title">
              O que acontecerá:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4" data-spec-id="consequences-list">
              <li data-spec-id="consequence-1">• O registro de nascimento será permanentemente excluído</li>
              <li data-spec-id="consequence-2">• A paciente voltará para a lista de gestantes ativas</li>
              <li data-spec-id="consequence-3">• Todos os dados de nascimento serão perdidos</li>
              <li data-spec-id="consequence-4">• Esta ação não pode ser desfeita</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end pt-4" data-spec-id="action-buttons">
            <Button variant="outline" onClick={onClose} disabled={cancelBirthMutation.isPending} data-spec-id="keep-button">
              Manter Registro
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelBirthMutation.isPending} data-spec-id="cancel-birth-button">
              {cancelBirthMutation.isPending && (<Loader2 className="mr-2 h-4 w-4 animate-spin" data-spec-id="loading-icon"/>)}
              Cancelar Nascimento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
};
export default CancelBirthModal;
