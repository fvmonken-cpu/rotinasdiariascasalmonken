import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import UserManagement from './UserManagement';
import AdminReports from './AdminReports';
import SystemConfigurationManager from './SystemConfigurationManager';
import SupabaseStatus from './SupabaseStatus';
import DataRecovery from './DataRecovery';
const AdminView = ()=>{
    return (<div className="space-y-6" data-spec-id="admin-view">
      {}
      <div className="flex items-center justify-between" data-spec-id="admin-header">
        <div data-spec-id="admin-header-info">
          <h2 className="text-2xl font-bold text-gray-900" data-spec-id="admin-title">
            Painel Administrativo
          </h2>
          <p className="text-gray-600" data-spec-id="admin-description">
            Gerencie usuários, relatórios e configurações do sistema
          </p>
        </div>
        <Badge variant="outline" className="text-purple-800 bg-purple-100" data-spec-id="admin-badge">
          <Settings className="w-3 h-3 mr-1" data-spec-id="admin-badge-icon"/>
          Administrador
        </Badge>
      </div>

      {}
      <SupabaseStatus data-spec-id="supabase-status-section"/>

      <DataRecovery data-spec-id="data-recovery-section"/>

      {}
      <div className="border-t border-gray-200" data-spec-id="supabase-divider"></div>

      {}
      <UserManagement data-spec-id="user-management-section"/>

      {}
      <div className="border-t border-gray-200" data-spec-id="admin-divider-1"></div>

      {}
      <AdminReports data-spec-id="admin-reports-section"/>

      {}
      <div className="border-t border-gray-200" data-spec-id="admin-divider-2"></div>

      {}
      <SystemConfigurationManager data-spec-id="system-configuration-manager-section"/>
    </div>);
};
export default AdminView;
