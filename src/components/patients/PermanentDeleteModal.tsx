import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
interface PermanentDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    patientName: string;
    isLoading?: boolean;
}
const PermanentDeleteModal: React.FC<PermanentDeleteModalProps> = ({ isOpen, onClose, onConfirm, patientName, isLoading = false })=>{
    const [confirmation, setConfirmation] = useState('');
    const expectedText = 'EXCLUIR DEFINITIVAMENTE';
    const canConfirm = confirmation === expectedText;
    const handleConfirm = ()=>{
        if (canConfirm) {
            onConfirm();
        }
    };
    const handleClose = ()=>{
        setConfirmation('');
        onClose();
    };
    return (<AlertDialog open={isOpen} onOpenChange={handleClose} data-spec-id="bTCieOiKYynVwa6f">
      <AlertDialogContent className="max-w-md" data-spec-id="permanent-delete-modal">
        <AlertDialogHeader data-spec-id="modal-header">
          <div className="flex items-center space-x-3" data-spec-id="header-content">
            <div className="flex-shrink-0" data-spec-id="warning-icon-container">
              <AlertTriangle className="h-8 w-8 text-red-600" data-spec-id="warning-icon"/>
            </div>
            <div data-spec-id="header-text">
              <AlertDialogTitle className="text-red-900" data-spec-id="modal-title">
                ⚠️ EXCLUSÃO DEFINITIVA
              </AlertDialogTitle>
              <AlertDialogDescription className="text-red-700" data-spec-id="modal-subtitle">
                Esta ação é irreversível!
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4" data-spec-id="modal-body">
          <AlertDialogDescription className="text-sm text-gray-700" data-spec-id="warning-description">
            Você está prestes a <strong data-spec-id="R7JXOubFZwTkK16T">excluir definitivamente</strong> a paciente:
          </AlertDialogDescription>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-spec-id="patient-info">
            <p className="font-semibold text-red-900" data-spec-id="patient-name">
              {patientName}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-spec-id="consequences-warning">
            <h4 className="font-semibold text-yellow-800 mb-2" data-spec-id="consequences-title">
              Consequências desta ação:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1" data-spec-id="consequences-list">
              <li data-spec-id="consequence-1">• A paciente será removida permanentemente do banco de dados</li>
              <li data-spec-id="consequence-2">• Todos os dados relacionados serão perdidos</li>
              <li data-spec-id="consequence-3">• Esta ação NÃO pode ser desfeita</li>
              <li data-spec-id="consequence-4">• Apenas o histórico de exclusão será mantido</li>
            </ul>
          </div>

          <div className="space-y-2" data-spec-id="confirmation-section">
            <Label htmlFor="confirmation" className="text-sm font-medium text-gray-700" data-spec-id="confirmation-label">
              Para confirmar, digite: <span className="font-mono bg-gray-100 px-1 rounded" data-spec-id="expected-text">{expectedText}</span>
            </Label>
            <Input id="confirmation" type="text" value={confirmation} onChange={(e)=>setConfirmation(e.target.value.toUpperCase())} placeholder="Digite exatamente como mostrado acima" className={confirmation && !canConfirm ? 'border-red-300 focus:border-red-500' : ''} data-spec-id="confirmation-input"/>
            {confirmation && !canConfirm && (<p className="text-sm text-red-600" data-spec-id="confirmation-error">
                Texto não confere. Digite exatamente: {expectedText}
              </p>)}
          </div>
        </div>

        <AlertDialogFooter data-spec-id="modal-footer">
          <AlertDialogCancel onClick={handleClose} disabled={isLoading} data-spec-id="cancel-button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!canConfirm || isLoading} className="bg-red-600 hover:bg-red-700 text-white" data-spec-id="confirm-delete-button">
            {isLoading ? 'Excluindo...' : 'Excluir Definitivamente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
};
export default PermanentDeleteModal;
