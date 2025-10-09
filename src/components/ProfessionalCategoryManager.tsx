import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { ProfessionalCategory } from '@/types';
import { toast } from 'sonner';
const ProfessionalCategoryManager = ()=>{
    const [categories, setCategories] = useState<ProfessionalCategory[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProfessionalCategory | null>(null);
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        roleKey: '',
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
        const savedCategories = localStorage.getItem('professionalCategories');
        if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
        } else {
            const defaultCategories = createDefaultCategories();
            setCategories(defaultCategories);
            localStorage.setItem('professionalCategories', JSON.stringify(defaultCategories));
        }
    };
    const createDefaultCategories = (): ProfessionalCategory[] =>{
        const now = new Date().toISOString();
        return [
            {
                id: 'prof-secretary',
                name: 'Secretária',
                description: 'Responsável por tarefas administrativas e de comunicação',
                roleKey: 'secretary',
                color: '#3B82F6',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'prof-nurse',
                name: 'Enfermeira',
                description: 'Responsável por cuidados médicos e bem-estar dos pacientes',
                roleKey: 'nurse',
                color: '#10B981',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'prof-sdr',
                name: 'SDR',
                description: 'Representante de Desenvolvimento de Vendas',
                roleKey: 'sdr',
                color: '#F59E0B',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'prof-director',
                name: 'Diretor',
                description: 'Responsável pela gestão estratégica e liderança',
                roleKey: 'director',
                color: '#8B5CF6',
                createdAt: now,
                updatedAt: now
            }
        ];
    };
    const resetForm = ()=>{
        setNewCategory({
            name: '',
            description: '',
            roleKey: '',
            color: '#3B82F6'
        });
        setEditingCategory(null);
    };
    const handleAdd = ()=>{
        if (!newCategory.name.trim()) {
            toast.error('Nome da categoria é obrigatório');
            return;
        }
        if (!newCategory.roleKey.trim()) {
            toast.error('Chave da categoria é obrigatória');
            return;
        }
        if (categories.some((cat)=>cat.roleKey === newCategory.roleKey)) {
            toast.error('Já existe uma categoria com essa chave');
            return;
        }
        const category: ProfessionalCategory = {
            id: `prof-${Date.now()}`,
            name: newCategory.name,
            description: newCategory.description,
            roleKey: newCategory.roleKey,
            color: newCategory.color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updatedCategories = [
            ...categories,
            category
        ];
        setCategories(updatedCategories);
        localStorage.setItem('professionalCategories', JSON.stringify(updatedCategories));
        toast.success('Categoria profissional criada com sucesso!');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleEdit = (category: ProfessionalCategory)=>{
        setEditingCategory(category);
        setNewCategory({
            name: category.name,
            description: category.description || '',
            roleKey: category.roleKey,
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
        if (!newCategory.roleKey.trim()) {
            toast.error('Chave da categoria é obrigatória');
            return;
        }
        if (categories.some((cat)=>cat.roleKey === newCategory.roleKey && cat.id !== editingCategory.id)) {
            toast.error('Já existe uma categoria com essa chave');
            return;
        }
        const updatedCategory: ProfessionalCategory = {
            ...editingCategory,
            name: newCategory.name,
            description: newCategory.description,
            roleKey: newCategory.roleKey,
            color: newCategory.color,
            updatedAt: new Date().toISOString()
        };
        const updatedCategories = categories.map((cat)=>cat.id === editingCategory.id ? updatedCategory : cat);
        setCategories(updatedCategories);
        localStorage.setItem('professionalCategories', JSON.stringify(updatedCategories));
        toast.success('Categoria profissional atualizada com sucesso!');
        resetForm();
        setIsAddDialogOpen(false);
    };
    const handleDelete = (categoryId: string)=>{
        const updatedCategories = categories.filter((cat)=>cat.id !== categoryId);
        setCategories(updatedCategories);
        localStorage.setItem('professionalCategories', JSON.stringify(updatedCategories));
        toast.success('Categoria profissional removida com sucesso!');
    };
    const handleDialogClose = ()=>{
        resetForm();
        setIsAddDialogOpen(false);
    };
    return (<Card data-spec-id="professional-category-manager-card">
      <CardHeader data-spec-id="professional-category-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0" data-spec-id="professional-category-header-content">
          <div data-spec-id="professional-category-title-section">
            <CardTitle className="flex items-center" data-spec-id="professional-category-title">
              <Users className="w-5 h-5 mr-2" data-spec-id="users-icon"/>
              <span className="text-lg sm:text-xl" data-spec-id="nME7tTclsEklNXDz">Categorias Profissionais</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1" data-spec-id="professional-category-subtitle">
              Gerencie as categorias profissionais disponíveis no sistema
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} data-spec-id="add-professional-category-dialog">
            <DialogTrigger asChild data-spec-id="add-professional-category-trigger">
              <Button onClick={()=>setIsAddDialogOpen(true)} className="w-full sm:w-auto" data-spec-id="add-professional-category-btn">
                <Plus className="w-4 h-4 mr-2" data-spec-id="plus-icon"/>
                <span className="hidden sm:inline" data-spec-id="b8pUCav4FypX5jsU">Nova Categoria</span>
                <span className="sm:hidden" data-spec-id="oi6K3kD1WBmUVLMk">Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full mx-4" data-spec-id="add-professional-category-content">
              <DialogHeader data-spec-id="add-professional-category-dialog-header">
                <DialogTitle className="text-lg" data-spec-id="add-professional-category-dialog-title">
                  {editingCategory ? 'Editar Categoria Profissional' : 'Nova Categoria Profissional'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4" data-spec-id="professional-category-form">
                <div data-spec-id="category-name-field">
                  <Label htmlFor="categoryName" data-spec-id="category-name-label">Nome da Categoria</Label>
                  <Input id="categoryName" value={newCategory.name} onChange={(e)=>setNewCategory({
            ...newCategory,
            name: e.target.value
        })} placeholder="Ex: Secretária, Enfermeira..." data-spec-id="category-name-input"/>
                </div>
                
                <div data-spec-id="category-key-field">
                  <Label htmlFor="categoryKey" data-spec-id="category-key-label">Chave da Categoria</Label>
                  <Input id="categoryKey" value={newCategory.roleKey} onChange={(e)=>setNewCategory({
            ...newCategory,
            roleKey: e.target.value.toLowerCase()
        })} placeholder="Ex: secretary, nurse..." data-spec-id="category-key-input"/>
                  <p className="text-xs text-gray-500 mt-1" data-spec-id="category-key-help">
                    Identificador único (apenas letras minúsculas, sem espaços)
                  </p>
                </div>

                <div data-spec-id="category-description-field">
                  <Label htmlFor="categoryDescription" data-spec-id="category-description-label">Descrição</Label>
                  <Textarea id="categoryDescription" value={newCategory.description} onChange={(e)=>setNewCategory({
            ...newCategory,
            description: e.target.value
        })} placeholder="Descreva as responsabilidades desta categoria..." rows={3} data-spec-id="category-description-input"/>
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

              <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2" data-spec-id="professional-category-dialog-footer">
                <Button variant="outline" onClick={handleDialogClose} className="w-full sm:w-auto" data-spec-id="cancel-professional-category">
                  <X className="w-4 h-4 mr-2" data-spec-id="cancel-icon"/>
                  Cancelar
                </Button>
                <Button onClick={editingCategory ? handleUpdate : handleAdd} className="w-full sm:w-auto" data-spec-id="save-professional-category">
                  <Save className="w-4 h-4 mr-2" data-spec-id="save-icon"/>
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent data-spec-id="professional-categories-content">
        <div className="grid gap-4" data-spec-id="professional-categories-grid">
          {categories.map((category)=>(<div key={category.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-spec-id={`professional-category-${category.id}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0" data-spec-id="category-header">
                <div className="flex items-center space-x-3" data-spec-id="category-info">
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" style={{
            backgroundColor: category.color
        }} data-spec-id="category-color-indicator"/>
                  <div className="flex-1 min-w-0" data-spec-id="category-details">
                    <h3 className="font-medium text-gray-900 truncate" data-spec-id="category-name">
                      {category.name}
                    </h3>
                    <Badge variant="outline" className="text-xs mt-1" data-spec-id="category-key-badge">
                      {category.roleKey}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 justify-end sm:justify-start" data-spec-id="category-actions">
                  <Button variant="ghost" size="sm" onClick={()=>handleEdit(category)} className="flex-1 sm:flex-none" data-spec-id={`edit-category-${category.id}`}>
                    <Edit className="w-4 h-4 sm:mr-0 mr-2" data-spec-id="edit-icon"/>
                    <span className="sm:hidden" data-spec-id="x1SqqRf3Wz0JcJr7">Editar</span>
                  </Button>
                  
                  <AlertDialog data-spec-id="delete-category-dialog">
                    <AlertDialogTrigger asChild data-spec-id="delete-category-trigger">
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 flex-1 sm:flex-none" data-spec-id={`delete-category-${category.id}`}>
                        <Trash2 className="w-4 h-4 sm:mr-0 mr-2" data-spec-id="trash-icon"/>
                        <span className="sm:hidden" data-spec-id="ooN1ho7Na6gITsC1">Excluir</span>
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
              
              {category.description && (<p className="text-sm text-gray-600 mt-2" data-spec-id="category-description">
                  {category.description}
                </p>)}
            </div>))}
        </div>

        {categories.length === 0 && (<div className="text-center py-8" data-spec-id="empty-categories-state">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" data-spec-id="empty-categories-icon"/>
            <p className="text-gray-600" data-spec-id="empty-categories-message">
              Nenhuma categoria profissional encontrada
            </p>
          </div>)}
      </CardContent>
    </Card>);
};
export default ProfessionalCategoryManager;
