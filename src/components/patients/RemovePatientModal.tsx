import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
interface RemovePatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    patientName: string;
    isLoading?: boolean;
    'data-spec-id'?: string;
}
const RemovePatientModal: React.FC<RemovePatientModalProps> = ({ isOpen, onClose, onConfirm, patientName, isLoading = false, 'data-spec-id': dataSpecId })=>{
    const [reason, setReason] = useState('');
    const handleConfirm = ()=>{
        onConfirm(reason.trim() || 'Sem motivo especificado');
        setReason('');
    };
    const handleClose = ()=>{
        setReason('');
        onClose();
    };
    return (<Dialog open={isOpen} onOpenChange={handleClose} data-spec-id={dataSpecId}>
      <DialogContent className="sm:max-w-md" data-spec-id="remove-modal-content">
        <DialogHeader data-spec-id="remove-modal-header">
          <DialogTitle className="flex items-center text-red-600" data-spec-id="remove-modal-title">
            <AlertTriangle className="h-5 w-5 mr-2" data-spec-id="warning-icon"/>
            Remover Paciente do Acompanhamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" data-spec-id="remove-modal-body">
          <Alert data-spec-id="warning-alert">
            <AlertTriangle className="h-4 w-4" data-spec-id="alert-icon"/>
            <AlertDescription data-spec-id="warning-message">
              <strong data-spec-id="3HeHtGOdc5cH5ysN">Atenção:</strong> Esta ação irá remover <strong data-spec-id="dF7z1ZammSiNcWpZ">{patientName}</strong> do acompanhamento ativo. 
              A paciente não aparecerá mais nas listas principais, mas seus dados serão preservados 
              no histórico para fins administrativos e auditoria.
            </AlertDescription>
          </Alert>

          <div className="space-y-2" data-spec-id="reason-section">
            <Label htmlFor="removal-reason" data-spec-id="reason-label">
              Motivo da remoção (opcional)
            </Label>
            <Textarea id="removal-reason" placeholder="Ex: Mudança de cidade, transferência para outro médico, abandono do acompanhamento..." value={reason} onChange={(e)=>setReason(e.target.value)} rows={3} className="resize-none" data-spec-id="reason-textarea"/>
          </div>
        </div>

        <DialogFooter className="gap-2" data-spec-id="remove-modal-footer">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} data-spec-id="cancel-button">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading} data-spec-id="confirm-remove-button">
            {isLoading ? 'Removendo...' : 'Confirmar Remoção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
};
export default RemovePatientModal;
