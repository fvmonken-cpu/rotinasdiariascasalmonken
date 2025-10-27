import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useDeleteUser } from '@/hooks/useUsers';
interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    currentUser: any;
}
const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, user, currentUser })=>{
    const { mutate: deleteUser, isPending } = useDeleteUser();
    const handleDelete = ()=>{
        if (user?.id && currentUser?.id) {
            deleteUser({
                userId: user.id,
                currentUserId: currentUser.id
            }, {
                onSuccess: ()=>{
                    onClose();
                }
            });
        }
    };
    if (!user) return null;
    return (<AlertDialog open={isOpen} onOpenChange={onClose} data-spec-id="delete-user-modal">
      <AlertDialogContent data-spec-id="modal-content">
        <AlertDialogHeader data-spec-id="modal-header">
          <AlertDialogTitle className="flex items-center gap-2" data-spec-id="modal-title">
            <AlertTriangle className="h-5 w-5 text-red-600" data-spec-id="warning-icon"/>
            Excluir Usuário
          </AlertDialogTitle>
          <AlertDialogDescription data-spec-id="modal-description">
            Você está prestes a excluir permanentemente o usuário:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4" data-spec-id="user-info">
          <div className="p-4 bg-gray-50 rounded-lg" data-spec-id="user-details">
            <p className="font-medium text-gray-900" data-spec-id="user-name">
              {user.full_name}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="user-email">
              {user.email}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="user-type">
              Tipo: {user.user_type_info?.display_name || user.user_type}
            </p>
          </div>

          <Alert variant="destructive" data-spec-id="warning-alert">
            <AlertTriangle className="h-4 w-4" data-spec-id="alert-icon"/>
            <AlertDescription data-spec-id="warning-text">
              <strong data-spec-id="dDy65Oi9CSFdMOo3">Atenção:</strong> O usuário será removido do sistema. Suas associações com pacientes ativas serão removidas (definidas como "não atribuído"), mas os registros de nascimentos permanecerão inalterados para preservar o histórico.
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter data-spec-id="modal-footer">
          <AlertDialogCancel onClick={onClose} disabled={isPending} data-spec-id="cancel-button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700 focus:ring-red-600" data-spec-id="confirm-delete-button">
            {isPending ? 'Excluindo...' : 'Excluir Usuário'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
};
export default DeleteUserModal;
