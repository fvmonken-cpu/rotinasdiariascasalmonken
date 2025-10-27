import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Edit, Trash2, Plus, Shield, ShieldCheck, User, UserCheck, UserX, KeyRound, ShieldPlus, ShieldMinus } from 'lucide-react';
import { useToggleUserStatus, useResetUserPassword, useToggleAdminPrivileges } from '@/hooks/useUsers';
import UserFormModal from './UserFormModal';
import DeleteUserModal from './DeleteUserModal';
interface UserManagementTabProps {
    users: any[];
    userTypes: any[];
    currentUser: any;
}
const UserManagementTab: React.FC<UserManagementTabProps> = ({ users, userTypes, currentUser })=>{
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { mutate: toggleUserStatus } = useToggleUserStatus();
    const { mutate: resetPassword } = useResetUserPassword();
    const { mutate: toggleAdminPrivileges } = useToggleAdminPrivileges();
    const handleCreateUser = ()=>{
        setSelectedUser(null);
        setIsFormModalOpen(true);
    };
    const handleEditUser = (user: any)=>{
        setSelectedUser(user);
        setIsFormModalOpen(true);
    };
    const handleDeleteUser = (user: any)=>{
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };
    const handleToggleStatus = (user: any)=>{
        toggleUserStatus({
            userId: user.id,
            isActive: !user.is_active
        });
    };
    const handleResetPassword = (user: any)=>{
        resetPassword(user.id);
    };
    const handleToggleAdminPrivileges = (user: any)=>{
        toggleAdminPrivileges({
            userId: user.id,
            isAdmin: !user.is_admin
        });
    };
    const closeModals = ()=>{
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
    };
    const getUserTypeLabel = (userType: string)=>{
        const type = userTypes.find((t)=>t.name === userType);
        return type ? type.display_name : userType;
    };
    const canEditUser = (user: any)=>{
        if (currentUser?.is_superuser) return true;
        if (user.is_superuser) return false;
        return currentUser?.is_admin;
    };
    const canDeleteUser = (user: any)=>{
        if (user.is_superuser) return false;
        if (user.id === currentUser?.id) return false;
        return currentUser?.is_admin || currentUser?.is_superuser;
    };
    const canToggleStatus = (user: any)=>{
        if (user.id === currentUser?.id) return false;
        if (user.is_superuser) return false;
        return currentUser?.is_admin || currentUser?.is_superuser;
    };
    const canResetPassword = (user: any)=>{
        if (currentUser?.is_superuser && user.id !== currentUser?.id) return true;
        if (currentUser?.is_admin && !user.is_superuser && user.id !== currentUser?.id) return true;
        return false;
    };
    const canChangeOwnPassword = (user: any)=>{
        return user.id === currentUser?.id;
    };
    return (<div className="space-y-4" data-spec-id="user-management-tab">
      {}
      <div className="flex items-center justify-between" data-spec-id="tab-header">
        <div data-spec-id="tab-title-section">
          <h3 className="text-lg font-semibold" data-spec-id="tab-title">
            Gerenciar Usuários
          </h3>
          <p className="text-sm text-gray-600" data-spec-id="tab-description">
            Visualize, crie e edite usuários do sistema
          </p>
        </div>
        
        <Button onClick={handleCreateUser} data-spec-id="create-user-button">
          <Plus className="h-4 w-4 mr-2" data-spec-id="create-icon"/>
          Novo Usuário
        </Button>
      </div>

      {}
      {users.length === 0 ? (<Alert data-spec-id="no-users-alert">
          <AlertCircle className="h-4 w-4" data-spec-id="alert-icon"/>
          <AlertDescription data-spec-id="alert-message">
            Nenhum usuário encontrado
          </AlertDescription>
        </Alert>) : (<div className="overflow-x-auto" data-spec-id="users-table-container">
          <Table data-spec-id="users-table">
            <TableHeader data-spec-id="table-header">
              <TableRow data-spec-id="header-row">
                <TableHead className="min-w-[200px]" data-spec-id="name-header">Nome</TableHead>
                <TableHead className="min-w-[200px]" data-spec-id="email-header">Email</TableHead>
                <TableHead className="min-w-[150px]" data-spec-id="type-header">Tipo</TableHead>
                <TableHead className="min-w-[100px]" data-spec-id="status-header">Status</TableHead>
                <TableHead className="min-w-[100px]" data-spec-id="permissions-header">Permissões</TableHead>
                <TableHead className="min-w-[150px]" data-spec-id="actions-header">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-spec-id="table-body">
              {users.map((user)=>(<TableRow key={user.id} data-spec-id={`user-row-${user.id}`}>
                  <TableCell className="font-medium" data-spec-id={`name-cell-${user.id}`}>
                    <div className="flex items-center gap-2" data-spec-id={`name-content-${user.id}`}>
                      {user.is_superuser ? (<ShieldCheck className="h-4 w-4 text-red-600" data-spec-id={`super-icon-${user.id}`}/>) : user.is_admin ? (<Shield className="h-4 w-4 text-blue-600" data-spec-id={`admin-icon-${user.id}`}/>) : (<User className="h-4 w-4 text-gray-400" data-spec-id={`user-icon-${user.id}`}/>)}
                      <div data-spec-id={`name-text-${user.id}`}>
                        <div data-spec-id={`display-name-${user.id}`}>{user.display_name || user.full_name}</div>
                        {user.display_name && user.display_name !== user.full_name && (<div className="text-xs text-gray-500" data-spec-id={`full-name-${user.id}`}>
                            {user.full_name}
                          </div>)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-spec-id={`email-cell-${user.id}`}>
                    {user.email}
                  </TableCell>
                  <TableCell data-spec-id={`type-cell-${user.id}`}>
                    <Badge variant="outline" data-spec-id={`type-badge-${user.id}`}>
                      {getUserTypeLabel(user.user_type)}
                    </Badge>
                  </TableCell>
                  <TableCell data-spec-id={`status-cell-${user.id}`}>
                    <Badge variant={user.is_active !== false ? "default" : "secondary"} data-spec-id={`status-badge-${user.id}`}>
                      {user.is_active !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell data-spec-id={`permissions-cell-${user.id}`}>
                    <div className="flex flex-col gap-1" data-spec-id={`permissions-content-${user.id}`}>
                      {user.is_superuser && (<Badge variant="destructive" className="text-xs" data-spec-id={`super-badge-${user.id}`}>
                          Superusuário
                        </Badge>)}
                      {user.is_admin && (<Badge variant="secondary" className="text-xs" data-spec-id={`admin-badge-${user.id}`}>
                          Admin
                        </Badge>)}
                      {user.has_admin_power && (<Badge variant="outline" className="text-xs" data-spec-id={`admin-power-badge-${user.id}`}>
                          Poder Admin
                        </Badge>)}
                    </div>
                  </TableCell>
                  <TableCell data-spec-id={`actions-cell-${user.id}`}>
                    <div className="flex gap-1" data-spec-id={`actions-buttons-${user.id}`}>
                      {!(user.is_superuser && user.id === currentUser?.id) && (<Button variant="ghost" size="sm" onClick={()=>handleEditUser(user)} className="h-8 w-8 p-0" title="Editar usuário" data-spec-id={`edit-user-${user.id}`}>
                        <Edit className="h-4 w-4" data-spec-id={`edit-icon-${user.id}`}/>
                      </Button>)}
                      
                      {!user.is_superuser && (<Button variant="ghost" size="sm" onClick={()=>handleToggleStatus(user)} className={`h-8 w-8 p-0 ${user.is_active !== false ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`} title={user.is_active !== false ? 'Inativar usuário' : 'Ativar usuário'} data-spec-id={`toggle-status-${user.id}`}>
                          {user.is_active !== false ? <UserX className="h-4 w-4" data-spec-id={`deactivate-icon-${user.id}`}/> : <UserCheck className="h-4 w-4" data-spec-id={`activate-icon-${user.id}`}/>}
                        </Button>)}
                      
                      {user.id !== currentUser?.id && (<Button variant="ghost" size="sm" onClick={()=>handleResetPassword(user)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700" title="Redefinir senha" data-spec-id={`reset-password-${user.id}`}>
                          <KeyRound className="h-4 w-4" data-spec-id={`reset-icon-${user.id}`}/>
                        </Button>)}
                      
                      {user.id === currentUser?.id && (<Button variant="ghost" size="sm" onClick={()=>handleResetPassword(user)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700" title="Alterar minha senha" data-spec-id={`change-own-password-${user.id}`}>
                          <KeyRound className="h-4 w-4" data-spec-id={`own-password-icon-${user.id}`}/>
                        </Button>)}
                      
                      {!user.is_superuser && user.id !== currentUser?.id && (currentUser?.is_superuser || (currentUser?.is_admin && currentUser?.user_type === 'administrativo')) && (<Button variant="ghost" size="sm" onClick={()=>handleToggleAdminPrivileges(user)} className={`h-8 w-8 p-0 ${user.is_admin ? 'text-purple-600 hover:text-purple-700' : 'text-indigo-600 hover:text-indigo-700'}`} title={user.is_admin ? 'Remover privilégios administrativos' : 'Conceder privilégios administrativos'} data-spec-id={`toggle-admin-${user.id}`}>
                          {user.is_admin ? <ShieldMinus className="h-4 w-4" data-spec-id={`remove-admin-icon-${user.id}`}/> : <ShieldPlus className="h-4 w-4" data-spec-id={`add-admin-icon-${user.id}`}/>}
                        </Button>)}
                      
                      {!user.is_superuser && user.id !== currentUser?.id && (<Button variant="ghost" size="sm" onClick={()=>handleDeleteUser(user)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700" title="Excluir usuário" data-spec-id={`delete-user-${user.id}`}>
                          <Trash2 className="h-4 w-4" data-spec-id={`delete-icon-${user.id}`}/>
                        </Button>)}
                    </div>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </div>)}

      {}
      {isFormModalOpen && (<UserFormModal isOpen={isFormModalOpen} onClose={closeModals} user={selectedUser} userTypes={userTypes} currentUser={currentUser} data-spec-id="user-form-modal-instance"/>)}

      {isDeleteModalOpen && selectedUser && (<DeleteUserModal isOpen={isDeleteModalOpen} onClose={closeModals} user={selectedUser} currentUser={currentUser} data-spec-id="delete-user-modal-instance"/>)}
    </div>);
};
export default UserManagementTab;
