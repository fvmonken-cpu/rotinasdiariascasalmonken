import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsersManagement, useAllUserTypes } from '@/hooks/useUsers';
import UserManagementTab from './UserManagementTab';
import UserTypesTab from './UserTypesTab';
const UsersView: React.FC = ()=>{
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const canAccess = user?.role === 'administrativo' || user?.role === 'superusuario';
    if (!canAccess) {
        return (<div className="text-center py-8" data-spec-id="access-denied">
            <p className="text-red-600" data-spec-id="access-denied-message">
              Acesso negado. Apenas usuários administrativos e superusuários podem acessar esta seção.
            </p>
          </div>);
    }
    const includeSuperuser = user?.role === 'superusuario';
    const includeSuperuserType = user?.role === 'superusuario';
    const { data: users = [], isLoading: usersLoading, error: usersError } = useUsersManagement(includeSuperuser);
    const { data: userTypes = [], isLoading: typesLoading, error: typesError } = useAllUserTypes(includeSuperuserType);
    console.log('UsersView - Usuário atual:', {
        name: user?.full_name,
        type: user?.user_type,
        isAdmin: user?.is_admin,
        isSuperuser: user?.is_superuser
    });
    if (usersLoading || typesLoading) {
        return (<div className="flex items-center justify-center py-8" data-spec-id="loading-state">
        <div className="text-center" data-spec-id="loading-content">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" data-spec-id="loading-spinner"></div>
          <p className="text-gray-600" data-spec-id="loading-text">Carregando dados...</p>
        </div>
      </div>);
    }
    if (usersError || typesError) {
        return (<div className="text-center py-8" data-spec-id="error-state">
        <p className="text-red-600" data-spec-id="error-message">
          Erro ao carregar dados: {usersError?.message || typesError?.message}
        </p>
      </div>);
    }
    return (<div className="space-y-6" data-spec-id="users-management-container">
      {}
      <div className="flex items-center justify-between" data-spec-id="header-section">
        <div data-spec-id="title-section">
          <h1 className="text-2xl font-bold text-gray-900" data-spec-id="page-title">
            Gestão de Usuários
          </h1>
          <p className="text-gray-600" data-spec-id="page-description">
            Gerencie usuários e tipos de usuário do sistema
          </p>
        </div>
        
        <div className="flex gap-4" data-spec-id="stats-section">
          <Badge variant="outline" className="text-sm" data-spec-id="users-count-badge">
            <Users className="h-4 w-4 mr-1" data-spec-id="users-icon"/>
            {users.length} usuário(s)
          </Badge>
          <Badge variant="outline" className="text-sm" data-spec-id="types-count-badge">
            <UserCog className="h-4 w-4 mr-1" data-spec-id="types-icon"/>
            {userTypes.length} tipo(s)
          </Badge>
        </div>
      </div>

      {}
      <Card data-spec-id="management-tabs-card">
        <CardHeader data-spec-id="tabs-header">
          <CardTitle data-spec-id="tabs-title">Painel de Gestão</CardTitle>
        </CardHeader>
        <CardContent data-spec-id="tabs-content">
          <Tabs value={activeTab} onValueChange={setActiveTab} data-spec-id="management-tabs">
            <TabsList className="grid w-full grid-cols-2" data-spec-id="tabs-list">
              <TabsTrigger value="users" data-spec-id="users-tab-trigger">
                <Users className="h-4 w-4 mr-2" data-spec-id="users-tab-icon"/>
                Usuários
              </TabsTrigger>
              <TabsTrigger value="types" data-spec-id="types-tab-trigger">
                <UserCog className="h-4 w-4 mr-2" data-spec-id="types-tab-icon"/>
                Tipos de Usuário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4" data-spec-id="users-tab-content">
              <UserManagementTab users={users} userTypes={userTypes} currentUser={user} data-spec-id="user-management-tab-instance"/>
            </TabsContent>

            <TabsContent value="types" className="space-y-4" data-spec-id="types-tab-content">
              <UserTypesTab userTypes={userTypes} currentUser={user} data-spec-id="user-types-tab-instance"/>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);
};
export default UsersView;
