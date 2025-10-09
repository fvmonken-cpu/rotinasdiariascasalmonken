-- =========================================
-- CHECKLIST MANAGEMENT SYSTEM - DATABASE SETUP
-- =========================================
-- Execute this SQL in your Supabase SQL Editor
-- to create all necessary tables and policies

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON functions FROM public;

-- =========================================
-- 1. USERS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'director', 'secretary', 'nurse', 'sdr')) NOT NULL,
    password_hash VARCHAR(255), -- For future authentication implementation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 2. PROFESSIONAL CATEGORIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS professional_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role_key VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 3. TASK CATEGORIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 4. MASTER TASKS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS master_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,
    is_required BOOLEAN DEFAULT false,
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
    assigned_periods TEXT[] DEFAULT '{}', -- Array of periods (start_day, end_day, etc.)
    assigned_roles TEXT[] DEFAULT '{}', -- Array of role keys
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 5. CHECKLIST TEMPLATES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    task_ids UUID[] DEFAULT '{}', -- Array of master_task IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 6. DAILY CHECKLISTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS daily_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES checklist_templates(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    period VARCHAR(50) NOT NULL, -- start_day, end_day, start_shift, end_shift
    shift VARCHAR(20), -- morning, afternoon, night
    completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    is_finalized BOOLEAN DEFAULT false,
    final_report TEXT,
    reopen_reason TEXT,
    reopened_at TIMESTAMP WITH TIME ZONE,
    reopen_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint to prevent duplicate checklists
    UNIQUE(user_id, date, period, shift)
);

-- =========================================
-- 7. TASK PROGRESS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID REFERENCES daily_checklists(id) ON DELETE CASCADE,
    task_id UUID REFERENCES master_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 8. USER REPORTS TABLE (for admin reports)
-- =========================================
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE,
    total_checklists INTEGER DEFAULT 0,
    completed_checklists INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    report_data JSONB, -- Flexible field for additional report data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, report_date)
);

-- =========================================
-- 9. INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_daily_checklists_user_date ON daily_checklists(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checklists_date ON daily_checklists(date);
CREATE INDEX IF NOT EXISTS idx_task_progress_checklist ON task_progress(checklist_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_date ON task_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_master_tasks_category ON master_tasks(category_id);

-- =========================================
-- 10. TRIGGERS FOR UPDATED_AT
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_categories_updated_at BEFORE UPDATE ON professional_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON task_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_tasks_updated_at BEFORE UPDATE ON master_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_checklists_updated_at BEFORE UPDATE ON daily_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_progress_updated_at BEFORE UPDATE ON task_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_reports_updated_at BEFORE UPDATE ON user_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 11. ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and admins can read all
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- Professional categories - readable by all authenticated users, modifiable by admins
CREATE POLICY "All can view categories" ON professional_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON professional_categories FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- Task categories - similar to professional categories
CREATE POLICY "All can view task categories" ON task_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage task categories" ON task_categories FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- Master tasks - readable by all, modifiable by admins
CREATE POLICY "All can view master tasks" ON master_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage master tasks" ON master_tasks FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- Checklist templates - readable by all, modifiable by admins
CREATE POLICY "All can view templates" ON checklist_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage templates" ON checklist_templates FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- Daily checklists - users can manage their own, admins and directors can view all
CREATE POLICY "Users can manage own checklists" ON daily_checklists FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Admins and directors can view all checklists" ON daily_checklists FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()::text) IN ('admin', 'director'));

-- Task progress - similar to daily checklists
CREATE POLICY "Users can manage own progress" ON task_progress FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Admins and directors can view all progress" ON task_progress FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()::text) IN ('admin', 'director'));

-- User reports - viewable by admins and directors only
CREATE POLICY "Admins and directors can view reports" ON user_reports FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()::text) IN ('admin', 'director'));
CREATE POLICY "Admins can manage reports" ON user_reports FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- =========================================
-- 12. INITIAL DATA SEEDING
-- =========================================

-- Insert default professional categories
INSERT INTO professional_categories (name, role_key, description) VALUES
('Administrador', 'admin', 'Administrador do sistema com acesso completo'),
('Diretora', 'director', 'Diretora da clínica com acesso de supervisão'),
('Secretária', 'secretary', 'Secretária responsável por tarefas administrativas'),
('Enfermeira', 'nurse', 'Enfermeira responsável por cuidados médicos'),
('SDR', 'sdr', 'Representante de desenvolvimento de vendas')
ON CONFLICT (role_key) DO NOTHING;

-- Insert default task categories
INSERT INTO task_categories (name, description, color) VALUES
('Gestão', 'Tarefas relacionadas à gestão e administração', '#3B82F6'),
('Documentação', 'Tarefas de documentação e papelada', '#10B981'),
('Atendimento', 'Tarefas relacionadas ao atendimento ao cliente', '#F59E0B'),
('Manutenção', 'Tarefas de manutenção e limpeza', '#EF4444'),
('Comunicação', 'Tarefas de comunicação interna e externa', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Insert default users (for testing - in production, use proper authentication)
INSERT INTO users (name, email, role) VALUES
('Sarah Johnson', 'sarah@company.com', 'director'),
('Mike Chen', 'mike@company.com', 'secretary'),
('Anna Rodriguez', 'anna@company.com', 'nurse'),
('David Kim', 'david@company.com', 'sdr'),
('Admin User', 'admin@company.com', 'admin'),
('Lisa Wang', 'lisa@company.com', 'secretary'),
('John Smith', 'john@company.com', 'nurse')
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- SETUP COMPLETE
-- =========================================
-- Your database is now ready!
-- Next steps:
-- 1. Configure your environment variables in your app
-- 2. Test the connection
-- 3. Start using the new database integration