import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FolderPlus, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { TaskCategory } from '@/types';
import { toast } from 'sonner';
const TaskCategoryManager = ()=>{
    const [categories, setCategories] = useState<TaskCategory[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        color: '#3B82F6'
    });
    const colors = [
        {
            value: '#3B82F6',
            name: 'Azul'
        },
        {
            value: '#10B981',
            name: 'Verde'
        },
        {
            value: '#F59E0B',
            name: 'Amarelo'
        },
        {
            value: '#EF4444',
            name: 'Vermelho'
        },
        {
            value: '#8B5CF6',
            name: 'Roxo'
        },
        {
            value: '#06B6D4',
            name: 'Ciano'
        },
        {
            value: '#F97316',
            name: 'Laranja'
        },
        {
            value: '#84CC16',
            name: 'Lima'
        }
    ];
    useEffect(()=>{
        loadCategories();
    }, []);
    const loadCategories = ()=>{
        const savedCategories = localStorage.getItem('taskCategories');
        if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
        } else {
            const defaultCategories = createDefaultCategories();
            setCategories(defaultCategories);
            localStorage.setItem('taskCategories', JSON.stringify(defaultCategories));
        }
    };
    const createDefaultCategories = (): TaskCategory[] =>{
        const now = new Date().toISOString();
        return [
            {
                id: 'cat-communication',
                name: 'Comunicação',
                description: 'Tarefas relacionadas a comunicação interna e externa',
                color: '#3B82F6',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-administration',
                name: 'Administração',
                description: 'Tarefas administrativas e burocráticas',
                color: '#10B981',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-patient-care',
                name: 'Cuidado do Paciente',
                description: 'Tarefas relacionadas ao cuidado direto com pacientes',
                color: '#EF4444',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-medication',
                name: 'Medicação',
                description: 'Tarefas relacionadas à administração de medicamentos',
                color: '#8B5CF6',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-documentation',
                name: 'Documentação',
                description: 'Tarefas de registro e documentação',
                color: '#F59E0B',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-safety',
                name: 'Segurança',
                description: 'Tarefas relacionadas à segurança e protocolos',
                color: '#06B6D4',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-sales',
                name: 'Vendas',
                description: 'Tarefas relacionadas a vendas e prospecção',
                color: '#F97316',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'cat-management',
                name: 'Gestão',
                description: 'Tarefas de gerenciamento e liderança',
                color: '#84CC16',
                createdAt: now,
                updatedAt: now
            }
        ];
    };
    const resetForm = ()=>{
        setNewCategory({
            name: '',
            description: '',
            color: '#3B82F6'
        });
        setEditingCategory(null);
    };
    const handleAdd = ()=>{
        if (!newCategory.name.trim()) {
            toast.error('Nome da categoria é obrigatório');
            return;
        }
        const category: TaskCategory = {
            id: `cat-${Date.now()}`,
            name: newCategory.name,
            description: newCategory.description,
            color: newCategory.color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updatedCategories = [
            ...categories,
            category
        ];
        setCategories(updatedCategories);
        localStorage.setItem('taskCategories', JSON.stringify(updatedCategories));
        toast.success('Categoria de tarefa criada com sucesso!');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleEdit = (category: TaskCategory)=>{
        setEditingCategory(category);
        setNewCategory({
            name: category.name,
            description: category.description || '',
            color: category.color
        });
        setIsAddDialogOpen(true);
    };
    const handleUpdate = ()=>{
        if (!editingCategory) return;
        if (!newCategory.name.trim()) {
            toast.error('Nome da categoria é obrigatório');
            return;
        }
        const updatedCategory: TaskCategory = {
            ...editingCategory,
            name: newCategory.name,
            description: newCategory.description,
            color: newCategory.color,
            updatedAt: new Date().toISOString()
        };
        const updatedCategories = categories.map((cat)=>cat.id === editingCategory.id ? updatedCategory : cat);
        setCategories(updatedCategories);
        localStorage.setItem('taskCategories', JSON.stringify(updatedCategories));
        toast.success('Categoria de tarefa atualizada com sucesso!');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleDelete = (categoryId: string)=>{
        const savedTasks = localStorage.getItem('masterTasks');
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            const isUsed = tasks.some((task: any)=>task.categoryId === categoryId);
            if (isUsed) {
                toast.error('Esta categoria não pode ser excluída pois está sendo usada por tarefas');
                return;
            }
        }
        const updatedCategories = categories.filter((cat)=>cat.id !== categoryId);
        setCategories(updatedCategories);
        localStorage.setItem('taskCategories', JSON.stringify(updatedCategories));
        toast.success('Categoria de tarefa removida com sucesso!');
    };
    const handleDialogClose = ()=>{
        resetForm();
        setIsAddDialogOpen(false);
    };
    return (<Card data-spec-id="task-category-manager-card">
      <CardHeader data-spec-id="task-category-header">
        <div className="flex items-center justify-between" data-spec-id="task-category-header-content">
          <div data-spec-id="task-category-title-section">
            <CardTitle className="flex items-center" data-spec-id="task-category-title">
              <FolderPlus className="w-5 h-5 mr-2" data-spec-id="folder-plus-icon"/>
              Categorias de Tarefas
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1" data-spec-id="task-category-subtitle">
              Gerencie as categorias disponíveis para classificar tarefas
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} data-spec-id="add-task-category-dialog">
            <DialogTrigger asChild data-spec-id="add-task-category-trigger">
              <Button onClick={()=>setIsAddDialogOpen(true)} data-spec-id="add-task-category-btn">
                <Plus className="w-4 h-4 mr-2" data-spec-id="plus-icon"/>
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-spec-id="add-task-category-content">
              <DialogHeader data-spec-id="add-task-category-dialog-header">
                <DialogTitle data-spec-id="add-task-category-dialog-title">
                  {editingCategory ? 'Editar Categoria de Tarefa' : 'Nova Categoria de Tarefa'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4" data-spec-id="task-category-form">
                <div data-spec-id="category-name-field">
                  <Label htmlFor="categoryName" data-spec-id="category-name-label">Nome da Categoria</Label>
                  <Input id="categoryName" value={newCategory.name} onChange={(e)=>setNewCategory({
            ...newCategory,
            name: e.target.value
        })} placeholder="Ex: Comunicação, Administração..." data-spec-id="category-name-input"/>
                </div>

                <div data-spec-id="category-description-field">
                  <Label htmlFor="categoryDescription" data-spec-id="category-description-label">Descrição</Label>
                  <Textarea id="categoryDescription" value={newCategory.description} onChange={(e)=>setNewCategory({
            ...newCategory,
            description: e.target.value
        })} placeholder="Descreva o tipo de tarefas desta categoria..." rows={3} data-spec-id="category-description-input"/>
                </div>

                <div data-spec-id="category-color-field">
                  <Label data-spec-id="category-color-label">Cor de Identificação</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2" data-spec-id="color-picker-grid">
                    {colors.map((color)=>(<button key={color.value} type="button" className={`w-12 h-12 rounded-lg border-2 ${newCategory.color === color.value ? 'border-gray-400' : 'border-gray-200'} hover:border-gray-400 transition-colors`} style={{
            backgroundColor: color.value
        }} onClick={()=>setNewCategory({
                ...newCategory,
                color: color.value
            })} title={color.name} data-spec-id={`color-option-${color.name.toLowerCase()}`}/>))}
                  </div>
                </div>
              </div>

              <DialogFooter data-spec-id="task-category-dialog-footer">
                <Button variant="outline" onClick={handleDialogClose} data-spec-id="cancel-task-category">
                  <X className="w-4 h-4 mr-2" data-spec-id="cancel-icon"/>
                  Cancelar
                </Button>
                <Button onClick={editingCategory ? handleUpdate : handleAdd} data-spec-id="save-task-category">
                  <Save className="w-4 h-4 mr-2" data-spec-id="save-icon"/>
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent data-spec-id="task-categories-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="task-categories-grid">
          {categories.map((category)=>(<div key={category.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-spec-id={`task-category-${category.id}`}>
              <div className="flex items-center justify-between" data-spec-id="category-header">
                <div className="flex items-center space-x-3" data-spec-id="category-info">
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{
            backgroundColor: category.color
        }} data-spec-id="category-color-indicator"/>
                  <div data-spec-id="category-details">
                    <h3 className="font-medium text-gray-900" data-spec-id="category-name">
                      {category.name}
                    </h3>
                    {category.description && (<p className="text-sm text-gray-600 mt-1" data-spec-id="category-description">
                        {category.description}
                      </p>)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2" data-spec-id="category-actions">
                  <Button variant="ghost" size="sm" onClick={()=>handleEdit(category)} data-spec-id={`edit-category-${category.id}`}>
                    <Edit className="w-4 h-4" data-spec-id="edit-icon"/>
                  </Button>
                  
                  <AlertDialog data-spec-id="delete-category-dialog">
                    <AlertDialogTrigger asChild data-spec-id="delete-category-trigger">
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-spec-id={`delete-category-${category.id}`}>
                        <Trash2 className="w-4 h-4" data-spec-id="trash-icon"/>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-spec-id="delete-category-dialog-content">
                      <AlertDialogHeader data-spec-id="delete-category-dialog-header">
                        <AlertDialogTitle data-spec-id="delete-category-dialog-title">
                          Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription data-spec-id="delete-category-dialog-description">
                          Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter data-spec-id="delete-category-dialog-footer">
                        <AlertDialogCancel data-spec-id="cancel-delete-category">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={()=>handleDelete(category.id)} className="bg-red-600 hover:bg-red-700" data-spec-id="confirm-delete-category">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>))}
        </div>

        {categories.length === 0 && (<div className="text-center py-8" data-spec-id="empty-categories-state">
            <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="empty-categories-icon"/>
            <p className="text-gray-600" data-spec-id="empty-categories-message">
              Nenhuma categoria de tarefa encontrada
            </p>
          </div>)}
      </CardContent>
    </Card>);
};
export default TaskCategoryManager;
