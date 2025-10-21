import { Task, TaskCategory, ProfessionalCategory, ChecklistTemplate, User } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * 🌩️ CLOUD-ONLY UTILITIES - 100% SUPABASE
 * Carrega todas as tarefas mestras do Supabase (APENAS)
 */
export const loadMasterTasksFromSupabase = async (): Promise<Task[]> => {
  try {
    const { data: tasks, error } = await supabase
      .from('master_tasks')
      .select(`
        *,
        task_categories (
          name,
          color
        )
      `);
    
    if (error) {
      console.error('❌ Error loading master tasks from Supabase:', error);
      return [];
    }
    
    if (!tasks) {
      return [];
    }
    
    // Converter formato do Supabase para o formato esperado
    const convertedTasks: Task[] = tasks.map(task => ({
      id: task.id,
      title: task.name,
      description: task.description || '',
      category: task.task_categories?.name || 'Sem categoria',
      categoryId: task.category_id,
      period: task.assigned_periods?.[0] || 'start_day',
      periods: task.assigned_periods || ['start_day'],
      frequency: task.frequency || 'daily',
      assignedProfessions: task.assigned_roles || [],
      isRequired: task.is_required || false,
      priority: 'medium' as const,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
    
    console.log('✅ Loaded', convertedTasks.length, 'master tasks from Supabase');
    return convertedTasks;
  } catch (error) {
    console.error('❌ Failed to load master tasks from Supabase:', error);
    return [];
  }
};

/**
 * 🌩️ CLOUD-ONLY - Carrega categorias de tarefas do Supabase (APENAS)
 */
export const loadTaskCategoriesFromSupabase = async (): Promise<TaskCategory[]> => {
  try {
    const { data: categories, error } = await supabase
      .from('task_categories')
      .select('*');
    
    if (error) {
      console.error('❌ Error loading task categories from Supabase:', error);
      return [];
    }
    
    if (!categories) {
      return [];
    }
    
    const convertedCategories: TaskCategory[] = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at
    }));
    
    console.log('✅ Loaded', convertedCategories.length, 'task categories from Supabase');
    return convertedCategories;
  } catch (error) {
    console.error('❌ Failed to load task categories from Supabase:', error);
    return [];
  }
};

/**
 * 🌩️ CLOUD-ONLY - Carrega categorias profissionais do Supabase (APENAS)
 */
export const loadProfessionalCategoriesFromSupabase = async (): Promise<ProfessionalCategory[]> => {
  try {
    const { data: categories, error } = await supabase
      .from('professional_categories')
      .select('*');
    
    if (error) {
      console.error('❌ Error loading professional categories from Supabase:', error);
      return [];
    }
    
    if (!categories) {
      return [];
    }
    
    const convertedCategories: ProfessionalCategory[] = categories.map(prof => ({
      id: prof.id,
      name: prof.name,
      description: prof.description,
      roleKey: prof.role_key,
      color: prof.color || '#3B82F6',
      createdAt: prof.created_at,
      updatedAt: prof.updated_at
    }));
    
    console.log('✅ Loaded', convertedCategories.length, 'professional categories from Supabase');
    return convertedCategories;
  } catch (error) {
    console.error('❌ Failed to load professional categories from Supabase:', error);
    return [];
  }
};

/**
 * 🌩️ CLOUD-ONLY - Gera template para profissão baseado em dados do Supabase (APENAS)
 */
