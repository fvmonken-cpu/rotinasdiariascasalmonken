import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
interface DataRecoveryProps {
    onDataRestored?: () => void;
}
export const DataRecovery: React.FC<DataRecoveryProps> = ({ onDataRestored })=>{
    const [isScanning, setIsScanning] = useState(false);
    const [foundData, setFoundData] = useState<any>(null);
    const scanForLostData = ()=>{
        setIsScanning(true);
        try {
            const masterTasks = localStorage.getItem('masterTasks');
            const taskCategories = localStorage.getItem('taskCategories');
            const professionalCategories = localStorage.getItem('professionalCategories');
            const checklistTemplates = localStorage.getItem('checklistTemplates');
            const foundItems = {
                masterTasks: masterTasks ? JSON.parse(masterTasks) : null,
                taskCategories: taskCategories ? JSON.parse(taskCategories) : null,
                professionalCategories: professionalCategories ? JSON.parse(professionalCategories) : null,
                checklistTemplates: checklistTemplates ? JSON.parse(checklistTemplates) : null
            };
            console.log('🔍 Dados encontrados:', foundItems);
            setFoundData(foundItems);
            const hasAnyData = Object.values(foundItems).some((data)=>data && Array.isArray(data) && data.length > 0);
            if (hasAnyData) {
                toast.success('✅ Dados encontrados no localStorage!');
            } else {
                toast.warning('⚠️ Nenhum dado encontrado no localStorage');
            }
        } catch (error) {
            console.error('❌ Erro ao escanear dados:', error);
            toast.error('Erro ao escanear dados');
        } finally{
            setIsScanning(false);
        }
    };
    const restoreData = ()=>{
        if (!foundData) return;
        try {
            let restored = 0;
            if (foundData.masterTasks && foundData.masterTasks.length > 0) {
                localStorage.setItem('masterTasks', JSON.stringify(foundData.masterTasks));
                restored++;
                console.log('✅ Tarefas mestras restauradas:', foundData.masterTasks.length);
            }
            if (foundData.taskCategories && foundData.taskCategories.length > 0) {
                localStorage.setItem('taskCategories', JSON.stringify(foundData.taskCategories));
                restored++;
                console.log('✅ Categorias de tarefas restauradas:', foundData.taskCategories.length);
            }
            if (foundData.professionalCategories && foundData.professionalCategories.length > 0) {
                localStorage.setItem('professionalCategories', JSON.stringify(foundData.professionalCategories));
                restored++;
                console.log('✅ Categorias profissionais restauradas:', foundData.professionalCategories.length);
            }
            if (foundData.checklistTemplates && foundData.checklistTemplates.length > 0) {
                localStorage.setItem('checklistTemplates', JSON.stringify(foundData.checklistTemplates));
                restored++;
                console.log('✅ Templates restaurados:', foundData.checklistTemplates.length);
            }
            if (restored > 0) {
                toast.success(`✅ ${restored} tipo(s) de dados restaurados com sucesso!`);
                if (onDataRestored) {
                    onDataRestored();
                }
                setTimeout(()=>window.location.reload(), 1000);
            } else {
                toast.warning('⚠️ Nenhum dado válido para restaurar');
            }
        } catch (error) {
            console.error('❌ Erro ao restaurar dados:', error);
            toast.error('Erro ao restaurar dados');
        }
    };
    const restoreDefaultData = ()=>{
        try {
            const defaultProfessionalCategories = [
                {
                    id: 'prof-admin',
                    name: 'Administrador',
                    roleKey: 'admin',
                    description: 'Categoria para administradores do sistema',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'prof-director',
                    name: 'Diretor',
                    roleKey: 'director',
                    description: 'Categoria para diretores',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'prof-secretary',
                    name: 'Secretária',
                    roleKey: 'secretary',
                    description: 'Categoria para secretárias',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'prof-nurse',
                    name: 'Enfermeira',
                    roleKey: 'nurse',
                    description: 'Categoria para enfermeiras',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'prof-sdr',
                    name: 'SDR',
                    roleKey: 'sdr',
                    description: 'Categoria para SDRs',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            const defaultTaskCategories = [
                {
                    id: 'cat-administration',
                    name: 'Administração',
                    description: 'Tarefas administrativas gerais',
                    color: '#3B82F6',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'cat-safety',
                    name: 'Segurança',
                    description: 'Tarefas relacionadas à segurança',
                    color: '#EF4444',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'cat-medication',
                    name: 'Medicação',
                    description: 'Tarefas relacionadas a medicamentos',
                    color: '#10B981',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'cat-maintenance',
                    name: 'Manutenção',
                    description: 'Tarefas de manutenção e limpeza',
                    color: '#F59E0B',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('professionalCategories', JSON.stringify(defaultProfessionalCategories));
            localStorage.setItem('taskCategories', JSON.stringify(defaultTaskCategories));
            localStorage.setItem('masterTasks', JSON.stringify([]));
            localStorage.setItem('checklistTemplates', JSON.stringify([]));
            console.log('✅ Dados padrão do sistema restaurados');
            toast.success('✅ Dados padrão do sistema restaurados! Você pode agora criar suas próprias tarefas.');
            if (onDataRestored) {
                onDataRestored();
            }
            setTimeout(()=>window.location.reload(), 1000);
        } catch (error) {
            console.error('❌ Erro ao restaurar dados padrão:', error);
            toast.error('Erro ao restaurar dados padrão');
        }
    };
    const exportBackup = ()=>{
        try {
            const backupData = {
                masterTasks: localStorage.getItem('masterTasks'),
                taskCategories: localStorage.getItem('taskCategories'),
                professionalCategories: localStorage.getItem('professionalCategories'),
                checklistTemplates: localStorage.getItem('checklistTemplates'),
                timestamp: new Date().toISOString()
            };
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([
                dataStr
            ], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `checklist-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('✅ Backup exportado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao exportar backup:', error);
            toast.error('Erro ao exportar backup');
        }
    };
    const importBackup = (event: React.ChangeEvent<HTMLInputElement>)=>{
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e)=>{
            try {
                const backupData = JSON.parse(e.target?.result as string);
                if (backupData.masterTasks) {
                    localStorage.setItem('masterTasks', backupData.masterTasks);
                }
                if (backupData.taskCategories) {
                    localStorage.setItem('taskCategories', backupData.taskCategories);
                }
                if (backupData.professionalCategories) {
                    localStorage.setItem('professionalCategories', backupData.professionalCategories);
                }
                if (backupData.checklistTemplates) {
                    localStorage.setItem('checklistTemplates', backupData.checklistTemplates);
                }
                toast.success('✅ Backup importado com sucesso!');
                if (onDataRestored) {
                    onDataRestored();
                }
                setTimeout(()=>window.location.reload(), 1000);
            } catch (error) {
                console.error('❌ Erro ao importar backup:', error);
                toast.error('Erro ao importar backup - arquivo inválido');
            }
        };
        reader.readAsText(file);
    };
    return (<Card className="w-full max-w-2xl mx-auto" data-spec-id="data-recovery-card">
      <CardHeader data-spec-id="data-recovery-header">
        <CardTitle className="flex items-center text-orange-600" data-spec-id="data-recovery-title">
          <AlertTriangle className="w-5 h-5 mr-2" data-spec-id="nTU5IxG54pMNPgmP"/>
          Recuperação de Dados
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4" data-spec-id="data-recovery-content">
        <Alert data-spec-id="data-recovery-alert">
          <AlertTriangle className="h-4 w-4" data-spec-id="OifUAtnOnCSiv33J"/>
          <AlertDescription data-spec-id="data-recovery-alert-description">
            <strong data-spec-id="GSjwzbSPJA7BPrBG">Problema Identificado:</strong> A migração do sistema apagou suas tarefas cadastradas do localStorage.
            Use as ferramentas abaixo para verificar e recuperar seus dados.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="data-recovery-actions">
          <Button onClick={scanForLostData} disabled={isScanning} className="w-full" variant="outline" data-spec-id="scan-data-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} data-spec-id="LAnHIBydtVBaCIcZ"/>
            {isScanning ? 'Escaneando...' : 'Escanear Dados'}
          </Button>

          <Button onClick={exportBackup} className="w-full" variant="outline" data-spec-id="export-backup-btn">
            <Download className="w-4 h-4 mr-2" data-spec-id="RdE2je0PALfMqsGM"/>
            Exportar Backup
          </Button>

          <Button onClick={restoreData} disabled={!foundData} className="w-full" data-spec-id="restore-data-btn">
            Restaurar Dados
          </Button>

          <div className="relative" data-spec-id="import-backup-section">
            <input type="file" accept=".json" onChange={importBackup} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" data-spec-id="import-backup-input"/>
            <Button className="w-full" variant="outline" data-spec-id="import-backup-btn">
              <Upload className="w-4 h-4 mr-2" data-spec-id="S4TaJboc6yF8qDKB"/>
              Importar Backup
            </Button>
          </div>

          <Button onClick={restoreDefaultData} className="w-full col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700" data-spec-id="restore-default-data-btn">
            <RefreshCw className="w-4 h-4 mr-2" data-spec-id="yhIXKfxkgyGa8pfv"/>
            Restaurar Dados Padrão do Sistema
          </Button>
        </div>

        {foundData && (<div className="mt-4 p-4 bg-gray-50 rounded-lg" data-spec-id="found-data-summary">
            <h3 className="font-semibold mb-2" data-spec-id="found-data-title">Dados Encontrados:</h3>
            <ul className="space-y-1 text-sm" data-spec-id="found-data-list">
              {foundData.masterTasks && (<li data-spec-id="found-master-tasks">
                  ✅ <strong data-spec-id="0vkjnDRSNVjjvDZC">{foundData.masterTasks.length}</strong> tarefas mestras
                </li>)}
              {foundData.taskCategories && (<li data-spec-id="found-task-categories">
                  ✅ <strong data-spec-id="a21kE2yDDdMLKpa6">{foundData.taskCategories.length}</strong> categorias de tarefas
                </li>)}
              {foundData.professionalCategories && (<li data-spec-id="found-professional-categories">
                  ✅ <strong data-spec-id="LBKar4Njzo3GDRaw">{foundData.professionalCategories.length}</strong> categorias profissionais
                </li>)}
              {foundData.checklistTemplates && (<li data-spec-id="found-checklist-templates">
                  ✅ <strong data-spec-id="lgg1DlpmM89cbBoZ">{foundData.checklistTemplates.length}</strong> templates de checklist
                </li>)}
            </ul>
          </div>)}
      </CardContent>
    </Card>);
};
export default DataRecovery;
