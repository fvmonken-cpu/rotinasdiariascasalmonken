import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
interface ReopenChecklistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklistType: string;
    onConfirm: (reason: string) => void;
}
const ReopenChecklistDialog = ({ open, onOpenChange, checklistType, onConfirm }: ReopenChecklistDialogProps)=>{
    const [reopenReason, setReopenReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleConfirm = async ()=>{
        if (!reopenReason.trim()) {
            toast.error('Por favor, informe o motivo para reabrir este checklist');
            return;
        }
        if (reopenReason.trim().length < 10) {
            toast.error('O motivo deve ter pelo menos 10 caracteres');
            return;
        }
        setIsSubmitting(true);
        try {
            await new Promise((resolve)=>setTimeout(resolve, 500));
            onConfirm(reopenReason.trim());
            toast.success('Checklist reaberto com sucesso!');
            onOpenChange(false);
            setReopenReason('');
        } catch (error) {
            console.error('Error reopening checklist:', error);
            toast.error('Erro ao reabrir checklist. Tente novamente.');
        } finally{
            setIsSubmitting(false);
        }
    };
    const handleCancel = ()=>{
        onOpenChange(false);
        setReopenReason('');
    };
    return (<Dialog open={open} onOpenChange={onOpenChange} data-spec-id="reopen-dialog">
      <DialogContent className="max-w-lg" data-spec-id="reopen-dialog-content">
        <DialogHeader data-spec-id="reopen-dialog-header">
          <DialogTitle className="flex items-center space-x-2" data-spec-id="reopen-dialog-title">
            <RotateCcw className="w-5 h-5 text-orange-600" data-spec-id="reopen-icon"/>
            <span data-spec-id="CLAilR4WtupJXrJh">Reabrir Checklist</span>
          </DialogTitle>
          <DialogDescription data-spec-id="reopen-dialog-description">
            Você já possui um checklist deste tipo finalizado hoje. Para criar um novo, é necessário informar o motivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4" data-spec-id="reopen-content">
          {}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg" data-spec-id="reopen-warning">
            <div className="flex items-start space-x-2" data-spec-id="reopen-warning-content">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" data-spec-id="reopen-warning-icon"/>
              <div data-spec-id="reopen-warning-text">
                <p className="font-medium text-orange-800" data-spec-id="reopen-warning-title">
                  Checklist do tipo "{checklistType}" já finalizado
                </p>
                <p className="text-orange-700 text-sm mt-1" data-spec-id="reopen-warning-description">
                  Esta ação criará um novo checklist do mesmo tipo para o dia de hoje. 
                  O checklist anterior permanecerá salvo no histórico.
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-2" data-spec-id="reopen-reason-section">
            <Label htmlFor="reopen-reason" className="text-base font-medium" data-spec-id="reopen-reason-label">
              Motivo para reabrir *
            </Label>
            <Textarea id="reopen-reason" placeholder="Explique por que precisa criar um novo checklist deste tipo hoje. Por exemplo: 'Mudança de turno', 'Tarefa adicional solicitada', 'Correção necessária', etc." value={reopenReason} onChange={(e)=>setReopenReason(e.target.value)} className="min-h-[100px]" data-spec-id="reopen-reason-input"/>
            <p className="text-sm text-gray-500" data-spec-id="reopen-reason-help">
              Mínimo de 10 caracteres. Este motivo será registrado no histórico.
            </p>
          </div>

          {}
          <div className="flex justify-end space-x-3 pt-4 border-t" data-spec-id="reopen-actions">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting} data-spec-id="cancel-reopen">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!reopenReason.trim() || reopenReason.trim().length < 10 || isSubmitting} className="bg-orange-600 hover:bg-orange-700" data-spec-id="confirm-reopen">
              {isSubmitting ? 'Reabrindo...' : 'Reabrir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
};
export default ReopenChecklistDialog;
