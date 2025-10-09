import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckSquare, Plus, Edit, Trash2, Save, X, Clock, AlertCircle, Users } from 'lucide-react';
import { Task, TaskCategory, ProfessionalCategory } from '@/types';
import { toast } from 'sonner';
import { updateTemplatesFromMasterTasks } from '@/utils/masterTaskUtils';
const MasterTaskManager = ()=>{
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
    const [professionalCategories, setProfessionalCategories] = useState<ProfessionalCategory[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        categoryId: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        isRequired: false,
        periods: [
            'start_day'
        ] as ('start_day' | 'start_shift' | 'end_shift' | 'end_day')[],
        frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
        weekDay: 1,
        monthDay: 1,
        assignedProfessions: [] as string[]
    });
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
    useEffect(()=>{
        loadData();
    }, []);
    const loadData = ()=>{
        const savedTasks = localStorage.getItem('masterTasks');
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
        }
        const savedTaskCategories = localStorage.getItem('taskCategories');
        if (savedTaskCategories) {
            setTaskCategories(JSON.parse(savedTaskCategories));
        }
        const savedProfCategories = localStorage.getItem('professionalCategories');
        if (savedProfCategories) {
            setProfessionalCategories(JSON.parse(savedProfCategories));
        }
    };
    const resetForm = ()=>{
        setNewTask({
            title: '',
            description: '',
            categoryId: '',
            priority: 'medium',
            isRequired: false,
            periods: [
                'start_day'
            ],
            frequency: 'daily',
            weekDay: 1,
            monthDay: 1,
            assignedProfessions: []
        });
        setEditingTask(null);
    };
    const handleAdd = ()=>{
        if (!newTask.title.trim()) {
            toast.error('Título da tarefa é obrigatório');
            return;
        }
        if (!newTask.categoryId) {
            toast.error('Categoria da tarefa é obrigatória');
            return;
        }
        if (newTask.assignedProfessions.length === 0) {
            toast.error('Selecione pelo menos uma categoria profissional');
            return;
        }
        const task: Task = {
            id: `task-${Date.now()}`,
            title: newTask.title,
            description: newTask.description,
            categoryId: newTask.categoryId,
            priority: newTask.priority,
            isRequired: newTask.isRequired,
            period: newTask.periods[0],
            periods: newTask.periods,
            frequency: newTask.frequency,
            weekDay: newTask.frequency === 'weekly' ? newTask.weekDay : undefined,
            monthDay: newTask.frequency === 'monthly' ? newTask.monthDay : undefined,
            assignedProfessions: newTask.assignedProfessions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updatedTasks = [
            ...tasks,
            task
        ];
        setTasks(updatedTasks);
        localStorage.setItem('masterTasks', JSON.stringify(updatedTasks));
        updateTemplatesFromMasterTasks();
        toast.success('Tarefa criada com sucesso! Templates atualizados automaticamente.');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleEdit = (task: Task)=>{
        setEditingTask(task);
        setNewTask({
            title: task.title,
            description: task.description || '',
            categoryId: task.categoryId,
            priority: task.priority,
            isRequired: task.isRequired,
            periods: task.periods || [
                task.period
            ],
            frequency: task.frequency,
            weekDay: task.weekDay || 1,
            monthDay: task.monthDay || 1,
            assignedProfessions: task.assignedProfessions
        });
        setIsAddDialogOpen(true);
    };
    const handleUpdate = ()=>{
        if (!editingTask) return;
        if (!newTask.title.trim()) {
            toast.error('Título da tarefa é obrigatório');
            return;
        }
        if (!newTask.categoryId) {
            toast.error('Categoria da tarefa é obrigatória');
            return;
        }
        if (newTask.assignedProfessions.length === 0) {
            toast.error('Selecione pelo menos uma categoria profissional');
            return;
        }
        const updatedTask: Task = {
            ...editingTask,
            title: newTask.title,
            description: newTask.description,
            categoryId: newTask.categoryId,
            priority: newTask.priority,
            isRequired: newTask.isRequired,
            period: newTask.periods[0],
            periods: newTask.periods,
            frequency: newTask.frequency,
            weekDay: newTask.frequency === 'weekly' ? newTask.weekDay : undefined,
            monthDay: newTask.frequency === 'monthly' ? newTask.monthDay : undefined,
            assignedProfessions: newTask.assignedProfessions,
            updatedAt: new Date().toISOString()
        };
        const updatedTasks = tasks.map((task)=>task.id === editingTask.id ? updatedTask : task);
        setTasks(updatedTasks);
        localStorage.setItem('masterTasks', JSON.stringify(updatedTasks));
        updateTemplatesFromMasterTasks();
        toast.success('Tarefa atualizada com sucesso! Templates atualizados automaticamente.');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleDelete = (taskId: string)=>{
        const updatedTasks = tasks.filter((task)=>task.id !== taskId);
        setTasks(updatedTasks);
        localStorage.setItem('masterTasks', JSON.stringify(updatedTasks));
        updateTemplatesFromMasterTasks();
        toast.success('Tarefa removida com sucesso! Templates atualizados automaticamente.');
    };
    const handleDialogClose = ()=>{
        resetForm();
        setIsAddDialogOpen(false);
    };
    const getCategoryName = (categoryId: string)=>{
        const category = taskCategories.find((cat)=>cat.id === categoryId);
        return category?.name || 'Categoria não encontrada';
    };
    const getCategoryColor = (categoryId: string)=>{
        const category = taskCategories.find((cat)=>cat.id === categoryId);
        return category?.color || '#gray';
    };
    const getProfessionName = (professionId: string)=>{
        const profession = professionalCategories.find((prof)=>prof.id === professionId);
        return profession?.name || 'Profissão não encontrada';
    };
    const getPriorityColor = (priority: string)=>{
        switch(priority){
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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
    const getFrequencyLabel = (task: Task)=>{
        switch(task.frequency){
            case 'daily':
                return 'Diário';
            case 'weekly':
                const weekDay = weekDays.find((day)=>day.value === task.weekDay);
                return `Semanal (${weekDay?.label || 'Não definido'})`;
            case 'monthly':
                return `Mensal (dia ${task.monthDay || 1})`;
            default:
                return task.frequency;
        }
    };
    return (<Card data-spec-id="master-task-manager-card">
      <CardHeader data-spec-id="master-task-header">
        <div className="flex items-center justify-between" data-spec-id="master-task-header-content">
          <div data-spec-id="master-task-title-section">
            <CardTitle className="flex items-center" data-spec-id="master-task-title">
              <CheckSquare className="w-5 h-5 mr-2" data-spec-id="check-square-icon"/>
              Cadastro de Tarefas
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1" data-spec-id="master-task-subtitle">
              Gerencie o banco de tarefas disponíveis para atribuir às categorias profissionais
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} data-spec-id="add-master-task-dialog">
            <DialogTrigger asChild data-spec-id="add-master-task-trigger">
              <Button onClick={()=>setIsAddDialogOpen(true)} data-spec-id="add-master-task-btn">
                <Plus className="w-4 h-4 mr-2" data-spec-id="plus-icon"/>
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-spec-id="add-master-task-content">
              <DialogHeader data-spec-id="add-master-task-dialog-header">
                <DialogTitle data-spec-id="add-master-task-dialog-title">
                  {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4" data-spec-id="master-task-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="task-form-grid">
                  <div data-spec-id="task-title-field">
                    <Label htmlFor="taskTitle" data-spec-id="task-title-label">Título da Tarefa</Label>
                    <Input id="taskTitle" value={newTask.title} onChange={(e)=>setNewTask({
            ...newTask,
            title: e.target.value
        })} placeholder="Ex: Verificar e responder e-mails" data-spec-id="task-title-input"/>
                  </div>

                  <div data-spec-id="task-category-field">
                    <Label htmlFor="taskCategory" data-spec-id="task-category-label">Categoria da Tarefa</Label>
                    <Select value={newTask.categoryId} onValueChange={(value)=>setNewTask({
            ...newTask,
            categoryId: value
        })} data-spec-id="task-category-select">
                      <SelectTrigger data-spec-id="task-category-trigger">
                        <SelectValue placeholder="Selecione uma categoria" data-spec-id="task-category-placeholder"/>
                      </SelectTrigger>
                      <SelectContent data-spec-id="task-category-content">
                        {taskCategories.map((category)=>(<SelectItem key={category.id} value={category.id} data-spec-id={`task-category-${category.id}`}>
                            <div className="flex items-center" data-spec-id="aq31uS1MZS8ZzVur">
                              <div className="w-3 h-3 rounded-full mr-2" style={{
            backgroundColor: category.color
        }} data-spec-id="uKJRwjLgPzN2mbWK"/>
                              {category.name}
                            </div>
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div data-spec-id="task-priority-field">
                    <Label htmlFor="taskPriority" data-spec-id="task-priority-label">Prioridade</Label>
                    <Select value={newTask.priority} onValueChange={(value)=>setNewTask({
            ...newTask,
            priority: value as 'low' | 'medium' | 'high'
        })} data-spec-id="task-priority-select">
                      <SelectTrigger data-spec-id="task-priority-trigger">
                        <SelectValue data-spec-id="task-priority-value"/>
                      </SelectTrigger>
                      <SelectContent data-spec-id="task-priority-content">
                        <SelectItem value="low" data-spec-id="task-priority-low">Baixa</SelectItem>
                        <SelectItem value="medium" data-spec-id="task-priority-medium">Média</SelectItem>
                        <SelectItem value="high" data-spec-id="task-priority-high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div data-spec-id="task-frequency-field">
                    <Label htmlFor="taskFrequency" data-spec-id="task-frequency-label">Frequência</Label>
                    <Select value={newTask.frequency} onValueChange={(value)=>setNewTask({
            ...newTask,
            frequency: value as 'daily' | 'weekly' | 'monthly'
        })} data-spec-id="task-frequency-select">
                      <SelectTrigger data-spec-id="task-frequency-trigger">
                        <SelectValue data-spec-id="task-frequency-value"/>
                      </SelectTrigger>
                      <SelectContent data-spec-id="task-frequency-content">
                        <SelectItem value="daily" data-spec-id="task-frequency-daily">Diário</SelectItem>
                        <SelectItem value="weekly" data-spec-id="task-frequency-weekly">Semanal</SelectItem>
                        <SelectItem value="monthly" data-spec-id="task-frequency-monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newTask.frequency === 'weekly' && (<div data-spec-id="task-weekday-field">
                      <Label htmlFor="taskWeekDay" data-spec-id="task-weekday-label">Dia da Semana</Label>
                      <Select value={newTask.weekDay.toString()} onValueChange={(value)=>setNewTask({
            ...newTask,
            weekDay: parseInt(value)
        })} data-spec-id="task-weekday-select">
                        <SelectTrigger data-spec-id="task-weekday-trigger">
                          <SelectValue data-spec-id="task-weekday-value"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="task-weekday-content">
                          {weekDays.map((day)=>(<SelectItem key={day.value} value={day.value.toString()} data-spec-id={`task-weekday-${day.value}`}>
                              {day.label}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>)}

                  {newTask.frequency === 'monthly' && (<div data-spec-id="task-monthday-field">
                      <Label htmlFor="taskMonthDay" data-spec-id="task-monthday-label">Dia do Mês</Label>
                      <Input id="taskMonthDay" type="number" min="1" max="31" value={newTask.monthDay} onChange={(e)=>setNewTask({
            ...newTask,
            monthDay: parseInt(e.target.value) || 1
        })} data-spec-id="task-monthday-input"/>
                    </div>)}


                </div>

                <div data-spec-id="task-description-field">
                  <Label htmlFor="taskDescription" data-spec-id="task-description-label">Descrição</Label>
                  <Textarea id="taskDescription" value={newTask.description} onChange={(e)=>setNewTask({
            ...newTask,
            description: e.target.value
        })} placeholder="Descreva detalhadamente a tarefa..." rows={3} data-spec-id="task-description-input"/>
                </div>

                <div data-spec-id="task-periods-field">
                  <Label data-spec-id="task-periods-label">Períodos (selecione um ou mais)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md" data-spec-id="task-periods-checkboxes">
                    {[
        {
            value: 'start_day',
            label: 'Início do Dia'
        },
        {
            value: 'start_shift',
            label: 'Início do Turno'
        },
        {
            value: 'end_shift',
            label: 'Final do Turno'
        },
        {
            value: 'end_day',
            label: 'Final do Dia'
        }
    ].map((period)=>(<div key={period.value} className="flex items-center space-x-2" data-spec-id={`task-period-${period.value}-checkbox`}>
                        <input type="checkbox" id={`period-${period.value}`} checked={newTask.periods.includes(period.value as any)} onChange={(e)=>{
            if (e.target.checked) {
                setNewTask({
                    ...newTask,
                    periods: [
                        ...newTask.periods,
                        period.value as any
                    ]
                });
            } else {
                const newPeriods = newTask.periods.filter((p)=>p !== period.value);
                if (newPeriods.length > 0) {
                    setNewTask({
                        ...newTask,
                        periods: newPeriods
                    });
                }
            }
        }} className="rounded" data-spec-id={`${period.value}-checkbox`}/>
                        <Label htmlFor={`period-${period.value}`} className="text-sm" data-spec-id={`${period.value}-label`}>
                          {period.label}
                        </Label>
                      </div>))}
                  </div>
                </div>

                <div data-spec-id="task-professions-field">
                  <Label data-spec-id="task-professions-label">Categorias Profissionais (selecione uma ou mais)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto" data-spec-id="task-professions-checkboxes">
                    {professionalCategories.map((profession)=>(<div key={profession.id} className="flex items-center space-x-2" data-spec-id={`task-profession-${profession.id}-checkbox`}>
                        <input type="checkbox" id={`profession-${profession.id}`} checked={newTask.assignedProfessions.includes(profession.id)} onChange={(e)=>{
            if (e.target.checked) {
                setNewTask({
                    ...newTask,
                    assignedProfessions: [
                        ...newTask.assignedProfessions,
                        profession.id
                    ]
                });
            } else {
                setNewTask({
                    ...newTask,
                    assignedProfessions: newTask.assignedProfessions.filter((p)=>p !== profession.id)
                });
            }
        }} className="rounded" data-spec-id={`profession-${profession.id}-checkbox`}/>
                        <Label htmlFor={`profession-${profession.id}`} className="text-sm flex items-center" data-spec-id={`profession-${profession.id}-label`}>
                          <div className="w-3 h-3 rounded-full mr-2" style={{
            backgroundColor: profession.color
        }} data-spec-id="VNY9oiyd28FXxehU"/>
                          {profession.name}
                        </Label>
                      </div>))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1" data-spec-id="professions-help-text">
                    Selecione quais categorias profissionais podem executar esta tarefa.
                  </p>
                </div>

                <div className="flex items-center space-x-2" data-spec-id="task-required-field">
                  <input type="checkbox" id="taskRequired" checked={newTask.isRequired} onChange={(e)=>setNewTask({
            ...newTask,
            isRequired: e.target.checked
        })} className="rounded" data-spec-id="task-required-checkbox"/>
                  <Label htmlFor="taskRequired" data-spec-id="task-required-label">Tarefa obrigatória</Label>
                </div>
              </div>

              <DialogFooter data-spec-id="master-task-dialog-footer">
                <Button variant="outline" onClick={handleDialogClose} data-spec-id="cancel-master-task">
                  <X className="w-4 h-4 mr-2" data-spec-id="cancel-icon"/>
                  Cancelar
                </Button>
                <Button onClick={editingTask ? handleUpdate : handleAdd} data-spec-id="save-master-task">
                  <Save className="w-4 h-4 mr-2" data-spec-id="save-icon"/>
                  {editingTask ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent data-spec-id="master-tasks-content">
        <div className="space-y-4" data-spec-id="master-tasks-list">
          {tasks.map((task)=>(<div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-spec-id={`master-task-${task.id}`}>
              <div className="flex items-start justify-between" data-spec-id="task-header">
                <div className="flex-1" data-spec-id="task-info">
                  <div className="flex items-center space-x-2 mb-2" data-spec-id="task-title-row">
                    <h3 className="font-medium text-gray-900" data-spec-id="task-title">
                      {task.title}
                    </h3>
                    {task.isRequired && (<span className="text-red-500 text-sm" data-spec-id="required-indicator">*</span>)}
                  </div>
                  
                  {task.description && (<p className="text-sm text-gray-600 mb-3" data-spec-id="task-description">
                      {task.description}
                    </p>)}

                  <div className="flex flex-wrap items-center gap-2" data-spec-id="task-badges">
                    <Badge variant="outline" className="text-xs" style={{
            backgroundColor: `${getCategoryColor(task.categoryId)}20`,
            borderColor: getCategoryColor(task.categoryId),
            color: getCategoryColor(task.categoryId)
        }} data-spec-id="category-badge">
                      {getCategoryName(task.categoryId)}
                    </Badge>
                    
                    <Badge variant="outline" className={getPriorityColor(task.priority)} data-spec-id="priority-badge">
                      <AlertCircle className="w-3 h-3 mr-1" data-spec-id="priority-icon"/>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    
                    {(task.periods || [
            task.period
        ]).map((period, index)=>(<Badge key={`${period}-${index}`} variant="outline" className="text-purple-800 bg-purple-50 border-purple-200" data-spec-id={`period-badge-${period}`}>
                        <Clock className="w-3 h-3 mr-1" data-spec-id={`period-icon-${period}`}/>
                        {getPeriodLabel(period)}
                      </Badge>))}
                    
                    <Badge variant="outline" className="text-green-800 bg-green-50 border-green-200" data-spec-id="frequency-badge">
                      {getFrequencyLabel(task)}
                    </Badge>


                  </div>

                  <div className="mt-3" data-spec-id="assigned-professions-section">
                    <p className="text-xs text-gray-500 mb-1" data-spec-id="professions-label">Categorias Profissionais:</p>
                    <div className="flex flex-wrap gap-1" data-spec-id="professions-list">
                      {task.assignedProfessions.map((professionId)=>(<Badge key={professionId} variant="secondary" className="text-xs" data-spec-id={`profession-badge-${professionId}`}>
                          <Users className="w-3 h-3 mr-1" data-spec-id="users-icon"/>
                          {getProfessionName(professionId)}
                        </Badge>))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4" data-spec-id="task-actions">
                  <Button variant="ghost" size="sm" onClick={()=>handleEdit(task)} data-spec-id={`edit-task-${task.id}`}>
                    <Edit className="w-4 h-4" data-spec-id="edit-icon"/>
                  </Button>
                  
                  <AlertDialog data-spec-id="delete-task-dialog">
                    <AlertDialogTrigger asChild data-spec-id="delete-task-trigger">
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-spec-id={`delete-task-${task.id}`}>
                        <Trash2 className="w-4 h-4" data-spec-id="trash-icon"/>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-spec-id="delete-task-dialog-content">
                      <AlertDialogHeader data-spec-id="delete-task-dialog-header">
                        <AlertDialogTitle data-spec-id="delete-task-dialog-title">
                          Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription data-spec-id="delete-task-dialog-description">
                          Tem certeza que deseja excluir a tarefa "{task.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter data-spec-id="delete-task-dialog-footer">
                        <AlertDialogCancel data-spec-id="cancel-delete-task">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={()=>handleDelete(task.id)} className="bg-red-600 hover:bg-red-700" data-spec-id="confirm-delete-task">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>))}
        </div>

        {tasks.length === 0 && (<div className="text-center py-8" data-spec-id="empty-tasks-state">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="empty-tasks-icon"/>
            <p className="text-gray-600" data-spec-id="empty-tasks-message">
              Nenhuma tarefa cadastrada
            </p>
          </div>)}
      </CardContent>
    </Card>);
};
export default MasterTaskManager;