export const generateTemplateForProfessionFromSupabase = async (
  professionRoleKey: string, 
  professionName: string
): Promise<ChecklistTemplate | null> => {
  try {
    console.log('🔄 Loading template data from Supabase for role:', professionRoleKey);
    
    // Carregar tarefas do Supabase que são atribuídas a este role
    const { data: tasks, error } = await supabase
      .from('master_tasks')
      .select(`
        *,
        task_categories (
          name,
          color
        )
      `)
      .contains('assigned_roles', [professionRoleKey]);
    
    if (error) {
      console.error('❌ Error loading tasks from Supabase:', error);
      return null;
    }
    
    if (!tasks || tasks.length === 0) {
      console.log(`❌ No tasks found in Supabase for role: ${professionRoleKey}`);
      return null;
    }
    
    // Converter tarefas do Supabase para formato esperado
    const templateTasks: Task[] = tasks.map(task => ({
      id: task.id,
      title: task.name,
      description: task.description || '',
      category: task.task_categories?.name || 'Sem categoria',
      categoryId: task.category_id,
      period: task.assigned_periods?.[0] || 'start_day',
      periods: task.assigned_periods || ['start_day'],
      frequency: task.frequency || 'daily',
      assignedProfessions: task.assigned_roles || [],
      isRequired: task.is_required || false,
      priority: 'medium' as const,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
    
    const template: ChecklistTemplate = {
      id: crypto.randomUUID(),
      name: `Checklist Diário de ${professionName}`,
      role: professionRoleKey as User['role'],
      tasks: templateTasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Generated template from Supabase with', templateTasks.length, 'tasks');
    return template;
    
  } catch (error) {
    console.error('❌ Failed to generate template from Supabase:', error);
    return null;
  }
};

/**
 * 🌩️ CLOUD-ONLY - Obtém o nome da categoria da tarefa por ID do Supabase
 */
export const getTaskCategoryNameFromSupabase = async (categoryId: string): Promise<string> => {
  try {
    const { data: category, error } = await supabase
      .from('task_categories')
      .select('name')
      .eq('id', categoryId)
      .single();
    
    if (error) {
      console.error('❌ Error loading task category from Supabase:', error);
      return 'Categoria não encontrada';
    }
    
    return category?.name || 'Categoria não encontrada';
  } catch (error) {
    console.error('❌ Failed to load task category from Supabase:', error);
    return 'Categoria não encontrada';
  }
};

/**
 * 🌩️ CLOUD-ONLY - Obtém a cor da categoria da tarefa por ID do Supabase
 */
export const getTaskCategoryColorFromSupabase = async (categoryId: string): Promise<string> => {
  try {
    const { data: category, error } = await supabase
      .from('task_categories')
      .select('color')
      .eq('id', categoryId)
      .single();
    
    if (error) {
      console.error('❌ Error loading task category color from Supabase:', error);
      return '#gray';
    }
    
    return category?.color || '#gray';
  } catch (error) {
    console.error('❌ Failed to load task category color from Supabase:', error);
    return '#gray';
  }
};

/**
 * 🌩️ CLOUD-ONLY - Verifica se existem tarefas mestras no Supabase
 */
export const hasMasterTasksInSupabase = async (): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('master_tasks')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking master tasks in Supabase:', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('❌ Failed to check master tasks in Supabase:', error);
    return false;
  }
};

/**
 * 🌩️ CLOUD-ONLY - Verifica se existem categorias de tarefas no Supabase
 */
export const hasTaskCategoriesInSupabase = async (): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('task_categories')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking task categories in Supabase:', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('❌ Failed to check task categories in Supabase:', error);
    return false;
  }
};

/**
 * 🌩️ CLOUD-ONLY - Verifica se existem categorias profissionais no Supabase
 */
export const hasProfessionalCategoriesInSupabase = async (): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('professional_categories')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking professional categories in Supabase:', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('❌ Failed to check professional categories in Supabase:', error);
    return false;
  }
};

// 🚨 FUNÇÕES DESCONTINUADAS - Não usam localStorage
export const updateTemplatesFromMasterTasks = (): void => {
  console.warn('🚨 updateTemplatesFromMasterTasks is deprecated in cloud-only mode');
  console.warn('🌩️ Use Supabase-based functions instead');
};

export const loadMasterTasks = (): Task[] => {
  console.warn('🚨 loadMasterTasks (localStorage) is deprecated in cloud-only mode');
  console.warn('🌩️ Use loadMasterTasksFromSupabase() instead');
  return [];
};

export const loadTaskCategories = (): TaskCategory[] => {
  console.warn('🚨 loadTaskCategories (localStorage) is deprecated in cloud-only mode');
  console.warn('🌩️ Use loadTaskCategoriesFromSupabase() instead');
  return [];
};

export const loadProfessionalCategories = (): ProfessionalCategory[] => {
  console.warn('🚨 loadProfessionalCategories (localStorage) is deprecated in cloud-only mode');
  console.warn('🌩️ Use loadProfessionalCategoriesFromSupabase() instead');
  return [];
};