import { useState } from 'react';
import { LogOut, Settings, BarChart3, Home, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import ChangePasswordDialog from './ChangePasswordDialog';
interface AppHeaderProps {
    onNavigate?: (view: 'checklist' | 'dashboard' | 'admin') => void;
    currentView?: string;
}
const AppHeader = ({ onNavigate, currentView }: AppHeaderProps)=>{
    const { user, logout } = useSupabaseAuth();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    console.log('AppHeader rendered, current user:', user);
    const getInitials = (name: string)=>{
        return name.split(' ').map((n)=>n[0]).join('').toUpperCase();
    };
    const getRoleColor = (role: string)=>{
        const colors = {
            director: 'bg-purple-600',
            secretary: 'bg-blue-600',
            nurse: 'bg-green-600',
            sdr: 'bg-orange-600',
            admin: 'bg-red-600'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-600';
    };
    return (<header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3" data-spec-id="app-header">
      <div className="flex items-center justify-between max-w-7xl mx-auto" data-spec-id="F7K3FbstqA2rAXnt">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1" data-spec-id="vsCTS9InxDWMj672">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0" data-spec-id="clinic-logo-container">
            <img src="https://cdn-pinspec-public.pinspec.ai/assets/xZJjJVevo_1MOa-mMTMjr.png" alt="Espaço Casal Monken Logo" className="w-full h-full object-contain" data-spec-id="clinic-logo-image"/>
          </div>
          <div className="min-w-0 flex-1" data-spec-id="X4IUuyxLn3BnqUHY">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate" data-spec-id="LyzoJbsX5ZcMcGS7">Espaço Casal Monken</h1>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block" data-spec-id="IkPYGB4IRMwgiAGo">Sistema de Checklists Diários</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0" data-spec-id="SHwOqvRpICizw35i">
          {}
          <div className="hidden sm:flex items-center space-x-2" data-spec-id="universal-nav-buttons">
            {}
            <Button variant="outline" size="sm" onClick={()=>onNavigate?.('checklist')} className="flex items-center" data-spec-id="nav-home-btn">
              <Home className="w-4 h-4 mr-2" data-spec-id="home-icon"/>
              Home
            </Button>

            {}
            <Button variant="outline" size="sm" onClick={()=>{
        console.log('Universal logout button clicked');
        logout();
    }} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" data-spec-id="universal-logout-btn">
              <LogOut className="w-4 h-4 mr-2" data-spec-id="universal-logout-icon"/>
              Sair
            </Button>
          </div>

          {}
          {user?.role === 'director' && (<div className="flex items-center space-x-1 sm:space-x-2" data-spec-id="director-nav-buttons">
              <Button variant={currentView === 'dashboard' ? 'default' : 'outline'} size="sm" onClick={()=>onNavigate?.('dashboard')} className="px-2 sm:px-3" data-spec-id="nav-dashboard">
                <BarChart3 className="w-4 h-4 sm:mr-2" data-spec-id="dashboard-icon"/>
                <span className="hidden sm:inline" data-spec-id="UQNXWJ1uYigDonJs">Dashboard</span>
              </Button>
            </div>)}

          {user?.role === 'admin' && (<div className="flex items-center space-x-1 sm:space-x-2" data-spec-id="admin-nav-buttons">
              <Button variant={currentView === 'dashboard' ? 'default' : 'outline'} size="sm" onClick={()=>onNavigate?.('dashboard')} className="px-2 sm:px-3" data-spec-id="nav-dashboard-admin">
                <BarChart3 className="w-4 h-4 sm:mr-2" data-spec-id="dashboard-icon-admin"/>
                <span className="hidden sm:inline" data-spec-id="DamqAsSuOMJ4dhOQ">Dashboard</span>
              </Button>
              <Button variant={currentView === 'admin' ? 'default' : 'outline'} size="sm" onClick={()=>onNavigate?.('admin')} className="px-2 sm:px-3" data-spec-id="nav-admin">
                <Settings className="w-4 h-4 sm:mr-2" data-spec-id="admin-icon"/>
                <span className="hidden sm:inline" data-spec-id="6lePgPg6bgJePmqz">Administração</span>
              </Button>
            </div>)}

          <DropdownMenu data-spec-id="T7gCnl1ypr03vqOU">
            <DropdownMenuTrigger asChild data-spec-id="B2b7qVk0PL8zLoM0">
              <div className="cursor-pointer" onClick={()=>console.log('Avatar clicked, user:', user)} data-spec-id="sOc1T5iFl4fFmJBr">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 hover:shadow-md transition-shadow" data-spec-id="eF2xrdTdt09JkSeg">
                  <AvatarFallback className={`${getRoleColor(user?.role || '')} text-white font-semibold text-sm`} data-spec-id="d6hgGJ7i7r7acowR">
                    {getInitials(user?.name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg rounded-md" align="end" sideOffset={5} style={{
        zIndex: 9999
    }} data-spec-id="SwpGcsyWmQqSvy9j">
              <div className="flex items-center justify-start gap-2 p-3 bg-gray-50 border-b border-gray-100" data-spec-id="9Bg2588ldPqkptp8">
                <div className="flex flex-col space-y-1 leading-none" data-spec-id="RlhiRWQ6PD8lOo5h">
                  <p className="font-medium text-gray-900" data-spec-id="DHDwNW4YjA0bu6A5">{user?.name}</p>
                  <p className="text-xs capitalize text-gray-600" data-spec-id="qyIHe8lgnTYNNUq1">
                    {user?.role}
                  </p>
                  <p className="text-xs text-gray-500" data-spec-id="m62tX8pf8tiKqdwx">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="p-1" data-spec-id="VVsYRY8WddHZkhyE">
                <DropdownMenuItem onClick={()=>{
        console.log('Home clicked from dropdown');
        onNavigate?.('checklist');
    }} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-sm" data-spec-id="dropdown-home-button">
                  <Home className="mr-2 h-4 w-4" data-spec-id="dropdown-home-icon"/>
                  <span data-spec-id="dropdown-home-text">Home</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={()=>{
        console.log('Change password clicked');
        setIsChangePasswordOpen(true);
    }} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-sm" data-spec-id="dropdown-change-password-button">
                  <Key className="mr-2 h-4 w-4" data-spec-id="dropdown-password-icon"/>
                  <span data-spec-id="dropdown-password-text">Alterar Senha</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator data-spec-id="dropdown-separator"/>
                
                <DropdownMenuItem onClick={()=>{
        console.log('Logout clicked');
        logout();
    }} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-sm" data-spec-id="logout-button">
                  <LogOut className="mr-2 h-4 w-4" data-spec-id="5bkZq5z4w4gohH00"/>
                  <span data-spec-id="8Njjvl4zRVe9uS0h">Sair</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {}
      <ChangePasswordDialog isOpen={isChangePasswordOpen} onClose={()=>setIsChangePasswordOpen(false)} userId={user?.id || ''} userName={user?.name || ''} data-spec-id="ZjqMy4A3qdaDYKCC"/>
    </header>);
};
export default AppHeader;
