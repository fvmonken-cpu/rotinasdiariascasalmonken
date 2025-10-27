import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { ROLE_LABELS } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, UserPlus, Baby, ClipboardList, BarChart3, Settings, LogOut, Stethoscope, Heart, User, Shield, FileText, UserX, Building2, KeyRound } from 'lucide-react';
interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
    isMobile?: boolean;
}
const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen = true, onClose, isMobile = false })=>{
    const { user, logout, hasPermission, canAccessAllPatients } = useAuth();
    const { canViewRemovedPatients } = useUserPermissions();
    if (!user) return null;
    const getMenuItems = ()=>{
        const items = [];
        if (user.role === 'enfermeira_obstetrica') {
            items.push({
                id: 'patients',
                label: 'Gestantes',
                icon: Users,
                show: true
            });
            items.push({
                id: 'post-birth',
                label: 'Nascimentos',
                icon: FileText,
                show: true
            });
            if (canViewRemovedPatients) {
                items.push({
                    id: 'removed-patients',
                    label: 'Pacientes Removidas',
                    icon: UserX,
                    show: true
                });
            }
            return items.filter((item)=>item.show);
        }
        if (user.role === 'consultora_amamentacao') {
            items.push({
                id: 'patients',
                label: 'Gestantes',
                icon: Users,
                show: true
            });
            items.push({
                id: 'post-birth',
                label: 'Nascimentos',
                icon: FileText,
                show: true
            });
            return items.filter((item)=>item.show);
        }
        if (user.role === 'sdr') {
            items.push({
                id: 'patients',
                label: 'Gestantes',
                icon: Users,
                show: true
            });
            items.push({
                id: 'post-birth',
                label: 'Nascimentos',
                icon: FileText,
                show: true
            });
            if (canViewRemovedPatients) {
                items.push({
                    id: 'removed-patients',
                    label: 'Pacientes Removidas',
                    icon: UserX,
                    show: true
                });
            }
            items.push({
                id: 'reports',
                label: 'Relatórios',
                icon: BarChart3,
                show: true
            });
            return items.filter((item)=>item.show);
        }
        items.push({
            id: 'patients',
            label: 'Gestantes',
            icon: Users,
            show: true
        });
        if (hasPermission('create_patient')) {
            items.push({
                id: 'new-patient',
                label: 'Cadastrar Paciente',
                icon: UserPlus,
                show: true
            });
        }
        if (hasPermission('register_birth') && user.role !== 'obstetra') {
            items.push({
                id: 'register-birth',
                label: 'Registrar Nascimento',
                icon: Baby,
                show: true
            });
        }
        items.push({
            id: 'post-birth',
            label: 'Nascimentos',
            icon: FileText,
            show: true
        });
        if (canViewRemovedPatients) {
            items.push({
                id: 'removed-patients',
                label: 'Pacientes Removidas',
                icon: UserX,
                show: true
            });
        }
        if (hasPermission('view_reports')) {
            items.push({
                id: 'reports',
                label: 'Relatórios',
                icon: BarChart3,
                show: true
            });
        }
        if (user.role === 'administrativo' || user.role === 'superusuario' || user.isAdmin) {
            items.push({
                id: 'maternities',
                label: 'Maternidades',
                icon: Building2,
                show: true
            });
        }
        if (user.role === 'administrativo' || user.role === 'superusuario') {
            items.push({
                id: 'users',
                label: 'Gestão de Usuários',
                icon: Settings,
                show: true
            });
        }
        return items.filter((item)=>item.show);
    };
    const getUserIcon = ()=>{
        switch(user.role){
            case 'obstetra':
                return Stethoscope;
            case 'enfermeira_obstetrica':
                return Heart;
            case 'doula':
                return User;
            case 'pediatra':
                return Stethoscope;
            case 'nutricionista':
                return Heart;
            case 'consultora_amamentacao':
                return Heart;
            case 'sdr':
                return ClipboardList;
            case 'administrativo':
                return ClipboardList;
            case 'superusuario':
                return Shield;
            default:
                return User;
        }
    };
    const UserIcon = getUserIcon();
    const menuItems = getMenuItems();
    return (<div className={`${isMobile ? `fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}` : 'w-64 bg-white border-r border-gray-200'} h-screen flex flex-col`} data-spec-id="sidebar">
      {}
      <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200`} data-spec-id="x59vB1uvqIctY3TI">
        <div className="flex justify-between items-start" data-spec-id="header-content">
          <div className="flex-1" data-spec-id="logo-and-title">
            <div className="flex justify-center mb-3" data-spec-id="sidebar-logo-container">
              <img src="https://cdn-pinspec-public.pinspec.ai/assets/Z8gZalhVAKjQV45OvNsVM.png" alt="Casal Monken" className="h-12 w-auto object-contain" data-spec-id="sidebar-logo"/>
            </div>
            <div className="text-center" data-spec-id="POoMWa7U5OqSzcad">
              <h1 className="text-xl font-bold text-[#D2AE6D]" data-spec-id="2H2wY0ligXKE45Zp">Casal Monken</h1>
              <p className="text-sm text-gray-600" data-spec-id="ZJNX7BA0e7u3Klzk">Sistema de Gestão</p>
            </div>
          </div>
          {isMobile && onClose && (<button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 ml-2" data-spec-id="close-sidebar-button">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-spec-id="XdlG9tHBTV8PCT5I">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" data-spec-id="5wgj7oUVVwryTnRX"/>
              </svg>
            </button>)}
        </div>
      </div>

      {}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-b border-gray-200`} data-spec-id="user-info">
        <div className="flex items-center space-x-3" data-spec-id="ZrNOoEHKFdFsJi1r">
          <div className="w-10 h-10 bg-[#D2AE6D] rounded-full flex items-center justify-center" data-spec-id="3ZQIp2jaip6srK3z">
            <UserIcon className="h-5 w-5 text-white" data-spec-id="dtd9zZGaKHWOYSsD"/>
          </div>
          <div className="flex-1 min-w-0" data-spec-id="LNZd5vJQeFq6pBOn">
            <p className="text-sm font-medium text-gray-900 truncate" data-spec-id="PQwLTvRCTt3aIqyY">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate" data-spec-id="qgxSRxTlHlNaB0ho">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-1" data-spec-id="FtiqXPixUYErUbNe">
          {user.isAdmin && (<Badge variant="secondary" className="text-xs" data-spec-id="9MoSGoivyhyNks7T">
              Admin
            </Badge>)}
          {user.role === 'obstetra' && (<Badge variant={user.hasFullAccess ? "default" : "outline"} className="text-xs" data-spec-id="RjLwzOPHp5xZjeqV">
              {user.hasFullAccess ? 'Acesso Total' : 'Acesso Restrito'}
            </Badge>)}
        </div>
      </div>

      {}
      <nav className={`flex-1 ${isMobile ? 'p-3' : 'p-4'} space-y-2`} data-spec-id="navigation-menu">
        {menuItems.map((item)=>{
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (<Button key={item.id} variant={isActive ? "default" : "ghost"} className={`w-full justify-start ${isActive ? 'bg-[#D2AE6D] text-white hover:bg-[#B8965A]' : ''}`} onClick={()=>onViewChange(item.id)} data-spec-id={`menu-${item.id}`}>
              <Icon className="mr-3 h-4 w-4" data-spec-id="wM3v9nImuPsKmlhR"/>
              {item.label}
            </Button>);
    })}
      </nav>

      {}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 space-y-2`} data-spec-id="IudxGyzH7A6njz9T">
        <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={()=>onViewChange('change-password')} data-spec-id="change-password-button">
          <KeyRound className="mr-3 h-4 w-4" data-spec-id="change-password-icon"/>
          Alterar Senha
        </Button>
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout} data-spec-id="logout-button">
          <LogOut className="mr-3 h-4 w-4" data-spec-id="5HhDe5Sco1lliCAQ"/>
          Sair
        </Button>
      </div>
    </div>);
};
export default Sidebar;
