import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertTriangle, FileText, User, Calendar } from 'lucide-react';
import { DailyChecklist, Task, User as UserType } from '@/types';
import { toast } from 'sonner';
interface ChecklistFinalizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklist: DailyChecklist;
    template: {
        tasks: Task[];
    };
    user: UserType;
    onFinalize: (finalReport: string) => void;
}
const ChecklistFinalizationDialog = ({ open, onOpenChange, checklist, template, user, onFinalize }: ChecklistFinalizationDialogProps)=>{
    const [finalObservations, setFinalObservations] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const completedTasks = checklist.progress.filter((p)=>p.completed).length;
    const totalTasks = checklist.progress.length;
    const requiredTasks = checklist.progress.filter((p)=>{
        const task = template.tasks.find((t)=>t.id === p.taskId);
        return task?.isRequired;
    }).length;
    const completedRequiredTasks = checklist.progress.filter((p)=>{
        const task = template.tasks.find((t)=>t.id === p.taskId);
        return p.completed && task?.isRequired;
    }).length;
    const generateFinalReport = (): string =>{
        const now = new Date();
        const startTime = checklist.startedAt ? new Date(checklist.startedAt) : now;
        const duration = Math.round((now.getTime() - startTime.getTime()) / 1000 / 60);
        const reportLines = [
            `=== RELATÓRIO DE CHECKLIST FINALIZADO ===`,
            ``,
            `📋 INFORMAÇÕES GERAIS`,
            `Usuário: ${user.name} (${user.email})`,
            `Função: ${user.role === 'secretary' ? 'Secretária' : user.role === 'nurse' ? 'Enfermeira' : user.role === 'director' ? 'Diretora' : user.role === 'sdr' ? 'SDR' : user.role}`,
            `Data: ${new Date(checklist.date).toLocaleDateString('pt-BR')}`,
            `Período: ${getPeriodLabel(checklist.period, checklist.shift)}`,
            `Iniciado em: ${startTime.toLocaleString('pt-BR')}`,
            `Finalizado em: ${now.toLocaleString('pt-BR')}`,
            `Duração: ${duration} minutos`,
            ``,
            `📊 ESTATÍSTICAS`,
            `Total de tarefas: ${totalTasks}`,
            `Tarefas concluídas: ${completedTasks}`,
            `Taxa de conclusão: ${checklist.completionRate}%`,
            `Tarefas obrigatórias: ${requiredTasks}`,
            `Obrigatórias concluídas: ${completedRequiredTasks}`,
            `Taxa obrigatórias: ${requiredTasks > 0 ? Math.round((completedRequiredTasks / requiredTasks) * 100) : 100}%`,
            ``,
            `✅ TAREFAS REALIZADAS`
        ];
        checklist.progress.forEach((progress)=>{
            const task = template.tasks.find((t)=>t.id === progress.taskId);
            if (task && progress.completed) {
                reportLines.push(`• ${task.title}${task.isRequired ? ' (Obrigatória)' : ''}`);
                if (task.category) reportLines.push(`  Categoria: ${task.category}`);
                if (progress.completedAt) {
                    reportLines.push(`  Concluída em: ${new Date(progress.completedAt).toLocaleTimeString('pt-BR')}`);
                }
                if (progress.notes) {
                    reportLines.push(`  Observações: ${progress.notes}`);
                }
                reportLines.push('');
            }
        });
        const incompleteTasks = checklist.progress.filter((p)=>!p.completed);
        if (incompleteTasks.length > 0) {
            reportLines.push(`❌ TAREFAS NÃO REALIZADAS`);
            incompleteTasks.forEach((progress)=>{
                const task = template.tasks.find((t)=>t.id === progress.taskId);
                if (task) {
                    reportLines.push(`• ${task.title}${task.isRequired ? ' (Obrigatória)' : ''}`);
                    if (task.category) reportLines.push(`  Categoria: ${task.category}`);
                }
            });
            reportLines.push('');
        }
        if (finalObservations.trim()) {
            reportLines.push(`📝 OBSERVAÇÕES FINAIS`);
            reportLines.push(finalObservations.trim());
            reportLines.push('');
        }
        reportLines.push(`=== FIM DO RELATÓRIO ===`);
        return reportLines.join('\n');
    };
    const getPeriodLabel = (period: string, shift?: string)=>{
        const labels = {
            start_day: 'Início do Dia',
            start_shift: `Início do Turno${shift ? ` (${shift === 'morning' ? 'Manhã' : 'Tarde'})` : ''}`,
            end_shift: `Final do Turno${shift ? ` (${shift === 'morning' ? 'Manhã' : 'Tarde'})` : ''}`,
            end_day: 'Final do Dia'
        };
        return labels[period as keyof typeof labels] || period;
    };
    const handleFinalize = async ()=>{
        if (completedRequiredTasks < requiredTasks) {
            toast.error('Você deve completar todas as tarefas obrigatórias antes de finalizar o checklist');
            return;
        }
        setIsSubmitting(true);
        try {
            const finalReport = generateFinalReport();
            console.log('Generated final report:', finalReport);
            await new Promise((resolve)=>setTimeout(resolve, 1000));
            onFinalize(finalReport);
            toast.success('Checklist finalizado e relatório gerado com sucesso!');
            onOpenChange(false);
            setFinalObservations('');
        } catch (error) {
            console.error('Error finalizing checklist:', error);
            toast.error('Erro ao finalizar checklist. Tente novamente.');
        } finally{
            setIsSubmitting(false);
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange} data-spec-id="finalization-dialog">
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-spec-id="finalization-dialog-content">
        <DialogHeader data-spec-id="finalization-dialog-header">
          <DialogTitle className="flex items-center space-x-2" data-spec-id="finalization-dialog-title">
            <FileText className="w-5 h-5 text-blue-600" data-spec-id="finalization-icon"/>
            <span data-spec-id="vc32kxlfhoZzjZMJ">Finalizar Checklist</span>
          </DialogTitle>
          <DialogDescription data-spec-id="finalization-dialog-description">
            Revise suas tarefas e adicione observações finais antes de finalizar o checklist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6" data-spec-id="finalization-content">
          {}
          <Card data-spec-id="finalization-summary">
            <CardContent className="p-4" data-spec-id="finalization-summary-content">
              <div className="grid grid-cols-2 gap-4" data-spec-id="finalization-stats">
                <div className="space-y-2" data-spec-id="completion-stats">
                  <div className="flex items-center space-x-2" data-spec-id="completion-header">
                    <CheckCircle2 className="w-4 h-4 text-green-600" data-spec-id="completion-icon"/>
                    <span className="font-medium" data-spec-id="d2I9f6jzG4sZjOU0">Progresso Geral</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600" data-spec-id="completion-rate">
                    {checklist.completionRate}%
                  </p>
                  <p className="text-sm text-gray-600" data-spec-id="completion-details">
                    {completedTasks} de {totalTasks} tarefas
                  </p>
                </div>

                <div className="space-y-2" data-spec-id="required-stats">
                  <div className="flex items-center space-x-2" data-spec-id="required-header">
                    <AlertTriangle className="w-4 h-4 text-orange-600" data-spec-id="required-icon"/>
                    <span className="font-medium" data-spec-id="pbwbMx3BwuxO7A4E">Tarefas Obrigatórias</span>
                  </div>
                  <p className={`text-2xl font-bold ${completedRequiredTasks === requiredTasks ? 'text-green-600' : 'text-red-600'}`} data-spec-id="required-rate">
                    {completedRequiredTasks}/{requiredTasks}
                  </p>
                  <p className="text-sm text-gray-600" data-spec-id="required-details">
                    {requiredTasks > 0 ? Math.round((completedRequiredTasks / requiredTasks) * 100) : 100}% concluídas
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t" data-spec-id="session-info">
                <div className="flex items-center justify-between text-sm text-gray-600" data-spec-id="session-details">
                  <div className="flex items-center space-x-2" data-spec-id="user-info">
                    <User className="w-4 h-4" data-spec-id="user-icon"/>
                    <span data-spec-id="B7AnWB71a95p4W2t">{user.name}</span>
                  </div>
                  <div className="flex items-center space-x-2" data-spec-id="date-info">
                    <Calendar className="w-4 h-4" data-spec-id="date-icon"/>
                    <span data-spec-id="vtwF7bwbc7knS6kB">{new Date(checklist.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center space-x-2" data-spec-id="time-info">
                    <Clock className="w-4 h-4" data-spec-id="time-icon"/>
                    <span data-spec-id="RGy7aXMLGRcy2BVc">{getPeriodLabel(checklist.period, checklist.shift)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          {completedRequiredTasks < requiredTasks && (<div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-spec-id="validation-warning">
              <div className="flex items-center space-x-2" data-spec-id="validation-header">
                <AlertTriangle className="w-5 h-5 text-red-600" data-spec-id="validation-icon"/>
                <span className="font-medium text-red-800" data-spec-id="jl9TTHIUUdONcOoC">Atenção!</span>
              </div>
              <p className="text-red-700 mt-1" data-spec-id="validation-message">
                Você ainda não completou todas as tarefas obrigatórias. É necessário concluir todas as tarefas marcadas com (*) antes de finalizar o checklist.
              </p>
            </div>)}

          {}
          <div className="space-y-2" data-spec-id="final-observations">
            <Label htmlFor="final-observations" className="text-base font-medium" data-spec-id="observations-label">
              Observações Finais (Opcional)
            </Label>
            <Textarea id="final-observations" placeholder="Adicione observações gerais sobre este checklist, comentários especiais, ocorrências ou qualquer informação relevante..." value={finalObservations} onChange={(e)=>setFinalObservations(e.target.value)} className="min-h-[100px]" data-spec-id="final-observations-input"/>
            <p className="text-sm text-gray-500" data-spec-id="observations-help">
              Estas observações serão incluídas no relatório final do checklist.
            </p>
          </div>

          {}
          <div className="flex justify-end space-x-3 pt-4 border-t" data-spec-id="finalization-actions">
            <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={isSubmitting} data-spec-id="cancel-finalization">
              Cancelar
            </Button>
            <Button onClick={handleFinalize} disabled={completedRequiredTasks < requiredTasks || isSubmitting} className="bg-green-600 hover:bg-green-700" data-spec-id="confirm-finalization">
              {isSubmitting ? 'Finalizando...' : 'Finalizar Checklist'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
};
export default ChecklistFinalizationDialog;
