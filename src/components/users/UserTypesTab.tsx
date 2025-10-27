import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Edit, Plus, Check, X, Ban, CheckCircle } from 'lucide-react';
import { useEditUserType, useCreateUserType } from '@/hooks/useUsers';
import UserTypeFormModal from './UserTypeFormModal';
interface UserTypesTabProps {
    userTypes: any[];
    currentUser: any;
}
const UserTypesTab: React.FC<UserTypesTabProps> = ({ userTypes, currentUser })=>{
    const [selectedUserType, setSelectedUserType] = useState<any>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const { mutate: editUserType } = useEditUserType();
    const handleCreateUserType = ()=>{
        setSelectedUserType(null);
        setIsFormModalOpen(true);
    };
    const handleEditUserType = (userType: any)=>{
        setSelectedUserType(userType);
        setIsFormModalOpen(true);
    };
    const handleToggleActive = (userType: any)=>{
        editUserType({
            id: userType.id,
            is_active: !userType.is_active
        });
    };
    const closeModal = ()=>{
        setIsFormModalOpen(false);
        setSelectedUserType(null);
    };
    const canManageUserTypes = currentUser?.is_superuser || currentUser?.is_admin;
    return (<div className="space-y-4" data-spec-id="user-types-tab">
      {}
      <div className="flex items-center justify-between" data-spec-id="tab-header">
        <div data-spec-id="tab-title-section">
          <h3 className="text-lg font-semibold" data-spec-id="tab-title">
            Tipos de Usuário
          </h3>
          <p className="text-sm text-gray-600" data-spec-id="tab-description">
            Gerencie os tipos de usuário disponíveis no sistema
          </p>
        </div>
        
        <Button onClick={handleCreateUserType} data-spec-id="create-type-button">
          <Plus className="h-4 w-4 mr-2" data-spec-id="create-icon"/>
          Novo Tipo
        </Button>
      </div>

      {}
      {userTypes.length === 0 ? (<Alert data-spec-id="no-types-alert">
          <AlertCircle className="h-4 w-4" data-spec-id="alert-icon"/>
          <AlertDescription data-spec-id="alert-message">
            Nenhum tipo de usuário encontrado
          </AlertDescription>
        </Alert>) : (<div className="overflow-x-auto" data-spec-id="types-table-container">
          <Table data-spec-id="types-table">
            <TableHeader data-spec-id="table-header">
              <TableRow data-spec-id="header-row">
                <TableHead className="min-w-[150px]" data-spec-id="name-header">Nome Interno</TableHead>
                <TableHead className="min-w-[200px]" data-spec-id="display-name-header">Nome de Exibição</TableHead>
                <TableHead className="min-w-[300px]" data-spec-id="description-header">Descrição</TableHead>
                <TableHead className="min-w-[100px]" data-spec-id="status-header">Status</TableHead>
                <TableHead className="min-w-[100px]" data-spec-id="actions-header">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-spec-id="table-body">
              {userTypes.filter((userType)=>!userType.name.includes('super')).map((userType)=>(<TableRow key={userType.id} data-spec-id={`type-row-${userType.id}`}>
                  <TableCell className="font-mono text-sm" data-spec-id={`name-cell-${userType.id}`}>
                    {userType.name}
                  </TableCell>
                  <TableCell className="font-medium" data-spec-id={`display-name-cell-${userType.id}`}>
                    {userType.display_name}
                  </TableCell>
                  <TableCell data-spec-id={`description-cell-${userType.id}`}>
                    <div className="max-w-xs" data-spec-id={`description-text-${userType.id}`}>
                      {userType.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell data-spec-id={`status-cell-${userType.id}`}>
                    <div className="flex items-center gap-2" data-spec-id={`status-content-${userType.id}`}>
                      {userType.is_active ? (<>
                          <Check className="h-4 w-4 text-green-600" data-spec-id={`active-icon-${userType.id}`}/>
                          <Badge variant="outline" className="text-green-700 border-green-300" data-spec-id={`active-badge-${userType.id}`}>
                            Ativo
                          </Badge>
                        </>) : (<>
                          <X className="h-4 w-4 text-red-600" data-spec-id={`inactive-icon-${userType.id}`}/>
                          <Badge variant="outline" className="text-red-700 border-red-300" data-spec-id={`inactive-badge-${userType.id}`}>
                            Inativo
                          </Badge>
                        </>)}
                    </div>
                  </TableCell>
                  <TableCell data-spec-id={`actions-cell-${userType.id}`}>
                    <div className="flex gap-1" data-spec-id={`actions-buttons-${userType.id}`}>
                      <Button variant="ghost" size="sm" onClick={()=>handleEditUserType(userType)} className="h-8 w-8 p-0" title="Editar tipo" data-spec-id={`edit-type-${userType.id}`}>
                        <Edit className="h-4 w-4" data-spec-id={`edit-icon-${userType.id}`}/>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={()=>handleToggleActive(userType)} className={`h-8 w-8 p-0 ${userType.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`} title={userType.is_active ? 'Desativar tipo' : 'Ativar tipo'} data-spec-id={`toggle-status-${userType.id}`}>
                        {userType.is_active ? <Ban className="h-4 w-4" data-spec-id={`deactivate-icon-${userType.id}`}/> : <CheckCircle className="h-4 w-4" data-spec-id={`activate-icon-${userType.id}`}/>}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </div>)}

      {}
      <Alert data-spec-id="info-alert">
        <AlertCircle className="h-4 w-4" data-spec-id="info-icon"/>
        <AlertDescription data-spec-id="info-message">
          <strong data-spec-id="E8PpXreZfVa1WH4c">Nota:</strong> Tipos de usuário definem as categorias profissionais disponíveis. 
          Apenas superusuários podem criar ou modificar tipos de usuário.
        </AlertDescription>
      </Alert>

      {}
      {isFormModalOpen && (<UserTypeFormModal isOpen={isFormModalOpen} onClose={closeModal} userType={selectedUserType} data-spec-id="user-type-form-modal-instance"/>)}
    </div>);
};
export default UserTypesTab;
