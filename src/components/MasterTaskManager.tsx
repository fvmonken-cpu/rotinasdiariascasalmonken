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
import { CheckSquare, Plus, Edit, Trash2, Save, X, Clock, AlertCircle, Users, RefreshCw, Filter, XCircle } from 'lucide-react';
import { Task, TaskCategory, ProfessionalCategory } from '@/types';
import { toast } from 'sonner';
import { updateTemplatesFromMasterTasks } from '@/utils/masterTaskUtils';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
const MasterTaskManager = ()=>{
    const { isSupabaseConnected } = useSupabaseAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
    const [professionalCategories, setProfessionalCategories] = useState<ProfessionalCategory[]>([]);
    const [inconsistentTasks, setInconsistentTasks] = useState<string[]>([]);
    const [hasConvertedRoleKeys, setHasConvertedRoleKeys] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [filters, setFilters] = useState({
        periods: [] as string[],
        professionalCategories: [] as string[],
        taskCategories: [] as string[]
    });
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
        setHasConvertedRoleKeys(false);
        loadData();
    }, [
        isSupabaseConnected
    ]);
    useEffect(()=>{
        if (tasks.length > 0 && professionalCategories.length > 0) {
            validateTaskAssignments();
        }
    }, [
        tasks,
        professionalCategories
    ]);
    useEffect(()=>{
        if (tasks.length > 0 && professionalCategories.length > 0 && !hasConvertedRoleKeys) {
            console.log('🔄 Starting roleKey to ID conversion...');
            console.log('📋 Current task assigned professions:', tasks.map((t)=>({
                    title: t.title,
                    assignedProfessions: t.assignedProfessions
                })));
            console.log('📂 Available professional categories:', professionalCategories.map((p)=>({
                    id: p.id,
                    name: p.name,
                    roleKey: p.roleKey
                })));
            let hasChanges = false;
            const updatedTasks = tasks.map((task)=>{
                const convertedProfessions = task.assignedProfessions.map((professionValue)=>{
                    const professionById = professionalCategories.find((p)=>p.id === professionValue);
                    if (professionById) {
                        return professionValue;
                    }
                    const professionByRole = professionalCategories.find((p)=>p.roleKey === professionValue);
                    if (professionByRole) {
                        hasChanges = true;
                        console.log(`🔄 Converting roleKey "${professionValue}" to ID "${professionByRole.id}" for ${professionByRole.name}`);
                        return professionByRole.id;
                    }
                    console.log(`⚠️ No match found for profession: "${professionValue}"`);
                    return professionValue;
                });
                if (JSON.stringify(convertedProfessions) !== JSON.stringify(task.assignedProfessions)) {
                    console.log(`📝 Task "${task.title}" professions converted:`, task.assignedProfessions, '→', convertedProfessions);
                    return {
                        ...task,
                        assignedProfessions: convertedProfessions
                    };
                }
                return task;
            });
            if (hasChanges) {
                console.log('✅ RoleKeys converted to IDs, updating task list');
                setTasks(updatedTasks);
            }
            setHasConvertedRoleKeys(true);
        }
    }, [
        tasks.length,
        professionalCategories.length,
        hasConvertedRoleKeys
    ]);
    const validateTaskAssignments = ()=>{
        console.log('🔍 Validating task assignments...');
        const validRoleKeys = professionalCategories.map((cat)=>cat.roleKey);
        const inconsistentTasks = tasks.filter((task)=>{
            return task.assignedProfessions.some((profession)=>!validRoleKeys.includes(profession) && !professionalCategories.find((cat)=>cat.id === profession));
        });
        if (inconsistentTasks.length > 0) {
            console.warn('⚠️ Found tasks with inconsistent professional assignments:', inconsistentTasks);
            toast.error(`⚠️ Encontradas ${inconsistentTasks.length} tarefa(s) com categorias profissionais inconsistentes. Revisar é necessário.`);
            setInconsistentTasks(inconsistentTasks.map((task)=>task.id));
        } else {
            console.log('✅ All task assignments are consistent');
            setInconsistentTasks([]);
        }
    };
    const loadData = async ()=>{
        if (!isSupabaseConnected) {
            console.log('⚠️ Supabase not connected - cloud-only mode requires Supabase');
            return;
        }
        try {
            const { supabase } = await import('@/lib/supabase');
            const { data: tasksData, error: tasksError } = await supabase.from('master_tasks').select('*');
            if (tasksError) {
                console.error('❌ Error loading tasks from Supabase:', tasksError);
            } else if (tasksData) {
                const tasks = tasksData.map((task: any)=>({
                        id: task.id,
                        title: task.name,
                        description: task.description,
                        categoryId: task.category_id,
                        priority: 'medium',
                        isRequired: task.is_required,
                        period: task.assigned_periods?.[0] || 'start_day',
                        periods: task.assigned_periods || [
                            'start_day'
                        ],
                        frequency: task.frequency,
                        assignedProfessions: cleanDuplicateCategories(task.assigned_roles || []),
                        createdAt: task.created_at,
                        updatedAt: task.updated_at
                    }));
                setTasks(tasks);
                console.log('✅ Tasks loaded from Supabase:', tasks.length);
            }
            const { data: categoriesData, error: categoriesError } = await supabase.from('task_categories').select('*');
            if (categoriesError) {
                console.error('❌ Error loading task categories from Supabase:', categoriesError);
            } else if (categoriesData) {
                const categories = categoriesData.map((cat: any)=>({
                        id: cat.id,
                        name: cat.name,
                        description: cat.description,
                        color: cat.color,
                        createdAt: cat.created_at,
                        updatedAt: cat.updated_at
                    }));
                setTaskCategories(categories);
                console.log('✅ Task categories loaded from Supabase:', categories.length);
            }
            const { data: profCategoriesData, error: profCategoriesError } = await supabase.from('professional_categories').select('*');
            if (profCategoriesError) {
                console.error('❌ Error loading professional categories from Supabase:', profCategoriesError);
            } else if (profCategoriesData) {
                const profCategories = profCategoriesData.map((prof: any)=>({
                        id: prof.id,
                        name: prof.name,
                        description: prof.description,
                        roleKey: prof.role_key,
                        color: prof.color || '#3B82F6',
                        createdAt: prof.created_at,
                        updatedAt: prof.updated_at
                    }));
                setProfessionalCategories(profCategories);
                console.log('✅ Professional categories loaded from Supabase:', profCategories.length);
            }
        } catch (error) {
            console.error('❌ Failed to load data from Supabase:', error);
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
    const convertProfessionalIdsToRoles = (professionIds: string[]): string[] =>{
        return professionIds.map((id)=>{
            const profession = professionalCategories.find((p)=>p.id === id);
            return profession?.roleKey || id;
        });
    };
    const convertRolesToProfessionalIds = (roleKeys: string[]): string[] =>{
        return roleKeys.map((roleKey)=>{
            const professionByRole = professionalCategories.find((p)=>p.roleKey === roleKey);
            if (professionByRole) {
                return professionByRole.id;
            }
            const professionById = professionalCategories.find((p)=>p.id === roleKey);
            if (professionById) {
                return roleKey;
            }
            return roleKey;
        });
    };
    const saveTaskToSupabase = async (task: Task)=>{
        if (!isSupabaseConnected) return;
        try {
            const { supabase } = await import('@/lib/supabase');
            const roleKeys = convertProfessionalIdsToRoles(task.assignedProfessions);
            const { data: categoryExists } = await supabase.from('task_categories').select('id').eq('id', task.categoryId).single();
            if (!categoryExists) {
                console.error('❌ Category not found:', task.categoryId);
                toast.error('Categoria da tarefa não encontrada no banco de dados');
                return;
            }
            const supabaseTask = {
                id: task.id,
                name: task.title,
                description: task.description,
                category_id: task.categoryId,
                is_required: task.isRequired,
                frequency: task.frequency,
                assigned_periods: task.periods,
                assigned_roles: roleKeys,
                created_at: task.createdAt,
                updated_at: task.updatedAt
            };
            console.log('💾 Saving task to Supabase with data:', supabaseTask);
            const { error } = await supabase.from('master_tasks').upsert(supabaseTask);
            if (error) {
                console.error('❌ Error saving task to Supabase:', error);
                toast.error(`Erro ao salvar tarefa: ${error.message}`);
            } else {
                console.log('✅ Task saved to Supabase:', task.title);
            }
        } catch (error) {
            console.error('❌ Failed to save task to Supabase:', error);
            toast.error('Falha ao conectar com o banco de dados');
        }
    };
    const deleteTaskFromSupabase = async (taskId: string)=>{
        if (!isSupabaseConnected) return;
        try {
            const { supabase } = await import('@/lib/supabase');
            const { error } = await supabase.from('master_tasks').delete().eq('id', taskId);
            if (error) {
                console.error('❌ Error deleting task from Supabase:', error);
            } else {
                console.log('✅ Task deleted from Supabase:', taskId);
            }
        } catch (error) {
            console.error('❌ Failed to delete task from Supabase:', error);
        }
    };
    const handleAdd = async ()=>{
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
            id: crypto.randomUUID(),
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
            assignedProfessions: cleanDuplicateCategories(newTask.assignedProfessions),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        console.log('💾 Saving task to Supabase:', task.title);
        await saveTaskToSupabase(task);
        const updatedTasks = [
            ...tasks,
            task
        ];
        setTasks(updatedTasks);
        updateTemplatesFromMasterTasks();
        toast.success('✅ Tarefa criada com sucesso e salva no Supabase!');
        console.log('✅ Task saved successfully to Supabase (cloud-only mode)');
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
    const handleUpdate = async ()=>{
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
            assignedProfessions: cleanDuplicateCategories(newTask.assignedProfessions),
            updatedAt: new Date().toISOString()
        };
        console.log('🔄 Updating task in Supabase:', updatedTask.title);
        await saveTaskToSupabase(updatedTask);
        const updatedTasks = tasks.map((task)=>task.id === editingTask.id ? updatedTask : task);
        setTasks(updatedTasks);
        updateTemplatesFromMasterTasks();
        toast.success('✅ Tarefa atualizada com sucesso no Supabase!');
        console.log('✅ Task updated successfully in Supabase (cloud-only mode)');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleDelete = async (taskId: string)=>{
        console.log('🗑️ Deleting task from Supabase:', taskId);
        await deleteTaskFromSupabase(taskId);
        const updatedTasks = tasks.filter((task)=>task.id !== taskId);
        setTasks(updatedTasks);
        updateTemplatesFromMasterTasks();
        toast.success('✅ Tarefa removida com sucesso do Supabase!');
        console.log('✅ Task deleted successfully from Supabase (cloud-only mode)');
    };
    const cleanDuplicateCategories = (professions: string[]): string[] =>{
        return Array.from(new Set(professions));
    };
    const handleCleanCategories = async (taskId: string)=>{
        console.log('🧹 Cleaning orphaned professional categories for task:', taskId);
        const taskToClean = tasks.find((task)=>task.id === taskId);
        if (!taskToClean) {
            toast.error('Tarefa não encontrada');
            return;
        }
        const validRoleKeys = professionalCategories.map((cat)=>cat.roleKey);
        const validIds = professionalCategories.map((cat)=>cat.id);
        const validCategories = taskToClean.assignedProfessions.filter((professionId)=>{
            return validRoleKeys.includes(professionId) || validIds.includes(professionId);
        });
        const cleanValidCategories = cleanDuplicateCategories(validCategories);
        const orphanedCount = taskToClean.assignedProfessions.length - cleanValidCategories.length;
        const cleanedTask: Task = {
            ...taskToClean,
            assignedProfessions: cleanValidCategories,
            updatedAt: new Date().toISOString()
        };
        console.log('💾 Saving cleaned task to Supabase:', cleanedTask.title);
        console.log(`🧹 Removed ${orphanedCount} orphaned/duplicate categories`);
        await saveTaskToSupabase(cleanedTask);
        const updatedTasks = tasks.map((task)=>task.id === taskId ? cleanedTask : task);
        setTasks(updatedTasks);
        setTimeout(()=>{
            if (tasks.length > 0 && professionalCategories.length > 0) {
                validateTaskAssignments();
            }
        }, 100);
        updateTemplatesFromMasterTasks();
        toast.success(`✅ ${orphanedCount} categoria(s) órfã(s) ou duplicada(s) removida(s)! ${cleanValidCategories.length} categoria(s) válida(s) mantida(s).`);
        console.log('✅ Orphaned categories cleaned successfully');
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
    const getProfessionName = (professionIdOrRoleKey: string)=>{
        let profession = professionalCategories.find((prof)=>prof.id === professionIdOrRoleKey);
        if (!profession) {
            profession = professionalCategories.find((prof)=>prof.roleKey === professionIdOrRoleKey);
        }
        if (profession) {
            return profession.name;
        }
        return `⚠️ ${professionIdOrRoleKey.substring(0, 8)}... (Órfã)`;
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
    const getFilteredTasks = ()=>{
        return tasks.filter((task)=>{
            if (filters.periods.length > 0) {
                const hasMatchingPeriod = task.periods.some((period)=>filters.periods.includes(period));
                if (!hasMatchingPeriod) return false;
            }
            if (filters.professionalCategories.length > 0) {
                const hasMatchingProfession = task.assignedProfessions.some((professionId)=>{
                    const profession = professionalCategories.find((p)=>p.id === professionId || p.roleKey === professionId);
                    return profession && filters.professionalCategories.includes(profession.id);
                });
                if (!hasMatchingProfession) return false;
            }
            if (filters.taskCategories.length > 0) {
                if (!filters.taskCategories.includes(task.categoryId)) return false;
            }
            return true;
        });
    };
    const clearAllFilters = ()=>{
        setFilters({
            periods: [],
            professionalCategories: [],
            taskCategories: []
        });
    };
    const toggleFilter = (filterType: keyof typeof filters, value: string)=>{
        setFilters((prev)=>({
                ...prev,
                [filterType]: prev[filterType].includes(value) ? prev[filterType].filter((item)=>item !== value) : [
                    ...prev[filterType],
                    value
                ]
            }));
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
                  <Label data-spec-id="task-periods-label">Períodos</Label>
                  <div className="grid grid-cols-2 gap-4 p-3 border rounded-md" data-spec-id="task-periods-lists">
                    <div data-spec-id="available-periods">
                      <Label className="text-sm font-medium text-gray-700" data-spec-id="available-periods-label">Disponíveis</Label>
                      <div className="space-y-2 mt-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50" data-spec-id="available-periods-list">
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
    ].filter((period)=>!newTask.periods.includes(period.value as any)).map((period)=>(<div key={period.value} className="flex items-center justify-between p-2 bg-white rounded border" data-spec-id={`available-period-${period.value}`}>
                            <span className="text-sm" data-spec-id={`period-name-${period.value}`}>{period.label}</span>
                            <Button type="button" variant="outline" size="sm" onClick={()=>{
            setNewTask({
                ...newTask,
                periods: [
                    ...newTask.periods,
                    period.value as any
                ]
            });
        }} data-spec-id={`add-period-${period.value}`}>
                              +
                            </Button>
                          </div>))}
                      </div>
                    </div>
                    
                    <div data-spec-id="assigned-periods">
                      <Label className="text-sm font-medium text-gray-700" data-spec-id="assigned-periods-label">Atribuídos</Label>
                      <div className="space-y-2 mt-2 max-h-32 overflow-y-auto border rounded p-2 bg-blue-50" data-spec-id="assigned-periods-list">
                        {newTask.periods.map((periodValue)=>{
        const period = [
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
        ].find((p)=>p.value === periodValue);
        return (<div key={periodValue} className="flex items-center justify-between p-2 bg-white rounded border" data-spec-id={`assigned-period-${periodValue}`}>
                              <span className="text-sm" data-spec-id={`assigned-period-name-${periodValue}`}>{period?.label}</span>
                              <Button type="button" variant="outline" size="sm" onClick={()=>{
            const newPeriods = newTask.periods.filter((p)=>p !== periodValue);
            if (newPeriods.length > 0) {
                setNewTask({
                    ...newTask,
                    periods: newPeriods
                });
            }
        }} className="text-red-600 hover:text-red-700" data-spec-id={`remove-period-${periodValue}`}>
                                -
                              </Button>
                            </div>);
    })}
                        {newTask.periods.length === 0 && (<div className="text-sm text-gray-500 p-2" data-spec-id="no-periods-assigned">
                            Nenhum período atribuído
                          </div>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div data-spec-id="task-professions-field">
                  <Label data-spec-id="task-professions-label">Categorias Profissionais</Label>
                  <div className="grid grid-cols-2 gap-4 p-3 border rounded-md" data-spec-id="task-professions-lists">
                    <div data-spec-id="available-professions">
                      <Label className="text-sm font-medium text-gray-700" data-spec-id="available-professions-label">Disponíveis</Label>
                      <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50" data-spec-id="available-professions-list">
                        {professionalCategories.filter((profession)=>!newTask.assignedProfessions.includes(profession.id)).map((profession)=>(<div key={profession.id} className="flex items-center justify-between p-2 bg-white rounded border" data-spec-id={`available-profession-${profession.id}`}>
                            <div className="flex items-center" data-spec-id="profession-info">
                              <div className="w-3 h-3 rounded-full mr-2" style={{
            backgroundColor: profession.color
        }} data-spec-id="profession-color-indicator"/>
                              <span className="text-sm" data-spec-id={`profession-name-${profession.id}`}>{profession.name}</span>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={()=>{
            setNewTask({
                ...newTask,
                assignedProfessions: [
                    ...newTask.assignedProfessions,
                    profession.id
                ]
            });
        }} data-spec-id={`add-profession-${profession.id}`}>
                              +
                            </Button>
                          </div>))}
                        {professionalCategories.filter((profession)=>!newTask.assignedProfessions.includes(profession.id)).length === 0 && (<div className="text-sm text-gray-500 p-2" data-spec-id="no-professions-available">
                            Todas as categorias estão atribuídas
                          </div>)}
                      </div>
                    </div>
                    
                    <div data-spec-id="assigned-professions">
                      <Label className="text-sm font-medium text-gray-700" data-spec-id="assigned-professions-label">Atribuídas</Label>
                      <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded p-2 bg-green-50" data-spec-id="assigned-professions-list">
                        {newTask.assignedProfessions.map((professionId)=>{
        const profession = professionalCategories.find((p)=>p.id === professionId);
        if (!profession) return null;
        return (<div key={professionId} className="flex items-center justify-between p-2 bg-white rounded border" data-spec-id={`assigned-profession-${professionId}`}>
                              <div className="flex items-center" data-spec-id="assigned-profession-info">
                                <div className="w-3 h-3 rounded-full mr-2" style={{
            backgroundColor: profession.color
        }} data-spec-id="assigned-profession-color"/>
                                <span className="text-sm" data-spec-id={`assigned-profession-name-${professionId}`}>{profession.name}</span>
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={()=>{
            setNewTask({
                ...newTask,
                assignedProfessions: newTask.assignedProfessions.filter((p)=>p !== professionId)
            });
        }} className="text-red-600 hover:text-red-700" data-spec-id={`remove-profession-${professionId}`}>
                                -
                              </Button>
                            </div>);
    })}
                        {newTask.assignedProfessions.length === 0 && (<div className="text-sm text-gray-500 p-2" data-spec-id="no-professions-assigned">
                            Nenhuma categoria atribuída
                          </div>)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1" data-spec-id="professions-help-text">
                    Mova categorias entre as listas para atribuir ou remover.
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
        {}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg" data-spec-id="filters-section">
          <div className="flex items-center justify-between mb-4" data-spec-id="filters-header">
            <div className="flex items-center" data-spec-id="filters-title">
              <Filter className="w-4 h-4 mr-2" data-spec-id="filter-icon"/>
              <h3 className="text-sm font-medium text-gray-700" data-spec-id="filters-label">Filtros</h3>
            </div>
            <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-gray-600 hover:text-gray-700" data-spec-id="clear-filters-btn">
              <XCircle className="w-4 h-4 mr-1" data-spec-id="clear-icon"/>
              Limpar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-spec-id="filters-grid">
            {}
            <div data-spec-id="periods-filter">
              <Label className="text-sm font-medium text-gray-700 mb-2 block" data-spec-id="periods-filter-label">
                Períodos ({filters.periods.length} selecionados)
              </Label>
              <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2 bg-white" data-spec-id="periods-filter-list">
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
    ].map((period)=>(<div key={period.value} className="flex items-center space-x-2" data-spec-id={`period-filter-${period.value}`}>
                    <input type="checkbox" id={`filter-period-${period.value}`} checked={filters.periods.includes(period.value)} onChange={()=>toggleFilter('periods', period.value)} className="rounded" data-spec-id={`period-filter-checkbox-${period.value}`}/>
                    <Label htmlFor={`filter-period-${period.value}`} className="text-sm cursor-pointer" data-spec-id={`period-filter-label-${period.value}`}>
                      {period.label}
                    </Label>
                  </div>))}
              </div>
            </div>
            
            {}
            <div data-spec-id="professions-filter">
              <Label className="text-sm font-medium text-gray-700 mb-2 block" data-spec-id="professions-filter-label">
                Categorias Profissionais ({filters.professionalCategories.length} selecionadas)
              </Label>
              <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2 bg-white" data-spec-id="professions-filter-list">
                {professionalCategories.map((profession)=>(<div key={profession.id} className="flex items-center space-x-2" data-spec-id={`profession-filter-${profession.id}`}>
                    <input type="checkbox" id={`filter-profession-${profession.id}`} checked={filters.professionalCategories.includes(profession.id)} onChange={()=>toggleFilter('professionalCategories', profession.id)} className="rounded" data-spec-id={`profession-filter-checkbox-${profession.id}`}/>
                    <Label htmlFor={`filter-profession-${profession.id}`} className="text-sm cursor-pointer flex items-center" data-spec-id={`profession-filter-label-${profession.id}`}>
                      <div className="w-3 h-3 rounded-full mr-1" style={{
            backgroundColor: profession.color
        }} data-spec-id="profession-filter-color"/>
                      {profession.name}
                    </Label>
                  </div>))}
              </div>
            </div>
            
            {}
            <div data-spec-id="task-categories-filter">
              <Label className="text-sm font-medium text-gray-700 mb-2 block" data-spec-id="task-categories-filter-label">
                Categorias de Tarefa ({filters.taskCategories.length} selecionadas)
              </Label>
              <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2 bg-white" data-spec-id="task-categories-filter-list">
                {taskCategories.map((category)=>(<div key={category.id} className="flex items-center space-x-2" data-spec-id={`task-category-filter-${category.id}`}>
                    <input type="checkbox" id={`filter-task-category-${category.id}`} checked={filters.taskCategories.includes(category.id)} onChange={()=>toggleFilter('taskCategories', category.id)} className="rounded" data-spec-id={`task-category-filter-checkbox-${category.id}`}/>
                    <Label htmlFor={`filter-task-category-${category.id}`} className="text-sm cursor-pointer flex items-center" data-spec-id={`task-category-filter-label-${category.id}`}>
                      <div className="w-3 h-3 rounded-full mr-1" style={{
            backgroundColor: category.color
        }} data-spec-id="task-category-filter-color"/>
                      {category.name}
                    </Label>
                  </div>))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4" data-spec-id="master-tasks-list">
          {getFilteredTasks().map((task)=>{
        const isInconsistent = inconsistentTasks.includes(task.id);
        return (<div key={task.id} className={`border rounded-lg p-4 transition-colors ${isInconsistent ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`} data-spec-id={`master-task-${task.id}`}>
              <div className="flex items-start justify-between" data-spec-id="task-header">
                <div className="flex-1" data-spec-id="task-info">
                  <div className="flex items-center space-x-2 mb-2" data-spec-id="task-title-row">
                    <h3 className="font-medium text-gray-900" data-spec-id="task-title">
                      {task.title}
                    </h3>
                    {task.isRequired && (<span className="text-red-500 text-sm" data-spec-id="required-indicator">*</span>)}
                    {isInconsistent && (<Badge variant="destructive" className="text-xs" data-spec-id="inconsistent-badge">
                        ⚠️ Inconsistente
                      </Badge>)}
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
                      {task.assignedProfessions.map((professionId)=>{
            const validRoleKeys = professionalCategories.map((cat)=>cat.roleKey);
            const isOrphan = !validRoleKeys.includes(professionId) && !professionalCategories.find((cat)=>cat.id === professionId);
            return (<Badge key={professionId} variant={isOrphan ? "destructive" : "secondary"} className={`text-xs ${isOrphan ? 'bg-red-100 text-red-800 border-red-200' : ''}`} data-spec-id={`profession-badge-${professionId}`}>
                          <Users className="w-3 h-3 mr-1" data-spec-id="users-icon"/>
                          {getProfessionName(professionId)}
                        </Badge>);
        })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4" data-spec-id="task-actions">
                  {isInconsistent && (<AlertDialog data-spec-id="clean-categories-dialog">
                      <AlertDialogTrigger asChild data-spec-id="clean-categories-trigger">
                        <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200" data-spec-id={`clean-categories-${task.id}`}>
                          <RefreshCw className="w-4 h-4 mr-1" data-spec-id="refresh-icon"/>
                          Corrigir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-spec-id="clean-categories-dialog-content">
                        <AlertDialogHeader data-spec-id="clean-categories-dialog-header">
                          <AlertDialogTitle data-spec-id="clean-categories-dialog-title">
                            Corrigir Categorias Profissionais
                          </AlertDialogTitle>
                          <AlertDialogDescription data-spec-id="clean-categories-dialog-description">
                            Esta ação vai remover <strong data-spec-id="tO18Y9Ar9KMOxzoS">apenas as categorias órfãs/duplicadas</strong> da tarefa 
                            "<strong data-spec-id="mZwmpOgwOIX6iiJT">{task.title}</strong>".
                            <br data-spec-id="IiOkEDCpwPDGZWND"/><br data-spec-id="qud9F0vIIMbNCDxm"/>
                            As categorias profissionais válidas serão <strong data-spec-id="8VSDX6I72pjGjgu6">mantidas</strong>. Apenas categorias 
                            inexistentes ou duplicadas serão removidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter data-spec-id="clean-categories-dialog-footer">
                          <AlertDialogCancel data-spec-id="clean-cancel-button">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={()=>handleCleanCategories(task.id)} className="bg-orange-600 hover:bg-orange-700" data-spec-id="clean-confirm-button">
                            Corrigir Categorias
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>)}

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
            </div>);
    })}
        </div>

        {tasks.length === 0 && (<div className="text-center py-8" data-spec-id="empty-tasks-state">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="empty-tasks-icon"/>
            <p className="text-gray-600" data-spec-id="empty-tasks-message">
              Nenhuma tarefa cadastrada
            </p>
          </div>)}
          
          {tasks.length > 0 && getFilteredTasks().length === 0 && (<div className="text-center py-8" data-spec-id="no-filtered-tasks-state">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="no-filtered-tasks-icon"/>
            <p className="text-gray-600 mb-2" data-spec-id="no-filtered-tasks-message">
              Nenhuma tarefa corresponde aos filtros aplicados
            </p>
            <Button variant="outline" onClick={clearAllFilters} data-spec-id="clear-filters-from-empty">
              Limpar Filtros
            </Button>
          </div>)}
      </CardContent>
    </Card>);
};
export default MasterTaskManager;
