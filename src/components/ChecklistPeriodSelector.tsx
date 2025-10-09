import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sunrise, Sun, Sunset, Moon, Clock, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { ChecklistPeriod, DailyChecklist, User } from '@/types';
import { suggestChecklistPeriod, getSuggestionMessage } from '@/utils/checklistSuggestions';
import { toast } from 'sonner';
import ReopenChecklistDialog from './ReopenChecklistDialog';
interface ChecklistPeriodSelectorProps {
    user: User;
    onPeriodSelected: (period: ChecklistPeriod) => void;
}
const ChecklistPeriodSelector = ({ user, onPeriodSelected }: ChecklistPeriodSelectorProps)=>{
    const [selectedPeriod, setSelectedPeriod] = useState<ChecklistPeriod | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [existingChecklists, setExistingChecklists] = useState<DailyChecklist[]>([]);
    const [allUserChecklists, setAllUserChecklists] = useState<DailyChecklist[]>([]);
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [pendingPeriod, setPendingPeriod] = useState<ChecklistPeriod | null>(null);
    const today = new Date().toISOString().split('T')[0];
    useEffect(()=>{
        const savedChecklists = localStorage.getItem('dailyChecklists');
        const allChecklists: DailyChecklist[] = savedChecklists ? JSON.parse(savedChecklists) : [];
        const userTodayChecklists = allChecklists.filter((checklist)=>checklist.userId === user.id && checklist.date === today);
        setAllUserChecklists(userTodayChecklists);
        console.log('Loaded user checklists for today:', userTodayChecklists.length);
    }, [
        user.id,
        today
    ]);
    const availablePeriods: ChecklistPeriod[] = [
        {
            id: 'start-day',
            name: 'Início do Dia',
            description: 'Tarefas para começar o dia de trabalho (inclui início de turno manhã)',
            period: 'start_day'
        },
        {
            id: 'start-shift-afternoon',
            name: 'Início do Turno - Tarde',
            description: 'Tarefas específicas para o início do turno da tarde',
            period: 'start_shift',
            shift: 'afternoon'
        },
        {
            id: 'end-shift-morning',
            name: 'Final do Turno - Manhã',
            description: 'Tarefas para finalizar o turno da manhã',
            period: 'end_shift',
            shift: 'morning'
        },
        {
            id: 'end-day',
            name: 'Final do Dia',
            description: 'Tarefas para encerrar o dia de trabalho (inclui final de turno tarde)',
            period: 'end_day'
        }
    ];
    const getPeriodIcon = (period: string, shift?: string)=>{
        switch(period){
            case 'start_day':
                return <Sunrise className="w-8 h-8 text-orange-500" data-spec-id="sunrise-icon"/>;
            case 'start_shift':
                return shift === 'morning' ? <Sun className="w-8 h-8 text-yellow-500" data-spec-id="sun-morning-icon"/> : <Sun className="w-8 h-8 text-orange-400" data-spec-id="sun-afternoon-icon"/>;
            case 'end_shift':
                return shift === 'morning' ? <Sunset className="w-8 h-8 text-orange-600" data-spec-id="sunset-morning-icon"/> : <Sunset className="w-8 h-8 text-red-500" data-spec-id="sunset-afternoon-icon"/>;
            case 'end_day':
                return <Moon className="w-8 h-8 text-blue-600" data-spec-id="moon-icon"/>;
            default:
                return <Clock className="w-8 h-8 text-gray-500" data-spec-id="clock-default-icon"/>;
        }
    };
    const checkExistingChecklists = (period: ChecklistPeriod)=>{
        const savedChecklists = localStorage.getItem('dailyChecklists');
        const allChecklists: DailyChecklist[] = savedChecklists ? JSON.parse(savedChecklists) : [];
        const existingForPeriod = allChecklists.filter((checklist)=>checklist.userId === user.id && checklist.date === today && checklist.period === period.period && (!period.shift || checklist.shift === period.shift));
        setExistingChecklists(existingForPeriod);
        return existingForPeriod;
    };
    const handlePeriodClick = (period: ChecklistPeriod)=>{
        console.log('Period clicked:', period.name);
        setSelectedPeriod(period);
        const existing = checkExistingChecklists(period);
        console.log('Existing checklists found:', existing.length);
        existing.forEach((c, index)=>{
            console.log(`Checklist ${index}:`, {
                id: c.id,
                isFinalized: c.isFinalized,
                period: c.period,
                shift: c.shift,
                userId: c.userId
            });
        });
        const hasFinalized = existing.some((c)=>c.isFinalized);
        const hasOnlyFinalized = existing.every((c)=>c.isFinalized);
        console.log('Has finalized checklist:', hasFinalized);
        if (hasOnlyFinalized && existing.length > 0) {
            console.log('Opening reopen dialog for finalized checklist');
            setPendingPeriod(period);
            setShowReopenDialog(true);
            return;
        }
        if (existing.length > 0) {
            const hasInProgress = existing.some((c)=>!c.isFinalized);
            if (hasInProgress) {
                console.log('Found non-finalized checklist, continuing directly');
                handleConfirmStart();
            } else {
                console.log('Found only finalized checklists, asking for confirmation');
                setShowConfirmation(true);
            }
        } else {
            console.log('No existing checklist, starting new one');
            handleConfirmStart();
        }
    };
    const handleConfirmStart = ()=>{
        if (!selectedPeriod) return;
        console.log('Starting new checklist for period:', selectedPeriod);
        toast.success(`Iniciando checklist: ${selectedPeriod.name}`);
        onPeriodSelected(selectedPeriod);
    };
    const handleReopenChecklist = (reason: string)=>{
        if (!pendingPeriod) return;
        console.log('Reopening checklist for period:', pendingPeriod.name, 'Reason:', reason);
        setShowReopenDialog(false);
        setPendingPeriod(null);
        onPeriodSelected(pendingPeriod);
    };
    const handleCancelReopen = ()=>{
        console.log('Cancelled checklist reopen');
        setShowReopenDialog(false);
        setPendingPeriod(null);
    };
    const getCurrentTime = ()=>{
        return new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getRecommendedPeriods = ()=>{
        const currentHour = new Date().getHours();
        if (currentHour >= 6 && currentHour < 12) {
            return [
                'start-day'
            ];
        } else if (currentHour >= 12 && currentHour < 14) {
            return [
                'end-shift-morning',
                'start-shift-afternoon'
            ];
        } else if (currentHour >= 14 && currentHour < 17) {
            return [
                'start-shift-afternoon'
            ];
        } else if (currentHour >= 17 && currentHour < 19) {
            return [
                'end-day'
            ];
        } else {
            return [
                'end-day'
            ];
        }
    };
    const recommendedPeriods = getRecommendedPeriods();
    return (<div className="space-y-6" data-spec-id="period-selector-container">
      <Card data-spec-id="period-selector-card">
        <CardHeader data-spec-id="period-selector-header">
          <div className="text-center" data-spec-id="header-content">
            <CardTitle className="flex items-center justify-center" data-spec-id="header-title">
              <Clock className="w-6 h-6 mr-2" data-spec-id="header-clock-icon"/>
              Selecionar Período do Checklist
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2" data-spec-id="header-description">
              Olá, <strong data-spec-id="dWLgY8J54QBYujjh">{user.name}</strong>! Escolha o período para o seu checklist de hoje ({getCurrentTime()})
            </p>
          </div>
        </CardHeader>

        <CardContent data-spec-id="period-selector-content">
          {}
          {allUserChecklists.length > 0 && (<div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg" data-spec-id="daily-summary">
              <h4 className="font-medium text-gray-900 mb-2" data-spec-id="summary-title">
                Resumo do Dia
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm" data-spec-id="summary-stats">
                <div data-spec-id="summary-completed">
                  <span className="text-green-600 font-medium" data-spec-id="completed-count">
                    {allUserChecklists.filter((c)=>c.isFinalized).length} Finalizados
                  </span>
                </div>
                <div data-spec-id="summary-progress">
                  <span className="text-amber-600 font-medium" data-spec-id="progress-count">
                    {allUserChecklists.filter((c)=>!c.isFinalized).length} Em Andamento
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2" data-spec-id="summary-description">
                Total de {allUserChecklists.length} checklist{allUserChecklists.length !== 1 ? 's' : ''} hoje
              </p>
            </div>)}
          
          {}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg" data-spec-id="smart-suggestion">
            <div className="flex items-start space-x-3" data-spec-id="suggestion-content">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" data-spec-id="suggestion-icon"/>
              <div data-spec-id="suggestion-text">
                <h4 className="font-medium text-blue-900 mb-1" data-spec-id="suggestion-title">
                  Sugestão Inteligente
                </h4>
                <p className="text-sm text-blue-800 mb-3" data-spec-id="suggestion-message">
                  {getSuggestionMessage()}
                </p>
                <Button size="sm" onClick={()=>handlePeriodClick(suggestChecklistPeriod())} className="bg-blue-600 hover:bg-blue-700 text-white" data-spec-id="accept-suggestion-btn">
                  Usar Sugestão
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="periods-grid">
            {availablePeriods.map((period)=>{
        const isRecommended = recommendedPeriods.includes(period.id);
        const periodChecklists = allUserChecklists.filter((c)=>c.period === period.period && (!period.shift || c.shift === period.shift));
        const hasExisting = periodChecklists.length > 0;
        const finalizedCount = periodChecklists.filter((c)=>c.isFinalized).length;
        const inProgressCount = periodChecklists.filter((c)=>!c.isFinalized).length;
        return (<div key={period.id} className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${isRecommended ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'} ${finalizedCount > 0 ? 'bg-green-50 border-green-200' : ''}`} onClick={()=>handlePeriodClick(period)} data-spec-id={`period-option-${period.id}`}>
                  {isRecommended && !hasExisting && (<Badge className="absolute -top-2 -right-2 bg-blue-600 text-white" data-spec-id="recommended-badge">
                      Recomendado
                    </Badge>)}
                  
                  {finalizedCount > 0 && (<Badge className="absolute -top-2 -right-2 bg-green-600 text-white" data-spec-id="completed-badge">
                      Finalizado
                    </Badge>)}

                  <div className="flex items-start space-x-4" data-spec-id="period-content">
                    <div className="flex-shrink-0" data-spec-id="period-icon">
                      {getPeriodIcon(period.period, period.shift)}
                    </div>
                    
                    <div className="flex-1" data-spec-id="period-info">
                      <h3 className="font-medium text-gray-900 mb-1" data-spec-id="period-name">
                        {period.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2" data-spec-id="period-description">
                        {period.description}
                      </p>

                      {hasExisting && (<div className="space-y-1" data-spec-id="period-status">
                          {finalizedCount > 0 && (<div className="flex items-center text-sm text-green-600" data-spec-id="finalized-info">
                              <CheckCircle className="w-4 h-4 mr-1" data-spec-id="finalized-check-icon"/>
                              {finalizedCount === 1 ? 'Checklist finalizado' : `${finalizedCount} checklists finalizados`}
                            </div>)}
                          
                          {inProgressCount > 0 && (<div className="flex items-center text-sm text-amber-600" data-spec-id="existing-warning">
                              <AlertTriangle className="w-4 h-4 mr-1" data-spec-id="warning-icon"/>
                              {inProgressCount === 1 ? 'Checklist em andamento' : `${inProgressCount} checklists em andamento`}
                            </div>)}
                          
                          {periodChecklists.length > 0 && (<div className="text-xs text-gray-500" data-spec-id="period-summary">
                              {finalizedCount > 0 && inProgressCount > 0 ? `Total: ${periodChecklists.length} checklists hoje` : finalizedCount > 0 ? 'Clique para reabrir' : 'Clique para continuar'}
                            </div>)}
                        </div>)}
                        
                      {!hasExisting && (<div className="text-sm text-gray-500" data-spec-id="no-checklist-info">
                          Nenhum checklist hoje
                        </div>)}
                    </div>
                  </div>
                </div>);
    })}
          </div>


        </CardContent>
      </Card>

      {}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation} data-spec-id="confirm-period-dialog">
        <AlertDialogContent data-spec-id="confirm-dialog-content">
          <AlertDialogHeader data-spec-id="confirm-dialog-header">
            <AlertDialogTitle className="flex items-center" data-spec-id="confirm-dialog-title">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" data-spec-id="confirm-warning-icon"/>
              Checklist Já Existe
            </AlertDialogTitle>
            <AlertDialogDescription data-spec-id="confirm-dialog-description">
              Você já possui um checklist para <strong data-spec-id="T9DX8yFiYba55rZ3">{selectedPeriod?.name}</strong> hoje.
              {existingChecklists.length > 0 && existingChecklists[0].isFinalized ? ' Este checklist já foi finalizado e não pode ser alterado.' : ' Deseja iniciar um novo checklist? Isso substituirá o checklist atual.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-spec-id="confirm-dialog-footer">
            <AlertDialogCancel data-spec-id="confirm-cancel-btn">
              Cancelar
            </AlertDialogCancel>
            {existingChecklists.length > 0 && !existingChecklists[0].isFinalized && (<AlertDialogAction onClick={handleConfirmStart} className="bg-blue-600 hover:bg-blue-700" data-spec-id="confirm-start-btn">
                Iniciar Novo Checklist
              </AlertDialogAction>)}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <ReopenChecklistDialog open={showReopenDialog} onOpenChange={setShowReopenDialog} period={pendingPeriod} onConfirm={handleReopenChecklist} onCancel={handleCancelReopen} data-spec-id="reopen-checklist-dialog"/>
    </div>);
};
export default ChecklistPeriodSelector;
