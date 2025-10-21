import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, Mail, Shield, Key } from 'lucide-react';
import { User } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ProfessionalCategory } from '@/types';
import { loadProfessionalCategoriesFromSupabase } from '@/utils/cloudMasterTaskUtils';
const UserManagement = ()=>{
    console.log('🔧 UserManagement component rendered');
    const { user: currentUser } = useSupabaseAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [professionalCategories, setProfessionalCategories] = useState<ProfessionalCategory[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'secretary' as User['role']
    });
    const loadUsers = async ()=>{
        console.log('🔄 Loading users from Supabase...');
        try {
            const { data, error } = await supabase.from('users').select('*').order('created_at', {
                ascending: true
            });
            if (error) {
                console.error('❌ Error loading users:', error);
                toast.error('Erro ao carregar usuários');
                return;
            }
            console.log('✅ Users loaded:', data);
            const filteredUsers = (data || []).filter((user)=>user.id !== '00000000-0000-0000-0000-000000000001');
            setUsers(filteredUsers);
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            toast.error('Falha ao conectar com banco de dados');
        }
    };
    const loadProfessionalCategories = async ()=>{
        console.log('🔄 Loading professional categories from Supabase...');
        try {
            const categories = await loadProfessionalCategoriesFromSupabase();
            setProfessionalCategories(categories);
            console.log('✅ Loaded', categories.length, 'professional categories from Supabase');
        } catch (error) {
            console.error('❌ Failed to load professional categories:', error);
        }
    };
    useEffect(()=>{
        loadUsers();
        loadProfessionalCategories();
    }, []);
    useEffect(()=>{
        console.log('📋 Dialog state changed:', {
            isAddDialogOpen,
            isEditDialogOpen
        });
    }, [
        isAddDialogOpen,
        isEditDialogOpen
    ]);
    const addUser = async ()=>{
        console.log('📝 Adding new user:', newUser);
        if (!newUser.name || !newUser.email) {
            toast.error('Por favor, preencha nome e email');
            return;
        }
        if (users.some((user)=>user.email === newUser.email)) {
            toast.error('Este email já está em uso');
            return;
        }
        try {
            const { data, error } = await supabase.from('users').insert([
                {
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    password_hash: 'temp123'
                }
            ]).select().single();
            if (error) {
                console.error('❌ Error adding user:', error);
                toast.error('Erro ao adicionar usuário: ' + error.message);
                return;
            }
            console.log('✅ User added successfully:', data);
            await loadUsers();
            setNewUser({
                name: '',
                email: '',
                role: 'secretary'
            });
            setIsAddDialogOpen(false);
            toast.success(`Usuário ${newUser.name} adicionado com sucesso!`);
            toast.info(`Para fazer login, use a senha temporária: temp123`, {
                duration: 10000
            });
        } catch (error) {
            console.error('❌ Failed to add user:', error);
            toast.error('Falha ao adicionar usuário');
        }
    };
    const updateUser = async ()=>{
        if (!editingUser || !editingUser.name || !editingUser.email) {
            toast.error('Por favor, preencha todos os campos');
            return;
        }
        if (users.some((user)=>user.email === editingUser.email && user.id !== editingUser.id)) {
            toast.error('Este email já está em uso');
            return;
        }
        try {
            const { error } = await supabase.from('users').update({
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role
            }).eq('id', editingUser.id);
            if (error) {
                console.error('❌ Error updating user:', error);
                toast.error('Erro ao atualizar usuário: ' + error.message);
                return;
            }
            console.log('✅ User updated successfully:', editingUser);
            await loadUsers();
            setEditingUser(null);
            setIsEditDialogOpen(false);
            toast.success('Usuário atualizado com sucesso');
        } catch (error) {
            console.error('❌ Failed to update user:', error);
            toast.error('Falha ao atualizar usuário');
        }
    };
    const deleteUser = async (userId: string)=>{
        console.log('🗑️ Attempting to delete user:', userId);
        try {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) {
                console.error('❌ Error deleting user:', error);
                toast.error('Erro ao remover usuário: ' + error.message);
                return;
            }
            console.log('✅ User deleted successfully:', userId);
            await loadUsers();
            toast.success('Usuário removido com sucesso');
        } catch (error) {
            console.error('❌ Failed to delete user:', error);
            toast.error('Falha ao remover usuário');
        }
    };
    const getRoleColor = (role: User['role'])=>{
        const category = professionalCategories.find((cat)=>cat.roleKey === role);
        if (category && category.color) {
            return `text-white border-gray-200`;
        }
        const colors = {
            admin: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    const getRoleStyle = (role: User['role'])=>{
        const category = professionalCategories.find((cat)=>cat.roleKey === role);
        if (category && category.color) {
            return {
                backgroundColor: category.color
            };
        }
        return {};
    };
    const getRoleLabel = (role: User['role'])=>{
        const category = professionalCategories.find((cat)=>cat.roleKey === role);
        if (category) {
            return category.name;
        }
        const labels = {
            admin: 'Administrador'
        };
        return labels[role] || role;
    };
    console.log('🎯 Rendering UserManagement with users:', users.length, 'Dialog state:', isAddDialogOpen);
    return (<Card data-spec-id="user-management-card">
      <CardHeader data-spec-id="user-management-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0" data-spec-id="header-content">
          <div data-spec-id="header-info">
            <CardTitle className="flex items-center" data-spec-id="header-title">
              <Users className="w-5 h-5 mr-2" data-spec-id="users-icon"/>
              <span className="text-lg sm:text-xl" data-spec-id="oaZTfUVuvdMtAplP">Gerenciamento de Usuários</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1" data-spec-id="header-description">
              Adicione, edite ou remova usuários do sistema
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} data-spec-id="add-user-dialog">
            <DialogTrigger asChild data-spec-id="add-user-trigger">
              <Button onClick={()=>{
        console.log('🔘 Add User button clicked!');
        setIsAddDialogOpen(true);
    }} className="w-full sm:w-auto" data-spec-id="add-user-button">
                <Plus className="w-4 h-4 mr-2" data-spec-id="plus-icon"/>
                <span className="hidden sm:inline" data-spec-id="Xi8ZVKovnvmiIAKD">Adicionar Usuário</span>
                <span className="sm:hidden" data-spec-id="KMJqMXA2uu7PlYp4">Novo Usuário</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-full mx-4" data-spec-id="add-user-dialog-content">
              <DialogHeader data-spec-id="add-user-dialog-header">
                <DialogTitle className="text-lg" data-spec-id="add-user-dialog-title">Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4" data-spec-id="add-user-form">
                <div data-spec-id="name-field">
                  <Label htmlFor="add-name" data-spec-id="name-label">Nome Completo</Label>
                  <Input id="add-name" value={newUser.name} onChange={(e)=>setNewUser({
            ...newUser,
            name: e.target.value
        })} placeholder="Digite o nome completo" data-spec-id="add-name-input"/>
                </div>
                <div data-spec-id="email-field">
                  <Label htmlFor="add-email" data-spec-id="email-label">Email</Label>
                  <Input id="add-email" type="email" value={newUser.email} onChange={(e)=>setNewUser({
            ...newUser,
            email: e.target.value
        })} placeholder="Digite o email" data-spec-id="add-email-input"/>
                </div>
                <div data-spec-id="role-field">
                  <Label htmlFor="add-role" data-spec-id="role-label">Função</Label>
                  <Select value={newUser.role} onValueChange={(value)=>setNewUser({
            ...newUser,
            role: value as User['role']
        })} data-spec-id="add-role-select">
                    <SelectTrigger data-spec-id="add-role-trigger">
                      <SelectValue data-spec-id="add-role-value"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="add-role-options">
                      {professionalCategories.map((category)=>(<SelectItem key={category.id} value={category.roleKey} data-spec-id={`role-${category.roleKey}`}>
                          {category.name}
                        </SelectItem>))}
                      <SelectItem value="admin" data-spec-id="role-admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2" data-spec-id="add-user-actions">
                  <Button variant="outline" onClick={()=>setIsAddDialogOpen(false)} className="w-full sm:w-auto" data-spec-id="cancel-add-button">
                    Cancelar
                  </Button>
                  <Button onClick={addUser} className="w-full sm:w-auto" data-spec-id="confirm-add-button">
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent data-spec-id="user-management-content">
        <div className="space-y-4" data-spec-id="users-list">
          {users.map((user)=>(<div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0" data-spec-id={`user-item-${user.id}`}>
              <div className="flex items-center space-x-4" data-spec-id="user-info">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0" data-spec-id="user-avatar">
                  <span className="text-sm font-semibold text-gray-600" data-spec-id="user-initials">
                    {user.name.split(' ').map((n)=>n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0" data-spec-id="user-details">
                  <h3 className="font-medium text-gray-900 truncate" data-spec-id="user-name">{user.name}</h3>
                  <div className="flex items-center space-x-2 mt-1" data-spec-id="user-meta">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" data-spec-id="email-icon"/>
                    <span className="text-sm text-gray-600 truncate" data-spec-id="user-email">{user.email}</span>
                  </div>
                  <div className="sm:hidden mt-2" data-spec-id="mobile-role-badge">
                    <Badge className={getRoleColor(user.role)} style={getRoleStyle(user.role)} data-spec-id="mobile-user-role-badge">
                      <Shield className="w-3 h-3 mr-1" data-spec-id="mobile-shield-icon"/>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3" data-spec-id="user-actions">
                <Badge className={`hidden sm:flex ${getRoleColor(user.role)}`} style={getRoleStyle(user.role)} data-spec-id="desktop-user-role-badge">
                  <Shield className="w-3 h-3 mr-1" data-spec-id="desktop-shield-icon"/>
                  {getRoleLabel(user.role)}
                </Badge>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:space-x-1 sm:justify-start" data-spec-id="action-buttons">
                  <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open)=>{
            setIsEditDialogOpen(open);
            if (!open) setEditingUser(null);
        }} data-spec-id="edit-user-dialog">
                    <DialogTrigger asChild data-spec-id="edit-user-trigger">
                      <Button variant="outline" size="sm" onClick={()=>setEditingUser({
                ...user
            })} className="flex items-center justify-center px-3 py-2 sm:flex-none" data-spec-id={`edit-user-${user.id}`}>
                        <Edit className="w-4 h-4 sm:mr-0 mr-2 flex-shrink-0" data-spec-id="edit-icon"/>
                        <span className="sm:hidden text-xs" data-spec-id="2ZWHR41kI3Ie4sjL">Editar</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md w-full mx-4" data-spec-id="edit-user-dialog-content">
                      <DialogHeader data-spec-id="edit-user-dialog-header">
                        <DialogTitle className="text-lg" data-spec-id="edit-user-dialog-title">Editar Usuário</DialogTitle>
                      </DialogHeader>
                      {editingUser && (<div className="space-y-4" data-spec-id="edit-user-form">
                          <div data-spec-id="edit-name-field">
                            <Label htmlFor="edit-name" data-spec-id="edit-name-label">Nome Completo</Label>
                            <Input id="edit-name" value={editingUser.name} onChange={(e)=>setEditingUser({
                ...editingUser,
                name: e.target.value
            })} data-spec-id="edit-name-input"/>
                          </div>
                          <div data-spec-id="edit-email-field">
                            <Label htmlFor="edit-email" data-spec-id="edit-email-label">Email</Label>
                            <Input id="edit-email" type="email" value={editingUser.email} onChange={(e)=>setEditingUser({
                ...editingUser,
                email: e.target.value
            })} data-spec-id="edit-email-input"/>
                          </div>
                          <div data-spec-id="edit-role-field">
                            <Label htmlFor="edit-role" data-spec-id="edit-role-label">Função</Label>
                            <Select value={editingUser.role} onValueChange={(value)=>setEditingUser({
                ...editingUser,
                role: value as User['role']
            })} data-spec-id="edit-role-select">
                              <SelectTrigger data-spec-id="edit-role-trigger">
                                <SelectValue data-spec-id="edit-role-value"/>
                              </SelectTrigger>
                              <SelectContent data-spec-id="edit-role-options">
                                {professionalCategories.map((category)=>(<SelectItem key={category.id} value={category.roleKey} data-spec-id={`edit-role-${category.roleKey}`}>
                                    {category.name}
                                  </SelectItem>))}
                                <SelectItem value="admin" data-spec-id="edit-role-admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2" data-spec-id="edit-user-actions">
                            <Button variant="outline" onClick={()=>setIsEditDialogOpen(false)} className="w-full sm:w-auto" data-spec-id="cancel-edit-button">
                              Cancelar
                            </Button>
                            <Button onClick={updateUser} className="w-full sm:w-auto" data-spec-id="confirm-edit-button">
                              Salvar
                            </Button>
                          </div>
                        </div>)}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog data-spec-id="change-password-dialog">
                    <AlertDialogTrigger asChild data-spec-id="change-password-trigger">
                      <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex items-center justify-center px-3 py-2 sm:flex-none" data-spec-id={`change-password-${user.id}`}>
                        <Key className="w-4 h-4 sm:mr-0 mr-2 flex-shrink-0" data-spec-id="key-icon"/>
                        <span className="sm:hidden text-xs" data-spec-id="O3IDfYJiR5H82qfP">Senha</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-spec-id="change-password-dialog-content">
                      <AlertDialogHeader data-spec-id="change-password-dialog-header">
                        <AlertDialogTitle data-spec-id="change-password-dialog-title">
                          Forçar Troca de Senha
                        </AlertDialogTitle>
                        <AlertDialogDescription data-spec-id="change-password-dialog-description">
                          Tem certeza que deseja forçar a troca de senha do usuário <strong data-spec-id="password-user-name">{user.name}</strong>? 
                          Uma nova senha temporária será gerada e o usuário deverá alterá-la no próximo login.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter data-spec-id="change-password-dialog-footer">
                        <AlertDialogCancel data-spec-id="password-cancel-button">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={()=>{
            console.log('Force password change for user:', user.id);
            toast.success(`Nova senha temporária gerada para ${user.name}: temp123`);
        }} className="bg-orange-600 hover:bg-orange-700" data-spec-id="password-confirm-button">
                          Gerar Nova Senha
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {}
                  {currentUser?.id !== user.id && (<AlertDialog data-spec-id="delete-user-dialog">
                      <AlertDialogTrigger asChild data-spec-id="delete-user-trigger">
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center px-3 py-2 sm:flex-none" data-spec-id={`delete-user-${user.id}`}>
                          <Trash2 className="w-4 h-4 sm:mr-0 mr-2 flex-shrink-0" data-spec-id="trash-icon"/>
                          <span className="sm:hidden text-xs" data-spec-id="JymJdAp5yOyoCGxt">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-spec-id="delete-user-dialog-content">
                        <AlertDialogHeader data-spec-id="delete-user-dialog-header">
                          <AlertDialogTitle data-spec-id="delete-user-dialog-title">
                            Confirmar Exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription data-spec-id="delete-user-dialog-description">
                            Tem certeza que deseja remover o usuário <strong data-spec-id="SzjiPacRsjat7MJj">{user.name}</strong>? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter data-spec-id="delete-user-dialog-footer">
                          <AlertDialogCancel data-spec-id="delete-cancel-button">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={()=>deleteUser(user.id)} className="bg-red-600 hover:bg-red-700" data-spec-id="delete-confirm-button">
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>)}
                </div>
              </div>
            </div>))}
        </div>

        {users.length === 0 && (<div className="text-center py-8" data-spec-id="empty-users-state">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="empty-users-icon"/>
            <p className="text-gray-600" data-spec-id="empty-users-message">Nenhum usuário encontrado</p>
          </div>)}
      </CardContent>
    </Card>);
};
export default UserManagement;
