import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import AppHeader from './AppHeader';
import ChecklistView from './ChecklistView';
import DashboardView from './DashboardView';
import AdminView from './AdminView';
import CloudOnlyNotice from './CloudOnlyNotice';
type ViewType = 'checklist' | 'dashboard' | 'admin';
const MainApp = ()=>{
    const { user, isSupabaseConnected } = useSupabaseAuth();
    const [currentView, setCurrentView] = useState<ViewType>(()=>{
        if (user?.role === 'admin') return 'admin';
        return 'checklist';
    });
    const [checklistKey, setChecklistKey] = useState(0);
    const getDefaultView = (): ViewType =>{
        if (user?.role === 'admin') return 'admin';
        if (user?.role === 'director') return 'checklist';
        return 'checklist';
    };
    const handleNavigate = (view: ViewType)=>{
        console.log('Navigating to:', view);
        setCurrentView(view);
        if (view === 'checklist') {
            setChecklistKey((prev)=>prev + 1);
        }
    };
    const renderCurrentView = ()=>{
        switch(currentView){
            case 'dashboard':
                return <DashboardView data-spec-id="G0e3cPeVkBPpRkeb"/>;
            case 'admin':
                return <AdminView data-spec-id="bfyOHIeGp45OsiLf"/>;
            case 'checklist':
            default:
                return <ChecklistView key={checklistKey} data-spec-id="py5Z3GkdjHUC8gO6"/>;
        }
    };
    return (<div className="min-h-screen bg-gray-50" data-spec-id="main-app">
      <AppHeader onNavigate={handleNavigate} currentView={currentView} data-spec-id="cPKrkLPNkIglDIpl"/>
      
      <main className="max-w-7xl mx-auto px-4 py-6" data-spec-id="Peeh3HRhT77ruJKi">
        <CloudOnlyNotice isSupabaseConnected={isSupabaseConnected} data-spec-id="NdBkGHoZjK2TATcQ"/>
        {renderCurrentView()}
      </main>
    </div>);
};
export default MainApp;
