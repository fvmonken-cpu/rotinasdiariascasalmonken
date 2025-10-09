import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Plus, Edit, Trash2, Save, X, Clock, AlertCircle, Calendar, RotateCcw, Users } from 'lucide-react';
import { ChecklistTemplate, Task, User } from '@/types';
import { mockTemplates } from '@/data/mockData';
import { toast } from 'sonner';
const RoleTemplateManager = ()=>{
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
    const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        isRequired: false,
        period: 'start_day',
        frequency: 'daily',
        weekDay: 1,
        monthDay: 1
    });
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        role: '' as User['role']
    });
    useEffect(()=>{
        loadTemplates();
    }, []);
    const loadTemplates = ()=>{
        const savedTemplates = localStorage.getItem('checklistTemplates');
        if (savedTemplates) {
            const parsedTemplates = JSON.parse(savedTemplates);
            setTemplates(parsedTemplates);
            console.log('Templates loaded:', parsedTemplates);
        } else {
            initializeDefaultTemplates();
        }
    };
    const initializeDefaultTemplates = ()=>{
        const defaultTemplates = mockTemplates.map((template)=>({
                ...template,
                updatedAt: new Date().toISOString()
            }));
        setTemplates(defaultTemplates);
        localStorage.setItem('checklistTemplates', JSON.stringify(defaultTemplates));
        console.log('Templates padrão criados com tarefas:', defaultTemplates);
    };
    const resetTemplates = ()=>{
        localStorage.removeItem('checklistTemplates');
        initializeDefaultTemplates();
        setSelectedTemplate(null);
        toast.success('Templates resetados com dados padrão');
    };
    const saveTemplates = (updatedTemplates: ChecklistTemplate[])=>{
        localStorage.setItem('checklistTemplates', JSON.stringify(updatedTemplates));
        setTemplates(updatedTemplates);
    };
    const addTask = ()=>{
        if (!selectedTemplate || !newTask.title?.trim()) {
            toast.error('Por favor, preencha o título da tarefa');
            return;
        }
        const task: Task = {
            id: `task-${Date.now()}`,
            title: newTask.title.trim(),
            description: newTask.description || '',
            category: newTask.category || 'Geral',
            priority: newTask.priority as 'low' | 'medium' | 'high',
            isRequired: newTask.isRequired || false,
            period: newTask.period as 'start_day' | 'start_shift' | 'end_shift' | 'end_day',
            frequency: newTask.frequency as 'daily' | 'weekly' | 'monthly',
            weekDay: newTask.frequency === 'weekly' ? newTask.weekDay : undefined,
            monthDay: newTask.frequency === 'monthly' ? newTask.monthDay : undefined
        };
        const updatedTemplate = {
            ...selectedTemplate,
            tasks: [
                ...selectedTemplate.tasks,
                task
            ],
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = templates.map((t)=>t.id === selectedTemplate.id ? updatedTemplate : t);
        saveTemplates(updatedTemplates);
        setSelectedTemplate(updatedTemplate);
        setNewTask({
            title: '',
            description: '',
            category: '',
            priority: 'medium',
            isRequired: false,
            period: 'start_day',
            frequency: 'daily',
            weekDay: 1,
            monthDay: 1
        });
        setShowNewTaskDialog(false);
        toast.success('Tarefa adicionada com sucesso');
    };
    const updateTask = (taskId: string, updatedTask: Task)=>{
        if (!selectedTemplate) return;
        const updatedTemplate = {
            ...selectedTemplate,
            tasks: selectedTemplate.tasks.map((t)=>t.id === taskId ? updatedTask : t),
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = templates.map((t)=>t.id === selectedTemplate.id ? updatedTemplate : t);
        saveTemplates(updatedTemplates);
        setSelectedTemplate(updatedTemplate);
        setEditingTask(null);
        toast.success('Tarefa atualizada com sucesso');
    };
    const deleteTask = (taskId: string)=>{
        if (!selectedTemplate) return;
        const updatedTemplate = {
            ...selectedTemplate,
            tasks: selectedTemplate.tasks.filter((t)=>t.id !== taskId),
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = templates.map((t)=>t.id === selectedTemplate.id ? updatedTemplate : t);
        saveTemplates(updatedTemplates);
        setSelectedTemplate(updatedTemplate);
        toast.success('Tarefa removida com sucesso');
    };
    const createTemplate = ()=>{
        if (!newTemplate.name.trim() || !newTemplate.role) {
            toast.error('Por favor, preencha nome e função');
            return;
        }
        const template: ChecklistTemplate = {
            id: `template-${Date.now()}`,
            name: newTemplate.name.trim(),
            role: newTemplate.role,
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = [
            ...templates,
            template
        ];
        saveTemplates(updatedTemplates);
        setNewTemplate({
            name: '',
            role: '' as User['role']
        });
        setShowNewTemplateDialog(false);
        toast.success('Template criado com sucesso');
    };
    const deleteTemplate = (templateId: string)=>{
        const updatedTemplates = templates.filter((t)=>t.id !== templateId);
        saveTemplates(updatedTemplates);
        if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null);
        }
        toast.success('Template removido com sucesso');
    };
    const getRoleColor = (role: string)=>{
        const colors = {
            director: 'bg-purple-100 text-purple-800',
            secretary: 'bg-blue-100 text-blue-800',
            nurse: 'bg-green-100 text-green-800',
            sdr: 'bg-orange-100 text-orange-800'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };
    const getPriorityColor = (priority: string)=>{
        const colors = {
            high: 'text-red-600 bg-red-50 border-red-200',
            medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            low: 'text-green-600 bg-green-50 border-green-200'
        };
        return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
    };
    const getPeriodLabel = (period: string)=>{
        const labels = {
            start_day: 'Início do Dia',
            start_shift: 'Início do Turno',
            end_shift: 'Final do Turno',
            end_day: 'Final do Dia'
        };
        return labels[period as keyof typeof labels] || period;
    };
    const getFrequencyLabel = (frequency: string, weekDay?: number, monthDay?: number)=>{
        switch(frequency){
            case 'daily':
                return 'Diário';
            case 'weekly':
                const days = [
                    'Dom',
                    'Seg',
                    'Ter',
                    'Qua',
                    'Qui',
                    'Sex',
                    'Sáb'
                ];
                return `Semanal (${days[weekDay || 0]})`;
            case 'monthly':
                return `Mensal (dia ${monthDay || 1})`;
            default:
                return frequency;
        }
    };
    const getRoleLabel = (role: string)=>{
        const labels = {
            director: 'Diretora',
            secretary: 'Secretária',
            nurse: 'Enfermeira',
            sdr: 'SDR'
        };
        return labels[role as keyof typeof labels] || role;
    };
    return (<Card data-spec-id="role-template-manager-card">
      <CardHeader data-spec-id="template-manager-header">
        <div className="flex items-center justify-between" data-spec-id="template-header-content">
          <div data-spec-id="template-header-info">
            <CardTitle className="flex items-center" data-spec-id="template-header-title">
              <Settings className="w-5 h-5 mr-2" data-spec-id="settings-icon"/>
              Gerenciar Role Templates
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1" data-spec-id="template-header-description">
              Configure tarefas para cada função no sistema
            </p>
          </div>
          
          <div className="flex space-x-2" data-spec-id="template-header-actions">
            <Button variant="outline" onClick={resetTemplates} data-spec-id="reset-templates-btn">
              <RotateCcw className="w-4 h-4 mr-2" data-spec-id="reset-icon"/>
              Resetar Templates
            </Button>
            <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog} data-spec-id="new-template-dialog">
              <DialogTrigger asChild data-spec-id="new-template-trigger">
                <Button data-spec-id="add-template-btn">
                  <Plus className="w-4 h-4 mr-2" data-spec-id="plus-icon"/>
                  Novo Template
                </Button>
              </DialogTrigger>
            <DialogContent data-spec-id="new-template-content">
              <DialogHeader data-spec-id="new-template-header">
                <DialogTitle data-spec-id="new-template-title">Criar Novo Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4" data-spec-id="new-template-form">
                <div data-spec-id="template-name-field">
                  <Label htmlFor="template-name" data-spec-id="template-name-label">Nome do Template</Label>
                  <Input id="template-name" value={newTemplate.name} onChange={(e)=>setNewTemplate({
            ...newTemplate,
            name: e.target.value
        })} placeholder="ex: Template Personalizado" data-spec-id="template-name-input"/>
                </div>
                <div data-spec-id="template-role-field">
                  <Label htmlFor="template-role" data-spec-id="template-role-label">Função</Label>
                  <Select value={newTemplate.role} onValueChange={(value)=>setNewTemplate({
            ...newTemplate,
            role: value as User['role']
        })} data-spec-id="template-role-select">
                    <SelectTrigger data-spec-id="template-role-trigger">
                      <SelectValue placeholder="Selecione uma função" data-spec-id="template-role-value"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="template-role-content">
                      <SelectItem value="director" data-spec-id="role-director">Diretora</SelectItem>
                      <SelectItem value="secretary" data-spec-id="role-secretary">Secretária</SelectItem>
                      <SelectItem value="nurse" data-spec-id="role-nurse">Enfermeira</SelectItem>
                      <SelectItem value="sdr" data-spec-id="role-sdr">SDR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2" data-spec-id="template-actions">
                  <Button variant="outline" onClick={()=>setShowNewTemplateDialog(false)} data-spec-id="cancel-template-btn">
                    Cancelar
                  </Button>
                  <Button onClick={createTemplate} data-spec-id="create-template-btn">
                    Criar Template
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent data-spec-id="template-manager-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-spec-id="template-manager-grid">
          
          {}
          <Card className="lg:col-span-1" data-spec-id="templates-list-card">
            <CardHeader data-spec-id="templates-list-header">
              <CardTitle className="flex items-center" data-spec-id="templates-list-title">
                <Users className="w-5 h-5 mr-2" data-spec-id="users-icon"/>
                Templates Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-spec-id="templates-list-content">
              {templates.map((template)=>(<div key={template.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={()=>setSelectedTemplate(template)} data-spec-id={`template-item-${template.id}`}>
                  <div className="flex items-center justify-between" data-spec-id="template-item-header">
                    <div data-spec-id="template-item-info">
                      <h3 className="font-medium text-gray-900" data-spec-id="template-item-name">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600" data-spec-id="template-item-tasks">
                        {template.tasks.length} tarefas
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2" data-spec-id="template-item-actions">
                      <Badge className={getRoleColor(template.role)} data-spec-id="template-item-role">
                        {getRoleLabel(template.role)}
                      </Badge>
                      
                      <AlertDialog data-spec-id="delete-template-dialog">
                        <AlertDialogTrigger asChild data-spec-id="delete-template-trigger">
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-spec-id={`delete-template-${template.id}`}>
                            <Trash2 className="w-4 h-4" data-spec-id="trash-icon"/>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-spec-id="delete-template-content">
                          <AlertDialogHeader data-spec-id="delete-template-header">
                            <AlertDialogTitle data-spec-id="delete-template-title">Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription data-spec-id="delete-template-description">
                              Tem certeza que deseja excluir o template "{template.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter data-spec-id="delete-template-footer">
                            <AlertDialogCancel data-spec-id="cancel-delete-template">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={()=>deleteTemplate(template.id)} className="bg-red-600 hover:bg-red-700" data-spec-id="confirm-delete-template">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>))}
            </CardContent>
          </Card>

          {}
          <Card className="lg:col-span-2" data-spec-id="template-details-card">
            {selectedTemplate ? (<>
                <CardHeader data-spec-id="template-details-header">
                  <div className="flex items-center justify-between" data-spec-id="template-details-header-content">
                    <div data-spec-id="template-details-info">
                      <CardTitle data-spec-id="template-details-title">
                        {selectedTemplate.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600" data-spec-id="template-details-meta">
                        Última atualização: {new Date(selectedTemplate.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2" data-spec-id="template-details-actions">
                      <Badge className={getRoleColor(selectedTemplate.role)} data-spec-id="template-details-role">
                        {getRoleLabel(selectedTemplate.role)}
                      </Badge>
                      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog} data-spec-id="new-task-dialog">
                        <DialogTrigger asChild data-spec-id="new-task-trigger">
                          <Button data-spec-id="add-task-btn">
                            <Plus className="w-4 h-4 mr-2" data-spec-id="plus-task-icon"/>
                            Nova Tarefa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl" data-spec-id="new-task-content">
                          <DialogHeader data-spec-id="new-task-header">
                            <DialogTitle data-spec-id="new-task-title">Adicionar Nova Tarefa</DialogTitle>
                          </DialogHeader>
                          <NewTaskForm newTask={newTask} setNewTask={setNewTask} onSave={addTask} onCancel={()=>setShowNewTaskDialog(false)} data-spec-id="9fyhoWeo9HoajtyY"/>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4" data-spec-id="template-details-content">
                  {selectedTemplate.tasks.length > 0 ? (selectedTemplate.tasks.map((task)=>(<TaskItemCard key={task.id} task={task} editingTask={editingTask} onEdit={setEditingTask} onUpdate={updateTask} onDelete={deleteTask} onCancelEdit={()=>setEditingTask(null)} data-spec-id="ZTsYqzlF14BOcDpM"/>))) : (<div className="text-center py-8 text-gray-500" data-spec-id="empty-tasks-state">
                      <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" data-spec-id="empty-tasks-icon"/>
                      <p data-spec-id="empty-tasks-message">
                        Nenhuma tarefa encontrada. Adicione algumas tarefas para começar.
                      </p>
                    </div>)}
                </CardContent>
              </>) : (<CardContent className="text-center py-12" data-spec-id="no-template-selected">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" data-spec-id="no-template-icon"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="no-template-title">
                  Selecione um Template
                </h3>
                <p className="text-gray-600" data-spec-id="no-template-description">
                  Escolha um template na lista ao lado para visualizar e editar suas tarefas.
                </p>
              </CardContent>)}
          </Card>
        </div>
      </CardContent>
    </Card>);
};
const NewTaskForm = ({ newTask, setNewTask, onSave, onCancel }: {
    newTask: Partial<Task>;
    setNewTask: (task: Partial<Task>) => void;
    onSave: () => void;
    onCancel: () => void;
})=>{
    const weekDays = [
        {
            value: 0,
            label: 'Domingo'
        },
        {
            value: 1,
            label: 'Segunda-feira'
        },
        {
            value: 2,
            label: 'Terça-feira'
        },
        {
            value: 3,
            label: 'Quarta-feira'
        },
        {
            value: 4,
            label: 'Quinta-feira'
        },
        {
            value: 5,
            label: 'Sexta-feira'
        },
        {
            value: 6,
            label: 'Sábado'
        }
    ];
    return (<div className="space-y-4" data-spec-id="new-task-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="task-form-grid">
        <div data-spec-id="task-title-field">
          <Label htmlFor="task-title" data-spec-id="task-title-label">Título da Tarefa *</Label>
          <Input id="task-title" value={newTask.title || ''} onChange={(e)=>setNewTask({
            ...newTask,
            title: e.target.value
        })} placeholder="Digite o título da tarefa" data-spec-id="task-title-input"/>
        </div>
        
        <div data-spec-id="task-category-field">
          <Label htmlFor="task-category" data-spec-id="task-category-label">Categoria</Label>
          <Input id="task-category" value={newTask.category || ''} onChange={(e)=>setNewTask({
            ...newTask,
            category: e.target.value
        })} placeholder="ex: Comunicação, Administração" data-spec-id="task-category-input"/>
        </div>
        
        <div data-spec-id="task-priority-field">
          <Label htmlFor="task-priority" data-spec-id="task-priority-label">Prioridade</Label>
          <Select value={newTask.priority || 'medium'} onValueChange={(value)=>setNewTask({
            ...newTask,
            priority: value as 'low' | 'medium' | 'high'
        })} data-spec-id="task-priority-select">
            <SelectTrigger data-spec-id="task-priority-trigger">
              <SelectValue data-spec-id="task-priority-value"/>
            </SelectTrigger>
            <SelectContent data-spec-id="task-priority-content">
              <SelectItem value="low" data-spec-id="priority-low">Baixa</SelectItem>
              <SelectItem value="medium" data-spec-id="priority-medium">Média</SelectItem>
              <SelectItem value="high" data-spec-id="priority-high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div data-spec-id="task-period-field">
          <Label data-spec-id="task-period-label">Períodos (selecione um ou mais)</Label>
          <div className="space-y-2 p-3 border rounded-md" data-spec-id="task-periods-checkboxes">
            <div className="flex items-center space-x-2" data-spec-id="period-start-day-checkbox">
              <input type="checkbox" id="period-start-day" checked={(newTask.periods || [
        newTask.period
    ]).includes('start_day')} onChange={(e)=>{
        const currentPeriods = newTask.periods || [
            newTask.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'start_day'
                ])
            ];
            setNewTask({
                ...newTask,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'start_day');
            setNewTask({
                ...newTask,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="start-day-checkbox"/>
              <Label htmlFor="period-start-day" data-spec-id="start-day-label">Início do Dia</Label>
            </div>
            <div className="flex items-center space-x-2" data-spec-id="period-start-shift-checkbox">
              <input type="checkbox" id="period-start-shift" checked={(newTask.periods || [
        newTask.period
    ]).includes('start_shift')} onChange={(e)=>{
        const currentPeriods = newTask.periods || [
            newTask.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'start_shift'
                ])
            ];
            setNewTask({
                ...newTask,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'start_shift');
            setNewTask({
                ...newTask,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="start-shift-checkbox"/>
              <Label htmlFor="period-start-shift" data-spec-id="start-shift-label">Início do Turno</Label>
            </div>
            <div className="flex items-center space-x-2" data-spec-id="period-end-shift-checkbox">
              <input type="checkbox" id="period-end-shift" checked={(newTask.periods || [
        newTask.period
    ]).includes('end_shift')} onChange={(e)=>{
        const currentPeriods = newTask.periods || [
            newTask.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'end_shift'
                ])
            ];
            setNewTask({
                ...newTask,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'end_shift');
            setNewTask({
                ...newTask,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="end-shift-checkbox"/>
              <Label htmlFor="period-end-shift" data-spec-id="end-shift-label">Final do Turno</Label>
            </div>
            <div className="flex items-center space-x-2" data-spec-id="period-end-day-checkbox">
              <input type="checkbox" id="period-end-day" checked={(newTask.periods || [
        newTask.period
    ]).includes('end_day')} onChange={(e)=>{
        const currentPeriods = newTask.periods || [
            newTask.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'end_day'
                ])
            ];
            setNewTask({
                ...newTask,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'end_day');
            setNewTask({
                ...newTask,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="end-day-checkbox"/>
              <Label htmlFor="period-end-day" data-spec-id="end-day-label">Final do Dia</Label>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1" data-spec-id="periods-help-text">
            Selecione em quais períodos esta tarefa deve aparecer nos checklists.
          </p>
        </div>
        
        <div data-spec-id="task-frequency-field">
          <Label htmlFor="task-frequency" data-spec-id="task-frequency-label">Frequência</Label>
          <Select value={newTask.frequency || 'daily'} onValueChange={(value)=>setNewTask({
            ...newTask,
            frequency: value as 'daily' | 'weekly' | 'monthly'
        })} data-spec-id="task-frequency-select">
            <SelectTrigger data-spec-id="task-frequency-trigger">
              <SelectValue data-spec-id="task-frequency-value"/>
            </SelectTrigger>
            <SelectContent data-spec-id="task-frequency-content">
              <SelectItem value="daily" data-spec-id="frequency-daily">Diário</SelectItem>
              <SelectItem value="weekly" data-spec-id="frequency-weekly">Semanal</SelectItem>
              <SelectItem value="monthly" data-spec-id="frequency-monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {newTask.frequency === 'weekly' && (<div data-spec-id="task-weekday-field">
            <Label htmlFor="task-weekday" data-spec-id="task-weekday-label">Dia da Semana</Label>
            <Select value={newTask.weekDay?.toString() || '1'} onValueChange={(value)=>setNewTask({
            ...newTask,
            weekDay: parseInt(value)
        })} data-spec-id="task-weekday-select">
              <SelectTrigger data-spec-id="task-weekday-trigger">
                <SelectValue data-spec-id="task-weekday-value"/>
              </SelectTrigger>
              <SelectContent data-spec-id="task-weekday-content">
                {weekDays.map((day)=>(<SelectItem key={day.value} value={day.value.toString()} data-spec-id={`weekday-${day.value}`}>
                    {day.label}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>)}
        
        {newTask.frequency === 'monthly' && (<div data-spec-id="task-monthday-field">
            <Label htmlFor="task-monthday" data-spec-id="task-monthday-label">Dia do Mês</Label>
            <Input id="task-monthday" type="number" min="1" max="31" value={newTask.monthDay || 1} onChange={(e)=>setNewTask({
            ...newTask,
            monthDay: parseInt(e.target.value)
        })} data-spec-id="task-monthday-input"/>
          </div>)}
        
        <div className="md:col-span-2" data-spec-id="task-description-field">
          <Label htmlFor="task-description" data-spec-id="task-description-label">Descrição</Label>
          <Textarea id="task-description" value={newTask.description || ''} onChange={(e)=>setNewTask({
            ...newTask,
            description: e.target.value
        })} placeholder="Descrição opcional da tarefa" rows={3} data-spec-id="task-description-input"/>
        </div>
        
        <div className="flex items-center space-x-2" data-spec-id="task-required-field">
          <input type="checkbox" id="task-required" checked={newTask.isRequired || false} onChange={(e)=>setNewTask({
            ...newTask,
            isRequired: e.target.checked
        })} className="rounded" data-spec-id="task-required-checkbox"/>
          <Label htmlFor="task-required" data-spec-id="task-required-label">Tarefa obrigatória</Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2" data-spec-id="task-form-actions">
        <Button variant="outline" onClick={onCancel} data-spec-id="cancel-task-btn">
          <X className="w-4 h-4 mr-2" data-spec-id="x-icon"/>
          Cancelar
        </Button>
        <Button onClick={onSave} data-spec-id="save-task-btn">
          <Save className="w-4 h-4 mr-2" data-spec-id="save-icon"/>
          Salvar Tarefa
        </Button>
      </div>
    </div>);
};
const TaskItemCard = ({ task, editingTask, onEdit, onUpdate, onDelete, onCancelEdit }: {
    task: Task;
    editingTask: Task | null;
    onEdit: (task: Task) => void;
    onUpdate: (taskId: string, task: Task) => void;
    onDelete: (taskId: string) => void;
    onCancelEdit: () => void;
})=>{
    const [editedTask, setEditedTask] = useState<Task>(task);
    const getPriorityColor = (priority: string)=>{
        const colors = {
            high: 'text-red-600 bg-red-50 border-red-200',
            medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            low: 'text-green-600 bg-green-50 border-green-200'
        };
        return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
    };
    const getPeriodLabel = (period: string)=>{
        const labels = {
            start_day: 'Início do Dia',
            start_shift: 'Início do Turno',
            end_shift: 'Final do Turno',
            end_day: 'Final do Dia'
        };
        return labels[period as keyof typeof labels] || period;
    };
    const getFrequencyLabel = (frequency: string, weekDay?: number, monthDay?: number)=>{
        switch(frequency){
            case 'daily':
                return 'Diário';
            case 'weekly':
                const days = [
                    'Dom',
                    'Seg',
                    'Ter',
                    'Qua',
                    'Qui',
                    'Sex',
                    'Sáb'
                ];
                return `Semanal (${days[weekDay || 0]})`;
            case 'monthly':
                return `Mensal (dia ${monthDay || 1})`;
            default:
                return frequency;
        }
    };
    const isEditing = editingTask?.id === task.id;
    return (<div className="border rounded-lg p-4 hover:shadow-sm transition-shadow" data-spec-id={`task-item-${task.id}`}>
      {isEditing ? (<EditTaskForm task={editedTask} setTask={setEditedTask} onSave={()=>onUpdate(task.id, editedTask)} onCancel={onCancelEdit} data-spec-id="VhVlsHgcRpfeJem5"/>) : (<div data-spec-id="task-display">
          <div className="flex items-start justify-between mb-3" data-spec-id="task-header">
            <div className="flex-1" data-spec-id="task-info">
              <h5 className="font-medium text-gray-900" data-spec-id="task-title">
                {task.title}
                {task.isRequired && (<span className="text-red-500 ml-1" data-spec-id="required-indicator">*</span>)}
              </h5>
              {task.description && (<p className="text-sm text-gray-600 mt-1" data-spec-id="task-description">
                  {task.description}
                </p>)}
            </div>
            
            <div className="flex items-center space-x-2 ml-4" data-spec-id="task-actions">
              <Button variant="ghost" size="sm" onClick={()=>onEdit(task)} data-spec-id={`edit-task-${task.id}`}>
                <Edit className="w-4 h-4" data-spec-id="edit-icon"/>
              </Button>
              <AlertDialog data-spec-id="delete-task-dialog">
                <AlertDialogTrigger asChild data-spec-id="delete-task-trigger">
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-spec-id={`delete-task-${task.id}`}>
                    <Trash2 className="w-4 h-4" data-spec-id="delete-icon"/>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-spec-id="delete-task-content">
                  <AlertDialogHeader data-spec-id="delete-task-header">
                    <AlertDialogTitle data-spec-id="delete-task-title">Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription data-spec-id="delete-task-description">
                      Tem certeza que deseja excluir a tarefa "{task.title}"?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter data-spec-id="delete-task-footer">
                    <AlertDialogCancel data-spec-id="cancel-delete-task">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={()=>onDelete(task.id)} className="bg-red-600 hover:bg-red-700" data-spec-id="confirm-delete-task">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2" data-spec-id="task-badges">
            <Badge variant="outline" className={getPriorityColor(task.priority)} data-spec-id="priority-badge">
              <AlertCircle className="w-3 h-3 mr-1" data-spec-id="priority-icon"/>
              {task.priority}
            </Badge>
            
            <Badge variant="outline" className="text-blue-800 bg-blue-50 border-blue-200" data-spec-id="category-badge">
              {task.category}
            </Badge>
            
            {(task.periods || [
        task.period
    ]).map((period, index)=>(<Badge key={`${period}-${index}`} variant="outline" className="text-purple-800 bg-purple-50 border-purple-200" data-spec-id={`period-badge-${period}`}>
                <Clock className="w-3 h-3 mr-1" data-spec-id={`period-icon-${period}`}/>
                {getPeriodLabel(period)}
              </Badge>))}
            
            <Badge variant="outline" className="text-green-800 bg-green-50 border-green-200" data-spec-id="frequency-badge">
              <Calendar className="w-3 h-3 mr-1" data-spec-id="frequency-icon"/>
              {getFrequencyLabel(task.frequency, task.weekDay, task.monthDay)}
            </Badge>
          </div>
        </div>)}
    </div>);
};
const EditTaskForm = ({ task, setTask, onSave, onCancel }: {
    task: Task;
    setTask: (task: Task) => void;
    onSave: () => void;
    onCancel: () => void;
})=>{
    const weekDays = [
        {
            value: 0,
            label: 'Domingo'
        },
        {
            value: 1,
            label: 'Segunda-feira'
        },
        {
            value: 2,
            label: 'Terça-feira'
        },
        {
            value: 3,
            label: 'Quarta-feira'
        },
        {
            value: 4,
            label: 'Quinta-feira'
        },
        {
            value: 5,
            label: 'Sexta-feira'
        },
        {
            value: 6,
            label: 'Sábado'
        }
    ];
    return (<div className="space-y-4" data-spec-id="edit-task-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="edit-task-grid">
        <div data-spec-id="edit-title-field">
          <Label data-spec-id="edit-title-label">Título da Tarefa</Label>
          <Input value={task.title} onChange={(e)=>setTask({
            ...task,
            title: e.target.value
        })} data-spec-id="edit-title-input"/>
        </div>
        
        <div data-spec-id="edit-category-field">
          <Label data-spec-id="edit-category-label">Categoria</Label>
          <Input value={task.category} onChange={(e)=>setTask({
            ...task,
            category: e.target.value
        })} data-spec-id="edit-category-input"/>
        </div>
        
        <div data-spec-id="edit-priority-field">
          <Label data-spec-id="edit-priority-label">Prioridade</Label>
          <Select value={task.priority} onValueChange={(value)=>setTask({
            ...task,
            priority: value as 'low' | 'medium' | 'high'
        })} data-spec-id="edit-priority-select">
            <SelectTrigger data-spec-id="edit-priority-trigger">
              <SelectValue data-spec-id="edit-priority-value"/>
            </SelectTrigger>
            <SelectContent data-spec-id="edit-priority-content">
              <SelectItem value="low" data-spec-id="edit-priority-low">Baixa</SelectItem>
              <SelectItem value="medium" data-spec-id="edit-priority-medium">Média</SelectItem>
              <SelectItem value="high" data-spec-id="edit-priority-high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div data-spec-id="edit-period-field">
          <Label data-spec-id="edit-period-label">Períodos (selecione um ou mais)</Label>
          <div className="space-y-2 p-3 border rounded-md" data-spec-id="edit-task-periods-checkboxes">
            <div className="flex items-center space-x-2" data-spec-id="edit-period-start-day-checkbox">
              <input type="checkbox" id="edit-period-start-day" checked={(task.periods || [
        task.period
    ]).includes('start_day')} onChange={(e)=>{
        const currentPeriods = task.periods || [
            task.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'start_day'
                ])
            ];
            setTask({
                ...task,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'start_day');
            setTask({
                ...task,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="edit-start-day-checkbox"/>
              <Label htmlFor="edit-period-start-day" data-spec-id="edit-start-day-label">Início do Dia</Label>
            </div>
            <div className="flex items-center space-x-2" data-spec-id="edit-period-start-shift-checkbox">
              <input type="checkbox" id="edit-period-start-shift" checked={(task.periods || [
        task.period
    ]).includes('start_shift')} onChange={(e)=>{
        const currentPeriods = task.periods || [
            task.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'start_shift'
                ])
            ];
            setTask({
                ...task,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'start_shift');
            setTask({
                ...task,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="edit-start-shift-checkbox"/>
              <Label htmlFor="edit-period-start-shift" data-spec-id="edit-start-shift-label">Início do Turno</Label>
            </div>
            <div className="flex items-center space-x-2" data-spec-id="edit-period-end-shift-checkbox">
              <input type="checkbox" id="edit-period-end-shift" checked={(task.periods || [
        task.period
    ]).includes('end_shift')} onChange={(e)=>{
        const currentPeriods = task.periods || [
            task.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'end_shift'
                ])
            ];
            setTask({
                ...task,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'end_shift');
            setTask({
                ...task,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="edit-end-shift-checkbox"/>
              <Label htmlFor="edit-period-end-shift" data-spec-id="edit-end-shift-label">Final do Turno</Label>
            </div>
            <div className="flex items-center space-x-2" data-spec-id="edit-period-end-day-checkbox">
              <input type="checkbox" id="edit-period-end-day" checked={(task.periods || [
        task.period
    ]).includes('end_day')} onChange={(e)=>{
        const currentPeriods = task.periods || [
            task.period
        ];
        if (e.target.checked) {
            const newPeriods = [
                ...new Set([
                    ...currentPeriods,
                    'end_day'
                ])
            ];
            setTask({
                ...task,
                periods: newPeriods,
                period: newPeriods[0]
            });
        } else {
            const newPeriods = currentPeriods.filter((p)=>p !== 'end_day');
            setTask({
                ...task,
                periods: newPeriods.length > 0 ? newPeriods : undefined,
                period: newPeriods[0] || 'start_day'
            });
        }
    }} className="rounded" data-spec-id="edit-end-day-checkbox"/>
              <Label htmlFor="edit-period-end-day" data-spec-id="edit-end-day-label">Final do Dia</Label>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1" data-spec-id="edit-periods-help-text">
            Selecione em quais períodos esta tarefa deve aparecer nos checklists.
          </p>
        </div>
        
        <div data-spec-id="edit-frequency-field">
          <Label data-spec-id="edit-frequency-label">Frequência</Label>
          <Select value={task.frequency} onValueChange={(value)=>setTask({
            ...task,
            frequency: value as 'daily' | 'weekly' | 'monthly'
        })} data-spec-id="edit-frequency-select">
            <SelectTrigger data-spec-id="edit-frequency-trigger">
              <SelectValue data-spec-id="edit-frequency-value"/>
            </SelectTrigger>
            <SelectContent data-spec-id="edit-frequency-content">
              <SelectItem value="daily" data-spec-id="edit-frequency-daily">Diário</SelectItem>
              <SelectItem value="weekly" data-spec-id="edit-frequency-weekly">Semanal</SelectItem>
              <SelectItem value="monthly" data-spec-id="edit-frequency-monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {task.frequency === 'weekly' && (<div data-spec-id="edit-weekday-field">
            <Label data-spec-id="edit-weekday-label">Dia da Semana</Label>
            <Select value={task.weekDay?.toString() || '1'} onValueChange={(value)=>setTask({
            ...task,
            weekDay: parseInt(value)
        })} data-spec-id="edit-weekday-select">
              <SelectTrigger data-spec-id="edit-weekday-trigger">
                <SelectValue data-spec-id="edit-weekday-value"/>
              </SelectTrigger>
              <SelectContent data-spec-id="edit-weekday-content">
                {weekDays.map((day)=>(<SelectItem key={day.value} value={day.value.toString()} data-spec-id={`edit-weekday-${day.value}`}>
                    {day.label}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>)}
        
        {task.frequency === 'monthly' && (<div data-spec-id="edit-monthday-field">
            <Label data-spec-id="edit-monthday-label">Dia do Mês</Label>
            <Input type="number" min="1" max="31" value={task.monthDay || 1} onChange={(e)=>setTask({
            ...task,
            monthDay: parseInt(e.target.value)
        })} data-spec-id="edit-monthday-input"/>
          </div>)}
        
        <div className="md:col-span-2" data-spec-id="edit-description-field">
          <Label data-spec-id="edit-description-label">Descrição</Label>
          <Textarea value={task.description} onChange={(e)=>setTask({
            ...task,
            description: e.target.value
        })} rows={2} data-spec-id="edit-description-input"/>
        </div>
        
        <div className="flex items-center space-x-2" data-spec-id="edit-required-field">
          <input type="checkbox" checked={task.isRequired} onChange={(e)=>setTask({
            ...task,
            isRequired: e.target.checked
        })} className="rounded" data-spec-id="edit-required-checkbox"/>
          <Label data-spec-id="edit-required-label">Tarefa obrigatória</Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2" data-spec-id="edit-task-actions">
        <Button variant="outline" onClick={onCancel} data-spec-id="cancel-edit-btn">
          <X className="w-4 h-4 mr-2" data-spec-id="cancel-edit-icon"/>
          Cancelar
        </Button>
        <Button onClick={onSave} data-spec-id="save-edit-btn">
          <Save className="w-4 h-4 mr-2" data-spec-id="save-edit-icon"/>
          Salvar
        </Button>
      </div>
    </div>);
};
export default RoleTemplateManager;
