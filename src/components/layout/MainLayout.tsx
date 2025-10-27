import React, { useState } from 'react';
import Sidebar from './Sidebar';
import PatientsView from '@/components/patients/PatientsView';
import NewPatientForm from '@/components/patients/NewPatientForm';
import PostBirthView from '@/components/patients/PostBirthView';
import ReportsView from '@/components/reports/ReportsView';
import UsersView from '@/components/users/UsersView';
import RegisterBirthView from '@/components/patients/RegisterBirthView';
import RemovedPatientsView from '@/components/patients/RemovedPatientsView';
import MaternitiesView from '@/components/maternities/MaternitiesView';
import RegisterBirthModal from '@/components/patients/RegisterBirthModal';
import ChangePasswordView from '@/components/users/ChangePasswordView';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
const MainLayout: React.FC = ()=>{
    const [activeView, setActiveView] = useState('patients');
    const [selectedPatientForBirth, setSelectedPatientForBirth] = useState<any>(null);
    const [showRegisterBirthModal, setShowRegisterBirthModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();
    const isMobile = useIsMobile();
    if (!user) return null;
    const handleRegisterBirth = (patient: any)=>{
        setSelectedPatientForBirth(patient);
        setShowRegisterBirthModal(true);
    };
    const closeRegisterBirthModal = ()=>{
        setShowRegisterBirthModal(false);
        setSelectedPatientForBirth(null);
    };
    const toggleSidebar = ()=>{
        setSidebarOpen(!sidebarOpen);
    };
    const closeSidebar = ()=>{
        setSidebarOpen(false);
    };
    const handleViewChange = (view: string)=>{
        setActiveView(view);
        if (isMobile) {
            closeSidebar();
        }
    };
    const renderContent = ()=>{
        switch(activeView){
            case 'patients':
                return <PatientsView onNewPatient={()=>setActiveView('new-patient')} onEditPatient={(patient)=>{
                    console.log('Editar paciente:', patient);
                }} onRegisterBirth={handleRegisterBirth} data-spec-id="COHcqbOFENTQOOhx"/>;
            case 'new-patient':
                return <NewPatientForm onSuccess={()=>setActiveView('patients')} data-spec-id="pTvNrMh0zxgpX08z"/>;
            case 'register-birth':
                return <RegisterBirthView onSuccess={()=>setActiveView('patients')} data-spec-id="ZJuBArnfAGRfg7ar"/>;
            case 'post-birth':
                return <PostBirthView data-spec-id="I0FQDRr23qMoBGbP"/>;
            case 'removed-patients':
                return <RemovedPatientsView data-spec-id="removed-patients-view"/>;
            case 'maternities':
                return <MaternitiesView data-spec-id="maternities-view"/>;
            case 'reports':
                return <ReportsView data-spec-id="VAMWf6P0stk4CGa2"/>;
            case 'users':
                return <UsersView data-spec-id="sNUOVhuInDGicMgy"/>;
            case 'change-password':
                return <ChangePasswordView onBack={()=>setActiveView('patients')} data-spec-id="change-password-view"/>;
            default:
                return <PatientsView onNewPatient={()=>setActiveView('new-patient')} onEditPatient={(patient)=>{
                    console.log('Editar paciente:', patient);
                }} onRegisterBirth={handleRegisterBirth} data-spec-id="O5Jw7GfVt1WVxWjx"/>;
        }
    };
    return (<div className="flex h-screen bg-gray-50" data-spec-id="main-layout">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} isOpen={sidebarOpen} onClose={closeSidebar} isMobile={isMobile} data-spec-id="6iu6iEYxFetvBSjD"/>
      <main className="flex-1 overflow-auto relative" data-spec-id="fum2yRfZIIcLvSB7">
        {}
        {isMobile && (<div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30" data-spec-id="mobile-header">
            <div className="flex items-center justify-between" data-spec-id="oI4PPbfwoPK2S1ox">
              <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100" data-spec-id="hamburger-button">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-spec-id="EJNePyqbCvrPurPC">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" data-spec-id="pp6k23LiJaHSzLIQ"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-[#D2AE6D]" data-spec-id="mobile-title">
                Casal Monken
              </h1>
              <div className="w-10" data-spec-id="6LBEUq95HEzbETuu"/> {}
            </div>
          </div>)}
        <div className={`${isMobile ? 'p-4' : 'p-6'}`} data-spec-id="gZHtt9gGld0aPPws">
          {renderContent()}
        </div>
      </main>

      {}
      {isMobile && sidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeSidebar} data-spec-id="mobile-overlay"/>)}

      <RegisterBirthModal isOpen={showRegisterBirthModal} onClose={closeRegisterBirthModal} patient={selectedPatientForBirth} data-spec-id="Rm5WLXPSMKDxjNhd"/>
    </div>);
};
export default MainLayout;
