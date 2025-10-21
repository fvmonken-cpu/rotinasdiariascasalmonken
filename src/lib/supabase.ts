import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual environment variables once Supabase is connected
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wzlfjrzxzsbsideglexo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bGZqcnp4enNic2lkZWdsZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDE4MTAsImV4cCI6MjA3MzgxNzgxMH0.lmLgmKjCuPkW2EBSQYzx2PkM5Qj42dDXi6ELfahL-Yk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table definitions
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'director' | 'secretary' | 'nurse' | 'sdr';
  created_at: string;
  updated_at: string;
}

export interface ProfessionalCategory {
  id: string;
  name: string;
  role_key: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface MasterTask {
  id: string;
  name: string;
  description: string;
  category_id: string;
  is_required: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  assigned_periods: string[];
  assigned_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  role: string;
  name: string;
  tasks: string[];
  created_at: string;
  updated_at: string;
}

export interface DailyChecklistDB {
  id: string;
  user_id: string;
  template_id: string;
  date: string;
  period: string;
  shift?: string;
  completion_rate: number;
  started_at: string;
  completed_at?: string;
  finalized_at?: string;
  is_finalized: boolean;
  final_report?: string;
  reopen_reason?: string;
  reopened_at?: string;
  reopen_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskProgressDB {
  id: string;
  checklist_id: string;
  task_id: string;
  user_id: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

// Database initialization functions
export const initializeDatabase = async () => {
  console.log('🚀 Initializing Supabase database...');
  
  try {
    // First, check if we have the required tables
    console.log('📋 Checking if database tables exist...');
    
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('📋 Database tables not found. Error:', error.message);
      if (error.code === 'PGRST116' || error.message.includes('relation "public.users" does not exist')) {
        console.log('❌ Database tables missing! Please run the SQL script from database-setup.sql in your Supabase dashboard.');
        throw new Error('Database tables not found. Please run the setup SQL script in your Supabase SQL Editor.');
      } else {
        console.error('❌ Database connection error:', error);
        throw error;
      }
    } else {
      console.log('✅ Database tables found!');
      await seedInitialData();
      console.log('✅ Database initialized successfully!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

const createTables = async () => {
  // This would typically be done through Supabase migration files
  // For now, we'll document the required SQL structure
  console.log('📋 Database tables should be created through Supabase dashboard');
};

const seedInitialData = async () => {
  console.log('🌱 Seeding initial data...');
  
  // MIGRAÇÃO DESABILITADA - Causava perda de dados do usuário
  console.log('🚫 Data migration disabled to prevent data loss');
};

// FUNÇÃO DE MIGRAÇÃO DESABILITADA PERMANENTEMENTE 
// Esta função estava causando perda de dados do usuário
export const migrateLocalStorageData = async () => {
  console.log('🚫 MIGRATION DISABLED - This function was causing user data loss');
  console.log('🛡️ Your localStorage data is preserved and safe');
  return; // Sai imediatamente sem fazer nada
};

const migrateChecklist = async (localChecklist: any) => {
  try {
    // Validate and fix template_id - must be a valid UUID or null
    let templateId = localChecklist.templateId;
    
    // Check if template_id is a valid UUID format (8-4-4-4-12 characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!templateId || !uuidRegex.test(templateId)) {
      console.warn(`⚠️ Invalid template_id "${templateId}" found, setting to null`);
      templateId = null;
    }
    
    // Insert checklist
    const checklistData = {
      id: localChecklist.id,
      user_id: localChecklist.userId,
      template_id: templateId, // Now validated as UUID or null
      date: localChecklist.date,
      period: localChecklist.period,
      shift: localChecklist.shift,
      completion_rate: localChecklist.completionRate,
      started_at: localChecklist.startedAt,
      completed_at: localChecklist.completedAt,
      finalized_at: localChecklist.finalizedAt,
      is_finalized: localChecklist.isFinalized,
      final_report: localChecklist.finalReport,
      reopen_reason: localChecklist.reopenReason,
      reopened_at: localChecklist.reopenedAt,
      reopen_count: localChecklist.reopenCount || 0
    };

    const { error: checklistError } = await supabase
      .from('daily_checklists')
      .insert(checklistData);
    
    if (checklistError) throw checklistError;

    // Insert task progress
    if (localChecklist.progress && localChecklist.progress.length > 0) {
      const progressData = localChecklist.progress.map((progress: any) => ({
        id: progress.id,
        checklist_id: localChecklist.id,
        task_id: progress.taskId,
        user_id: progress.userId,
        completed: progress.completed,
        completed_at: progress.completedAt,
        notes: progress.notes,
        date: progress.date
      }));

      const { error: progressError } = await supabase
        .from('task_progress')
        .insert(progressData);
      
      if (progressError) throw progressError;
    }

    console.log(`✅ Migrated checklist: ${localChecklist.id}`);
  } catch (error) {
    console.error(`❌ Failed to migrate checklist ${localChecklist.id}:`, error);
  }
};

// Utility functions for database operations
export const getUser = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) throw error;
  return data;
};

export const authenticateUser = async (email: string, password: string) => {
  console.log('🔐 Attempting to authenticate user:', email);
  console.log('🔐 Password provided:', password);
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.log('❌ User not found:', error);
      console.log('❌ Error details:', JSON.stringify(error));
      console.log('❌ Searched email:', email);
      
      // Lista todos os usuários para debug
      const { data: allUsers } = await supabase.from('users').select('email, name, password_hash');
      console.log('📋 Available users:', allUsers);
      
      throw new Error('Usuário não encontrado. Verifique se o email está correto.');
    }
    
    console.log('✅ User found:', user.name, 'ID:', user.id);
    console.log('🔑 Password verification - Expected:', user.password_hash, 'Provided:', password);
    
    // Debug: Modo de teste removido - usando autenticação normal
    
    // Validar senha
    if (!user.password_hash || user.password_hash === null || user.password_hash === '') {
      console.log('❌ User has no password set, using default temp123');
      
      // Para usuários sem senha definida, usar 'temp123' como padrão
      if (password !== 'temp123') {
        console.log('❌ Password mismatch for user without password_hash. Expected: temp123, Got:', password);
        throw new Error('Senha padrão é "temp123". Use esta senha para fazer login.');
      }
    } else {
      // Limpar espaços em branco que podem estar causando problema
      const cleanExpected = user.password_hash.trim();
      const cleanProvided = password.trim();
      
      if (cleanExpected !== cleanProvided) {
        console.log('❌ Password mismatch. Expected:', cleanExpected, 'Got:', cleanProvided);
        throw new Error('Senha incorreta. Tente novamente.');
      }
    }
    
    console.log('✅ Password verified for user:', user.name);
    return user;
    
  } catch (error: any) {
    console.error('🚨 Authentication error caught:', error);
    
    // Se for erro específico de Supabase, tentar modo de emergência
    if (error.message?.includes('PGRST') || error.code) {
      console.log('🆘 Supabase error detected, attempting emergency mode');
      
      // Usuários de emergência para desenvolvimento
      const emergencyUsers = [
        { id: 'emergency-1', name: 'Admin de Emergência', email: 'admin@emergency.com', role: 'admin' },
        { id: 'emergency-2', name: 'Usuário de Teste', email: 'teste@casalmonken.com.br', role: 'secretary' },
        { id: 'emergency-3', name: 'Frederico Admin', email: 'frederico@casalmonken.com.br', role: 'admin' }
      ];
      
      const emergencyUser = emergencyUsers.find(u => u.email === email);
      if (emergencyUser) {
        console.log('🆘 Emergency user login successful:', emergencyUser.name);
        return {
          ...emergencyUser,
          password_hash: password, // Aceita qualquer senha em modo emergência
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }
    
    throw error;
  }
};

export const getUserChecklists = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('daily_checklists')
    .select(`
      *,
      task_progress (*)
    `)
    .eq('user_id', userId)
    .eq('date', date);
  
  if (error) throw error;
  return data;
};

export const createChecklist = async (checklistData: Partial<DailyChecklistDB>) => {
  const { data, error } = await supabase
    .from('daily_checklists')
    .insert(checklistData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTaskProgress = async (progressId: string, updates: Partial<TaskProgressDB>) => {
  const { data, error } = await supabase
    .from('task_progress')
    .update(updates)
    .eq('id', progressId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};