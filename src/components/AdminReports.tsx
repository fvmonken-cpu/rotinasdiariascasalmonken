import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Users, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserReport, DailyChecklist, User, TaskProgress } from '@/types';
import { toast } from 'sonner';
import { mockTemplates } from '@/data/mockData';
import { generateTemplateForProfession, loadProfessionalCategories } from '@/utils/masterTaskUtils';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
const AdminReports = ()=>{
    const getLocalDateString = ()=>{
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [reports, setReports] = useState<UserReport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist | null>(null);
    const { isSupabaseConnected } = useSupabaseAuth();
    useEffect(()=>{
        loadReports();
    }, [
        selectedDate
    ]);
    const loadReports = async ()=>{
        setIsLoading(true);
        console.log('Loading reports for date:', selectedDate);
        try {
            if (isSupabaseConnected) {
                const reports = await loadSupabaseReports(selectedDate);
                setReports(reports);
                console.log('Reports loaded:', reports);
            } else {
                const mockReports = generateMockReports(selectedDate);
                setReports(mockReports);
                console.log('Reports loaded:', mockReports);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            toast.error('Erro ao carregar relatórios');
            setReports([]);
        } finally{
            setIsLoading(false);
        }
    };
    const loadSupabaseReports = async (date: string): Promise<UserReport[]> =>{
        console.log('🔍 Loading Supabase reports for date:', date);
        console.log('📅 Current date for comparison:', getLocalDateString());
        try {
            const { data: users, error: usersError } = await supabase.from('users').select('*').neq('role', 'admin').neq('id', '00000000-0000-0000-0000-000000000001');
            if (usersError) {
                console.error('❌ Error loading users:', usersError);
                throw usersError;
            }
            console.log('👥 Users found:', users?.length || 0);
            const { data: checklists, error: checklistsError } = await supabase.from('daily_checklists').select(`
                *,
                task_progress (*)
            `).eq('date', date);
            const { data: deletedUserChecklists, error: deletedError } = await supabase.from('daily_checklists').select(`
                    *,
                    task_progress (*)
                `).eq('date', date).not('deleted_user_email', 'is', null);
            const allChecklists = [
                ...(checklists || []),
                ...(deletedUserChecklists || [])
            ];
            if (checklistsError) {
                console.error('❌ Error loading checklists:', checklistsError);
                throw checklistsError;
            }
            console.log('📋 Checklists found for date:', allChecklists?.length || 0);
            const deletedUserReports: UserReport[] = [];
            const processedDeletedEmails = new Set<string>();
            allChecklists.forEach((checklist)=>{
                if (checklist.deleted_user_email && checklist.deleted_user_name && !processedDeletedEmails.has(checklist.deleted_user_email)) {
                    processedDeletedEmails.add(checklist.deleted_user_email);
                    const deletedUserChecklists = allChecklists.filter((cl)=>cl.deleted_user_email === checklist.deleted_user_email);
                    deletedUserReports.push({
                        user: {
                            id: `deleted-${checklist.deleted_user_email}`,
                            name: `${checklist.deleted_user_name} (Excluído)`,
                            email: checklist.deleted_user_email,
                            role: checklist.role || 'secretary'
                        },
                        loginDate: date,
                        checklists: deletedUserChecklists.map((checklist)=>({
                                id: checklist.id,
                                userId: checklist.user_id || `deleted-${checklist.deleted_user_email}`,
                                templateId: checklist.template_id || '',
                                date: checklist.date,
                                period: checklist.period,
                                shift: checklist.shift,
                                completionRate: checklist.completion_rate || 0,
                                startedAt: checklist.started_at,
                                completedAt: checklist.completed_at,
                                isFinalized: checklist.is_finalized || false,
                                finalReport: checklist.final_report,
                                progress: (checklist.task_progress || []).map((progress)=>({
                                        id: progress.id,
                                        taskId: progress.task_id || '',
                                        userId: progress.user_id,
                                        completed: progress.completed,
                                        completedAt: progress.completed_at,
                                        notes: progress.notes,
                                        date: progress.date
                                    }))
                            }))
                    });
                }
            });
            const reports: UserReport[] = (users || []).map((user)=>{
                const userChecklists = allChecklists.filter((checklist)=>checklist.user_id === user.id);
                console.log(`📊 User ${user.name}: ${userChecklists.length} checklists`);
                return {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    loginDate: date,
                    checklists: userChecklists.map((checklist)=>({
                            id: checklist.id,
                            userId: checklist.user_id || user.id,
                            templateId: checklist.template_id || '',
                            date: checklist.date,
                            period: checklist.period,
                            shift: checklist.shift,
                            completionRate: checklist.completion_rate || 0,
                            startedAt: checklist.started_at,
                            completedAt: checklist.completed_at,
                            isFinalized: checklist.is_finalized || false,
                            finalReport: checklist.final_report,
                            progress: (checklist.task_progress || []).map((progress)=>({
                                    id: progress.id,
                                    taskId: progress.task_id || '',
                                    userId: progress.user_id,
                                    completed: progress.completed,
                                    completedAt: progress.completed_at,
                                    notes: progress.notes,
                                    date: progress.date
                                }))
                        }))
                };
            });
            return [
                ...reports,
                ...deletedUserReports
            ];
        } catch (error) {
            console.error('❌ Error in loadSupabaseReports:', error);
            throw error;
        }
    };
    const generateMockReports = (date: string): UserReport[] =>{
        const savedUsers = localStorage.getItem('appUsers');
        const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
        const savedChecklists = localStorage.getItem('dailyChecklists');
        const allChecklists: DailyChecklist[] = savedChecklists ? JSON.parse(savedChecklists) : [];
        const dateChecklists = allChecklists.filter((checklist)=>checklist.date === date);
        return users.filter((user)=>user.role !== 'admin').map((user)=>{
            const userChecklists = dateChecklists.filter((checklist)=>checklist.userId === user.id);
            return {
                user,
                loginDate: date,
                checklists: userChecklists
            };
        });
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
    const getCompletionColor = (rate: number)=>{
        if (rate >= 80) return 'bg-green-100 text-green-800 border-green-200';
        if (rate >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };
    const getRoleColor = (role: string)=>{
        const colors = {
            director: 'bg-purple-100 text-purple-800',
            secretary: 'bg-blue-100 text-blue-800',
            nurse: 'bg-green-100 text-green-800',
            sdr: 'bg-orange-100 text-orange-800',
            deleted: 'bg-red-100 text-red-800 border border-red-200'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };
    const formatDate = (dateStr: string)=>{
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });
    };
    const formatTime = (dateStr?: string)=>{
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });
    };
    return (<Card data-spec-id="admin-reports-card">
      <CardHeader data-spec-id="admin-reports-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0" data-spec-id="reports-header-content">
          <div data-spec-id="reports-header-info">
            <CardTitle className="flex items-center" data-spec-id="reports-header-title">
              <FileText className="w-5 h-5 mr-2" data-spec-id="reports-icon"/>
              <span className="text-lg sm:text-xl" data-spec-id="sufp2dZcLMziCxXV">Relatórios de Atividade</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1" data-spec-id="reports-header-description">
              Visualize o progresso dos usuários por data
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3" data-spec-id="reports-controls">
            <div className="w-full sm:w-auto" data-spec-id="date-selector">
              <Label htmlFor="report-date" className="text-sm" data-spec-id="date-label">
                Data do Relatório
              </Label>
              <Input id="report-date" type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="w-full sm:w-40" data-spec-id="date-input"/>
            </div>
            <Button onClick={loadReports} disabled={isLoading} className="w-full sm:w-auto" data-spec-id="refresh-reports-btn">
              <Calendar className="w-4 h-4 mr-2" data-spec-id="calendar-icon"/>
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent data-spec-id="admin-reports-content">
        <div className="space-y-4" data-spec-id="reports-list">
          {reports.length === 0 ? (<div className="text-center py-8" data-spec-id="empty-reports-state">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="empty-reports-icon"/>
              <p className="text-gray-600" data-spec-id="empty-reports-message">
                Nenhuma atividade encontrada para {formatDate(selectedDate)}
              </p>
            </div>) : (reports.map((report)=>(<div key={report.user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-spec-id={`user-report-${report.user.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-3 sm:space-y-0" data-spec-id="report-user-header">
                  <div className="flex items-center space-x-3" data-spec-id="report-user-info">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0" data-spec-id="report-user-avatar">
                      <span className="text-sm font-semibold text-gray-600" data-spec-id="report-user-initials">
                        {report.user.name.split(' ').map((n)=>n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0" data-spec-id="report-user-details">
                      <h3 className="font-medium text-gray-900 truncate" data-spec-id="report-user-name">
                        {report.user.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1" data-spec-id="report-user-meta">
                        <Badge className={getRoleColor(report.user.role)} data-spec-id="report-user-role">
                          {report.user.role}
                        </Badge>
                        <span className="text-sm text-gray-600" data-spec-id="report-login-info">
                          Login: {formatDate(report.loginDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right" data-spec-id="report-summary">
                    <p className="text-sm text-gray-600" data-spec-id="report-checklist-count">
                      {report.checklists.length} checklist(s) realizados
                    </p>
                  </div>
                </div>

                {report.checklists.length > 0 ? (<div className="space-y-2" data-spec-id="user-checklists">
                    {report.checklists.map((checklist)=>(<div key={checklist.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-md space-y-3 sm:space-y-0" data-spec-id={`checklist-${checklist.id}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3" data-spec-id="checklist-info">
                          <div className="flex items-center justify-between sm:justify-start" data-spec-id="checklist-period-and-badge">
                            <div className="flex items-center space-x-2" data-spec-id="checklist-period">
                              <Clock className="w-4 h-4 text-gray-400" data-spec-id="clock-icon"/>
                              <span className="text-sm font-medium" data-spec-id="period-label">
                                {getPeriodLabel(checklist.period, checklist.shift)}
                              </span>
                            </div>
                            
                            <Badge className={getCompletionColor(checklist.completionRate)} data-spec-id="completion-badge">
                              {checklist.completionRate}%
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-1 text-sm text-gray-600" data-spec-id="checklist-timing">
                            <span data-spec-id="start-time">
                              Início: {formatTime(checklist.startedAt)}
                            </span>
                            {checklist.completedAt && (<span data-spec-id="end-time">
                                <span className="hidden sm:inline" data-spec-id="YfGOmk9zBncEfktL">| </span>Fim: {formatTime(checklist.completedAt)}
                              </span>)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-2" data-spec-id="checklist-actions">
                          {checklist.isFinalized && (<Badge variant="outline" className="text-green-600 text-xs" data-spec-id="finalized-badge">
                              <CheckCircle className="w-3 h-3 mr-1" data-spec-id="check-icon"/>
                              <span className="hidden sm:inline" data-spec-id="bgMgyvtjQ4nWH5ZE">Finalizado</span>
                              <span className="sm:hidden" data-spec-id="JMSUOEumEfHaTaDX">✓</span>
                            </Badge>)}
                          
                          <Dialog data-spec-id="checklist-details-dialog">
                            <DialogTrigger asChild data-spec-id="view-details-trigger">
                              <Button variant="outline" size="sm" className="flex-shrink-0" data-spec-id={`view-checklist-${checklist.id}`}>
                                <Eye className="w-4 h-4 sm:mr-1" data-spec-id="eye-icon"/>
                                <span className="hidden sm:inline" data-spec-id="LpVjd0Q46Q6pDZkh">Detalhes</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl w-full mx-4" data-spec-id="checklist-details-content">
                              <DialogHeader data-spec-id="details-dialog-header">
                                <DialogTitle className="text-lg" data-spec-id="details-dialog-title">
                                  Detalhes do Checklist - {getPeriodLabel(checklist.period, checklist.shift)}
                                </DialogTitle>
                              </DialogHeader>
                              <ChecklistDetailsView checklist={checklist} user={report.user} data-spec-id="Cmh3zvBWocXNteZR"/>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>))}
                  </div>) : (<div className="text-center py-4 text-gray-500" data-spec-id="no-checklists">
                    <XCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" data-spec-id="no-checklists-icon"/>
                    <p data-spec-id="no-checklists-message">Nenhum checklist realizado nesta data</p>
                  </div>)}
              </div>)))}
        </div>
      </CardContent>
    </Card>);
};
const ChecklistDetailsView = ({ checklist, user }: {
    checklist: DailyChecklist;
    user: User;
})=>{
    console.log('🔍 ChecklistDetailsView - checklist:', checklist);
    console.log('🔍 ChecklistDetailsView - progress:', checklist.progress);
    console.log('🔍 ChecklistDetailsView - user:', user);
    const [error, setError] = useState<string | null>(null);
    const [masterTasks, setMasterTasks] = useState<any[]>([]);
    const { isSupabaseConnected } = useSupabaseAuth();
    if (error) {
        return (<div className="text-center py-8" data-spec-id="error-state">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" data-spec-id="qx4cErylHn0FaOpn"/>
                <p className="text-red-600 font-medium" data-spec-id="NtwqSolzjMSmqMY0">Erro ao carregar detalhes</p>
                <p className="text-sm text-gray-600 mt-1" data-spec-id="cJaORD995ddO0e7t">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={()=>setError(null)} data-spec-id="ymRuTmORtHuca7wG">
                    Tentar novamente
                </Button>
            </div>);
    }
    useEffect(()=>{
        const loadMasterTasks = async ()=>{
            try {
                if (!user || !user.role) {
                    console.warn('⚠️ User or role is missing:', user);
                    setError('Usuário ou função não definidos');
                    return;
                }
                if (isSupabaseConnected) {
                    const { supabase } = await import('@/lib/supabase');
                    const { data: tasks, error } = await supabase.from('master_tasks').select('*').contains('assigned_roles', [
                        user.role
                    ]);
                    if (!error && tasks) {
                        console.log('📋 Master tasks loaded for role:', user.role, tasks);
                        setMasterTasks(tasks);
                    } else {
                        console.warn('⚠️ No tasks found for role:', user.role, error);
                    }
                } else {
                    const professionalCategories = loadProfessionalCategories();
                    const profession = professionalCategories.find((p)=>p.roleKey === user.role);
                    if (profession) {
                        const template = generateTemplateForProfession(user.role, profession.name);
                        setMasterTasks(template.tasks || []);
                    } else {
                        console.warn('⚠️ No profession found for role:', user.role);
                    }
                }
            } catch (error) {
                console.error('❌ Error loading master tasks:', error);
                setError(`Erro ao carregar tarefas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                setMasterTasks([]);
            }
        };
        if (user) {
            loadMasterTasks();
        }
    }, [
        user,
        user?.role,
        isSupabaseConnected
    ]);
    const getTaskTitle = (taskId: string, taskIndex?: number)=>{
        try {
            if (taskId && taskId !== 'unknown' && taskId !== '') {
                const masterTask = masterTasks.find((task)=>task.id === taskId);
                if (masterTask) {
                    console.log(`✅ Task found in master_tasks: ${masterTask.name}`);
                    return masterTask.name;
                }
            }
            if (checklist.finalReport) {
                try {
                    const reportLines = checklist.finalReport.split('\n');
                    const taskLines = reportLines.filter((line)=>line.trim().startsWith('•') && (line.includes('Obrigatória') || line.includes('Opcional')));
                    if (taskIndex !== undefined && taskLines[taskIndex]) {
                        const line = taskLines[taskIndex];
                        const match = line.match(/• (.+?) \((Obrigatória|Opcional)\)/);
                        if (match && match[1]) {
                            console.log(`✅ Task found in final report: ${match[1]}`);
                            return match[1];
                        }
                        const taskName = line.split('•')[1]?.split('(')[0]?.trim();
                        if (taskName) {
                            console.log(`✅ Task found in final report (fallback): ${taskName}`);
                            return taskName;
                        }
                    }
                } catch (reportError) {
                    console.warn('⚠️ Error parsing final report:', reportError);
                }
            }
            const savedTemplates = localStorage.getItem('checklistTemplates');
            let template = null;
            if (savedTemplates) {
                const templates = JSON.parse(savedTemplates);
                template = templates.find((t: any)=>t.role === user.role);
            }
            if (!template) {
                const professionalCategories = loadProfessionalCategories();
                const profession = professionalCategories.find((p)=>p.roleKey === user.role);
                if (profession) {
                    template = generateTemplateForProfession(user.role, profession.name);
                }
            }
            if (!template) {
                template = mockTemplates.find((t)=>t.role === user.role);
            }
            if (taskId && template?.tasks) {
                const task = template.tasks.find((t: any)=>t.id === taskId);
                if (task) {
                    console.log(`✅ Task found in templates by ID: ${task.title}`);
                    return task.title;
                }
            }
            if (taskIndex !== undefined && template?.tasks && template.tasks[taskIndex]) {
                console.log(`✅ Task found in templates by index: ${template.tasks[taskIndex].title}`);
                return template.tasks[taskIndex].title;
            }
            if (taskId && taskId !== 'unknown' && taskId !== '') {
                return `Tarefa #${taskId.substring(0, 8)}`;
            }
            return 'Tarefa não identificada';
        } catch (error) {
            console.error('❌ Error getting task title for:', taskId, error);
            return taskId ? `Tarefa #${taskId.substring(0, 8)}` : 'Tarefa não identificada';
        }
    };
    return (<div className="space-y-4" data-spec-id="checklist-details-view">
      <div className="bg-gray-50 p-4 rounded-lg" data-spec-id="checklist-summary">
        <div className="grid grid-cols-2 gap-4" data-spec-id="summary-grid">
          <div data-spec-id="summary-left">
            <p className="text-sm text-gray-600" data-spec-id="user-info">
              <strong data-spec-id="eZb4my2Xoe9GB4mf">Usuário:</strong> {user.name}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="period-info">
              <strong data-spec-id="zqvBtAZGA4q1laAz">Período:</strong> {getPeriodLabel(checklist.period, checklist.shift)}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="completion-info">
              <strong data-spec-id="xYuCrSbUiuG88HoJ">Progresso:</strong> {checklist.completionRate}%
            </p>
          </div>
          <div data-spec-id="summary-right">
            <p className="text-sm text-gray-600" data-spec-id="start-info">
              <strong data-spec-id="USlfc84nM5QYxlib">Iniciado:</strong> {formatTime(checklist.startedAt)}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="end-info">
              <strong data-spec-id="wUAFp9PumUYSvpEK">Finalizado:</strong> {formatTime(checklist.completedAt) || 'Em andamento'}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="status-info">
              <strong data-spec-id="0thcbpvL28GDmndC">Status:</strong> {checklist.isFinalized ? 'Finalizado' : 'Em andamento'}
            </p>
          </div>
        </div>
      </div>

      {checklist.finalReport && (<div className="bg-blue-50 p-4 rounded-lg border border-blue-200" data-spec-id="final-comments-section">
          <h4 className="font-medium text-blue-900 mb-2" data-spec-id="final-comments-title">
            📝 Comentários Finais do Usuário
          </h4>
          <div className="text-sm text-blue-800 whitespace-pre-wrap" data-spec-id="final-comments-content">
            {(()=>{
        const lines = checklist.finalReport.split('\n');
        const observacoesIndex = lines.findIndex((line)=>line.includes('📝 OBSERVAÇÕES FINAIS'));
        const fimRelatorioIndex = lines.findIndex((line)=>line.includes('=== FIM DO RELATÓRIO ==='));
        if (observacoesIndex !== -1 && fimRelatorioIndex !== -1) {
            const comentarios = lines.slice(observacoesIndex + 1, fimRelatorioIndex).filter((line)=>line.trim() !== '').join('\n').trim();
            return comentarios || 'Nenhum comentário adicionado pelo usuário.';
        }
        return 'Nenhum comentário adicionado pelo usuário.';
    })()}
          </div>
        </div>)}

      <div className="space-y-3" data-spec-id="tasks-details">
        <h4 className="font-medium text-gray-900" data-spec-id="tasks-title">
          Detalhes das Tarefas ({checklist.progress?.length || 0} tarefas)
        </h4>
        
        {checklist.progress && Array.isArray(checklist.progress) && checklist.progress.length > 0 ? (checklist.progress.map((task, index)=>(<div key={task.id || `task-${index}`} className="flex items-start justify-between p-3 border rounded-lg" data-spec-id={`task-detail-${task.id || index}`}>
            <div className="flex items-start space-x-3 flex-1" data-spec-id="task-detail-content">
              <div className="mt-1" data-spec-id="task-status-icon">
                {task.completed ? (<CheckCircle className="w-5 h-5 text-green-600" data-spec-id="task-completed-icon"/>) : (<XCircle className="w-5 h-5 text-red-600" data-spec-id="task-incomplete-icon"/>)}
              </div>
              
              <div className="flex-1" data-spec-id="task-detail-info">
                <h5 className="font-medium text-gray-900" data-spec-id="task-detail-title">
                  {getTaskTitle(task.taskId || 'unknown', index)}
                </h5>
                
                <div className="mt-2" data-spec-id="task-detail-meta">
                  <p className="text-sm text-gray-600" data-spec-id="task-completion-time">
                    <strong data-spec-id="uMpbHkPJSYY6uOOh">Concluído em:</strong> {task.completedAt ? new Date(task.completedAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Não concluído'}
                  </p>
                  
                  {task.notes && (<div className="mt-2" data-spec-id="task-notes-section">
                      <p className="text-sm font-medium text-gray-700" data-spec-id="notes-label">Observações:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1" data-spec-id="task-notes">
                        {task.notes}
                      </p>
                    </div>)}
                </div>
              </div>
            </div>
          </div>))) : (<div className="text-center py-4 text-gray-500" data-spec-id="no-tasks">
            <p data-spec-id="no-tasks-message">Nenhuma tarefa encontrada para este checklist</p>
          </div>)}
      </div>
    </div>);
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
const formatTime = (dateStr?: string)=>{
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};
export default AdminReports;
