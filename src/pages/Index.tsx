import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import LoginForm from '@/components/LoginForm';
import MainApp from '@/components/MainApp';
const IndexContent = ()=>{
    const { user, isLoading } = useSupabaseAuth();
    console.log('IndexContent rendered - isLoading:', isLoading, 'user:', user?.name || 'No user');
    if (isLoading) {
        console.log('Showing loading screen');
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50" data-spec-id="hbdQpmhIZ6fYBCRb">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-spec-id="5del9UF00iHanB6Y"></div>
      </div>);
    }
    if (!user) {
        console.log('No user found, showing login form');
        return <LoginForm data-spec-id="MMwf19abCvTZRIKT"/>;
    }
    console.log('User found, showing main app for:', user.name);
    return <MainApp data-spec-id="m4YzIOLBPsWZp9Hp"/>;
};
const Index = ()=>{
    console.log('Index component rendered - v2');
    const TestComponent = ()=>(<div className="min-h-screen bg-blue-50 flex items-center justify-center" data-spec-id="test-component">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center" data-spec-id="test-card">
                <h1 className="text-2xl font-bold text-gray-900 mb-4" data-spec-id="test-title">
                    🏥 Espaço Casal Monken
                </h1>
                <p className="text-gray-600 mb-6" data-spec-id="test-description">
                    Sistema de checklists diários funcionando corretamente!
                </p>
                <div className="space-y-2" data-spec-id="test-status">
                    <p className="text-sm text-green-600" data-spec-id="nY1hXmrMGovW366b">✅ Aplicação carregada</p>
                    <p className="text-sm text-green-600" data-spec-id="j5mxmxQF3vAOH2cK">✅ React funcionando</p>
                    <p className="text-sm text-green-600" data-spec-id="R8Z46woHBN6y2kHo">✅ Componentes renderizando</p>
                </div>
            </div>
        </div>);
    return <IndexContent data-spec-id="d4itEKsuc0WYsLBV"/>;
};
export default Index;
