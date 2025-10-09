import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, FolderPlus, CheckSquare } from 'lucide-react';
import ProfessionalCategoryManager from './ProfessionalCategoryManager';
import TaskCategoryManager from './TaskCategoryManager';
import MasterTaskManager from './MasterTaskManager';
const SystemConfigurationManager = ()=>{
    const [activeTab, setActiveTab] = useState('professional-categories');
    return (<Card data-spec-id="system-configuration-manager-card">
      <CardHeader data-spec-id="system-configuration-header">
        <CardTitle className="flex items-center" data-spec-id="system-configuration-title">
          <Settings className="w-5 h-5 mr-2" data-spec-id="settings-icon"/>
          <span className="text-lg sm:text-xl" data-spec-id="7qdZrhCs0hg1NG4H">Configuração do Sistema</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1" data-spec-id="system-configuration-subtitle">
          Gerencie categorias profissionais, categorias de tarefas e cadastro de tarefas
        </p>
      </CardHeader>

      <CardContent data-spec-id="system-configuration-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-spec-id="configuration-tabs">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 h-auto p-1" data-spec-id="configuration-tabs-list">
            <TabsTrigger value="professional-categories" className="flex items-center justify-center py-3 px-2 text-xs sm:text-sm" data-spec-id="professional-categories-tab">
              <Users className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" data-spec-id="users-tab-icon"/>
              <span className="hidden sm:inline" data-spec-id="RydihLc8Tl2X1U7T">Categorias Profissionais</span>
              <span className="sm:hidden" data-spec-id="1AigQhoZYArfb02v">Profissionais</span>
            </TabsTrigger>
            <TabsTrigger value="task-categories" className="flex items-center justify-center py-3 px-2 text-xs sm:text-sm" data-spec-id="task-categories-tab">
              <FolderPlus className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" data-spec-id="folder-tab-icon"/>
              <span className="hidden sm:inline" data-spec-id="hzIs63U1PD7rV14A">Categorias de Tarefas</span>
              <span className="sm:hidden" data-spec-id="ploM0QyFnETHiQHW">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="master-tasks" className="flex items-center justify-center py-3 px-2 text-xs sm:text-sm" data-spec-id="master-tasks-tab">
              <CheckSquare className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" data-spec-id="tasks-tab-icon"/>
              <span className="hidden sm:inline" data-spec-id="bm4fPTWJVYxHt0os">Cadastro de Tarefas</span>
              <span className="sm:hidden" data-spec-id="BNX8jXbmNIHhobOB">Tarefas</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6" data-spec-id="configuration-tabs-content">
            <TabsContent value="professional-categories" data-spec-id="professional-categories-content">
              <div className="space-y-4" data-spec-id="professional-categories-section">
                <div className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 bg-blue-50 rounded-r-md" data-spec-id="professional-categories-info">
                  <h3 className="font-medium text-blue-900 text-sm sm:text-base" data-spec-id="professional-categories-info-title">
                    Categorias Profissionais
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1 leading-relaxed" data-spec-id="professional-categories-info-description">
                    Configure as categorias profissionais disponíveis no sistema. Cada categoria representa 
                    um tipo de profissional (ex: Enfermeira, Secretária) e pode ter tarefas específicas atribuídas.
                  </p>
                </div>
                <ProfessionalCategoryManager data-spec-id="2mfsYh6Jgw05ljf9"/>
              </div>
            </TabsContent>

            <TabsContent value="task-categories" data-spec-id="task-categories-content">
              <div className="space-y-4" data-spec-id="task-categories-section">
                <div className="border-l-4 border-green-500 pl-3 sm:pl-4 py-2 bg-green-50 rounded-r-md" data-spec-id="task-categories-info">
                  <h3 className="font-medium text-green-900 text-sm sm:text-base" data-spec-id="task-categories-info-title">
                    Categorias de Tarefas
                  </h3>
                  <p className="text-xs sm:text-sm text-green-700 mt-1 leading-relaxed" data-spec-id="task-categories-info-description">
                    Configure as categorias disponíveis para classificar tarefas. Cada tarefa deve 
                    pertencer a uma categoria (ex: Comunicação, Administração, Cuidado do Paciente).
                  </p>
                </div>
                <TaskCategoryManager data-spec-id="rBaAA2575sJV1HXC"/>
              </div>
            </TabsContent>

            <TabsContent value="master-tasks" data-spec-id="master-tasks-content">
              <div className="space-y-4" data-spec-id="master-tasks-section">
                <div className="border-l-4 border-orange-500 pl-3 sm:pl-4 py-2 bg-orange-50 rounded-r-md" data-spec-id="master-tasks-info">
                  <h3 className="font-medium text-orange-900 text-sm sm:text-base" data-spec-id="master-tasks-info-title">
                    Cadastro de Tarefas
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-700 mt-1 leading-relaxed" data-spec-id="master-tasks-info-description">
                    Configure o banco de tarefas disponíveis no sistema. Cada tarefa pode ser atribuída 
                    a uma ou mais categorias profissionais e aparecerá nos checklists correspondentes.
                  </p>
                </div>
                <MasterTaskManager data-spec-id="20o5WhkwxhcnR99c"/>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>);
};
export default SystemConfigurationManager;
