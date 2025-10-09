import { Task, TaskCategory, ProfessionalCategory, ChecklistTemplate, User } from '@/types';

/**
 * Carrega todas as tarefas mestras do localStorage
 */
export const loadMasterTasks = (): Task[] => {
  const savedTasks = localStorage.getItem('masterTasks');
  return savedTasks ? JSON.parse(savedTasks) : [];
};

/**
 * Carrega todas as categorias de tarefas do localStorage
 */
export const loadTaskCategories = (): TaskCategory[] => {
  const savedCategories = localStorage.getItem('taskCategories');
  return savedCategories ? JSON.parse(savedCategories) : [];
};

/**
 * Carrega todas as categorias profissionais do localStorage
 */
export const loadProfessionalCategories = (): ProfessionalCategory[] => {
  const savedCategories = localStorage.getItem('professionalCategories');
  return savedCategories ? JSON.parse(savedCategories) : [];
};

/**
 * Converte tarefas mestras em template para uma categoria profissional específica
 */
export const generateTemplateForProfession = (
  professionRoleKey: string, 
  professionName: string
): ChecklistTemplate | null => {
  const masterTasks = loadMasterTasks();
  const taskCategories = loadTaskCategories();
  const professionalCategories = loadProfessionalCategories();

  // Encontrar a categoria profissional
  const profession = professionalCategories.find(p => p.roleKey === professionRoleKey);
  if (!profession) {
    console.log(`Professional category not found for role: ${professionRoleKey}`);
    return null;
  }

  // Filtrar tarefas que podem ser executadas por esta categoria profissional
  const applicableTasks = masterTasks.filter(task => 
    task.assignedProfessions.includes(profession.id)
  );

  if (applicableTasks.length === 0) {
    console.log(`No tasks found for profession: ${professionName}`);
    return null;
  }

  // Converter tarefas mestras para formato de template (mantendo compatibilidade)
  const templateTasks: Task[] = applicableTasks.map(masterTask => {
    const taskCategory = taskCategories.find(cat => cat.id === masterTask.categoryId);
    
    return {
      ...masterTask,
      category: taskCategory?.name || 'Categoria não encontrada' // Manter compatibilidade com o campo category
    };
  });

  const template: ChecklistTemplate = {
    id: `template-${professionRoleKey}`,
    name: `Checklist Diário de ${professionName}`,
    role: professionRoleKey as User['role'],
    tasks: templateTasks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return template;
};

/**
 * Gera templates para todas as categorias profissionais baseado nas tarefas mestras
 */
export const generateAllTemplates = (): ChecklistTemplate[] => {
  const professionalCategories = loadProfessionalCategories();
  const templates: ChecklistTemplate[] = [];

  for (const profession of professionalCategories) {
    const template = generateTemplateForProfession(profession.roleKey, profession.name);
    if (template) {
      templates.push(template);
    }
  }

  return templates;
};

/**
 * Atualiza os templates com base nas tarefas mestras e salva no localStorage
 */
export const updateTemplatesFromMasterTasks = (): void => {
  const newTemplates = generateAllTemplates();
  
  // Salvar templates atualizados
  localStorage.setItem('checklistTemplates', JSON.stringify(newTemplates));
  
  console.log('Templates updated from master tasks:', newTemplates);
};

/**
 * Obtém o nome da categoria da tarefa por ID
 */
export const getTaskCategoryName = (categoryId: string): string => {
  const taskCategories = loadTaskCategories();
  const category = taskCategories.find(cat => cat.id === categoryId);
  return category?.name || 'Categoria não encontrada';
};

/**
 * Obtém a cor da categoria da tarefa por ID
 */
export const getTaskCategoryColor = (categoryId: string): string => {
  const taskCategories = loadTaskCategories();
  const category = taskCategories.find(cat => cat.id === categoryId);
  return category?.color || '#gray';
};

/**
 * Obtém o nome da categoria profissional por ID
 */
export const getProfessionalCategoryName = (professionId: string): string => {
  const professionalCategories = loadProfessionalCategories();
  const profession = professionalCategories.find(prof => prof.id === professionId);
  return profession?.name || 'Profissão não encontrada';
};

/**
 * Verifica se existem tarefas mestras cadastradas
 */
export const hasMasterTasks = (): boolean => {
  const masterTasks = loadMasterTasks();
  return masterTasks.length > 0;
};

/**
 * Inicializa o sistema com dados padrão se necessário
 */
export const initializeSystemData = (): void => {
  // Verificar se já existem categorias profissionais
  const professionalCategories = loadProfessionalCategories();
  if (professionalCategories.length === 0) {
    // Criar categorias profissionais padrão será feito pelos componentes
    console.log('Professional categories will be created by components');
  }

  // Verificar se já existem categorias de tarefas
  const taskCategories = loadTaskCategories();
  if (taskCategories.length === 0) {
    // Criar categorias de tarefas padrão será feito pelos componentes
    console.log('Task categories will be created by components');
  }

  // Atualizar templates baseado nas tarefas mestras (se existirem)
  if (hasMasterTasks()) {
    updateTemplatesFromMasterTasks();
  }
};