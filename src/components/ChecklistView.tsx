import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Clock, CheckCircle2, Target, RefreshCw, TrendingUp, FileCheck, X, AlertTriangle, CheckSquare } from 'lucide-react';
import TaskItem from './TaskItem';
import ChecklistPeriodSelector from './ChecklistPeriodSelector';
import ChecklistFinalizationDialog from './ChecklistFinalizationDialog';
import ReopenChecklistDialog from './ReopenChecklistDialog';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { mockTemplates } from '@/data/mockData';
import { generateTemplateForProfessionFromSupabase } from '@/utils/cloudMasterTaskUtils';
import { generateTemplateForProfession, loadProfessionalCategories } from '@/utils/masterTaskUtils';
import { DailyChecklist, TaskProgress, ChecklistTemplate, ChecklistPeriod } from '@/types';
import { filterTasksByPeriodAndFrequency, getTaskRescheduleInfo } from '@/utils/taskFrequencyUtils';
import { checkAndCleanupChecklists } from '@/utils/checklistCleanup';
import { toast } from 'sonner';
const ChecklistView = ()=>{
    const { user, isSupabaseConnected } = useSupabaseAuth();
    const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
    const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPeriodSelector, setShowPeriodSelector] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<ChecklistPeriod | null>(null);
    const [showFinalizationDialog, setShowFinalizationDialog] = useState(false);
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [pendingPeriod, setPendingPeriod] = useState<ChecklistPeriod | null>(null);
    const getLocalDateString = ()=>{
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const today = getLocalDateString();
    const generateUUID = ()=>{
        return crypto.randomUUID();
    };
    useEffect(()=>{
        checkAndCleanupChecklists();
        if (user && user.role !== 'admin') {
            setShowPeriodSelector(true);
        } else {
            loadTodayChecklist();
        }
    }, [
        user
    ]);
    const saveChecklistToSupabase = async (checklist: DailyChecklist)=>{
        if (!isSupabaseConnected) return;
        try {
            console.log('💾 Saving checklist to Supabase:', checklist.id);
            const { data: existingChecklist, error: checkError } = await supabase.from('daily_checklists').select('id').eq('id', checklist.id).single();
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('❌ Error checking existing checklist:', checkError);
                return;
            }
            const { data: duplicateCheck, error: duplicateError } = await supabase.from('daily_checklists').select('id').eq('user_id', checklist.userId).eq('date', checklist.date).eq('period', checklist.period).eq('shift', checklist.shift || '').single();
            if (duplicateError && duplicateError.code !== 'PGRST116') {
                console.error('❌ Error checking duplicate checklist:', duplicateError);
                return;
            }
            const isValidUUID = (str: string)=>{
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(str);
            };
            const checklistData = {
                id: checklist.id,
                user_id: checklist.userId,
                date: checklist.date,
                period: checklist.period,
                shift: checklist.shift,
                completion_rate: checklist.completionRate,
                started_at: checklist.startedAt,
                completed_at: checklist.completedAt,
                is_finalized: checklist.isFinalized,
                final_report: checklist.finalReport,
                finalized_at: checklist.finalizedAt,
                reopen_reason: checklist.reopenReason,
                reopen_count: checklist.reopenCount || 0,
                reopened_at: checklist.reopenedAt
            };
            let checklistSaved = false;
            if (existingChecklist) {
                const { error: updateError } = await supabase.from('daily_checklists').update(checklistData).eq('id', checklist.id);
                if (updateError) {
                    console.error('❌ Error updating checklist:', updateError);
                    return;
                } else {
                    console.log('✅ Checklist updated in Supabase');
                    checklistSaved = true;
                }
            } else if (duplicateCheck) {
                const { error: updateError } = await supabase.from('daily_checklists').update(checklistData).eq('user_id', checklist.userId).eq('date', checklist.date).eq('period', checklist.period).eq('shift', checklist.shift || '');
                if (updateError) {
                    console.error('❌ Error updating duplicate checklist:', updateError);
                    return;
                } else {
                    console.log('✅ Duplicate checklist updated in Supabase');
                    checklistSaved = true;
                }
            } else {
                const { error: insertError } = await supabase.from('daily_checklists').insert([
                    checklistData
                ]);
                if (insertError) {
                    if (insertError.code === '23505') {
                        console.warn('⚠️ Checklist already exists (constraint violation), will try to update instead');
                        const { error: updateError } = await supabase.from('daily_checklists').update(checklistData).eq('user_id', checklist.userId).eq('date', checklist.date).eq('period', checklist.period).eq('shift', checklist.shift || '');
                        if (updateError) {
                            console.error('❌ Error updating existing checklist:', updateError);
                            return;
                        } else {
                            console.log('✅ Existing checklist updated in Supabase');
                            checklistSaved = true;
                        }
                    } else {
                        console.error('❌ Error inserting checklist:', insertError);
                        return;
                    }
                } else {
                    console.log('✅ Checklist created in Supabase');
                    checklistSaved = true;
                }
            }
            if (checklistSaved) {
                await saveTaskProgressToSupabase(checklist);
            }
        } catch (error) {
            console.error('❌ Error saving checklist to Supabase:', error);
        }
    };
    const saveTaskProgressToSupabase = async (checklist: DailyChecklist)=>{
        if (!isSupabaseConnected) return;
        try {
            console.log('💾 Saving task progress to Supabase:', checklist.progress.length, 'tasks');
            const { data: checklistExists, error: checkError } = await supabase.from('daily_checklists').select('id').eq('id', checklist.id).single();
            if (checkError || !checklistExists) {
                console.error('❌ Checklist does not exist in database, cannot save task progress:', checkError);
                return;
            }
            const { error: deleteError } = await supabase.from('task_progress').delete().eq('checklist_id', checklist.id);
            if (deleteError) {
                console.error('❌ Error deleting old task progress:', deleteError);
                return;
            }
            const isValidUUID = (str: string)=>{
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(str);
            };
            const taskProgressData = checklist.progress.map((progress)=>({
                    id: progress.id,
                    checklist_id: checklist.id,
                    task_id: isValidUUID(progress.taskId) ? progress.taskId : null,
                    user_id: checklist.userId,
                    date: checklist.date,
                    completed: progress.completed,
                    completed_at: progress.completedAt,
                    notes: progress.notes
                }));
            if (taskProgressData.length > 0) {
                const { error: insertError } = await supabase.from('task_progress').insert(taskProgressData);
                if (insertError) {
                    console.error('❌ Error inserting task progress:', insertError);
                    if (insertError.code === '23503') {
                        console.error('❌ Foreign key constraint violation - checklist may not exist properly');
                        console.log('🔄 Attempting to re-save checklist before task progress...');
                        await saveChecklistToSupabase(checklist);
                        const { error: retryError } = await supabase.from('task_progress').insert(taskProgressData);
                        if (retryError) {
                            console.error('❌ Error inserting task progress after retry:', retryError);
                        } else {
                            console.log('✅ Task progress saved to Supabase after retry');
                        }
                    }
                } else {
                    console.log('✅ Task progress saved to Supabase');
                }
            }
        } catch (error) {
            console.error('❌ Error saving task progress to Supabase:', error);
        }
    };
    const loadTodayChecklist = async (period?: ChecklistPeriod)=>{
        if (!user) return;
        console.log('🚀 [SUPABASE-ONLY] Loading checklist for user:', user.name, 'Role:', user.role, 'Period:', period);
        if (!isSupabaseConnected) {
            console.error('❌ Supabase not connected. System requires Supabase for cloud operation.');
            toast.error('Sistema requer conexão com Supabase para funcionar na nuvem.');
            setIsLoading(false);
            return;
        }
        let userTemplate = null;
        console.log('🔄 Loading template from Supabase master tasks for role:', user.role);
        try {
            userTemplate = await generateTemplateForProfessionFromSupabase(user.role, user.role);
            if (userTemplate && userTemplate.tasks.length > 0) {
                console.log('✅ Generated template from Supabase with', userTemplate.tasks.length, 'tasks');
            } else {
                console.log('⚠️ No tasks found in Supabase for role:', user.role);
                userTemplate = null;
            }
        } catch (error) {
            console.error('❌ Failed to generate template from Supabase:', error);
            userTemplate = null;
        }
        if (!userTemplate) {
            console.log('❌ No template found for role:', user.role);
            console.log('💡 Please create tasks and assign them to the role in the admin panel');
            toast.error(`Nenhuma tarefa encontrada para o perfil ${user.role}. Configure as tarefas no painel administrativo.`);
            setIsLoading(false);
            return;
        }
        console.log('✅ Found template with', userTemplate.tasks.length, 'total tasks');
        setTemplate(userTemplate);
        console.log('🔄 Loading existing checklist from Supabase...');
        let todayChecklist = null;
        try {
            const { data: existingChecklists, error } = await supabase.from('daily_checklists').select(`
                    *,
                    task_progress (*)
                `).eq('user_id', user.id).eq('date', today).eq('period', period?.period || 'start_day').eq('shift', period?.shift || null);
            if (error) {
                console.error('❌ Error loading checklist from Supabase:', error);
            } else if (existingChecklists && existingChecklists.length > 0) {
                const supabaseChecklist = existingChecklists[0];
                const progress = supabaseChecklist.task_progress?.map((tp: any)=>({
                        id: tp.id,
                        taskId: tp.task_id,
                        userId: tp.user_id,
                        completed: tp.completed,
                        completedAt: tp.completed_at,
                        notes: tp.notes,
                        date: tp.date
                    })) || [];
                todayChecklist = {
                    id: supabaseChecklist.id,
                    userId: supabaseChecklist.user_id,
                    templateId: userTemplate.id,
                    date: supabaseChecklist.date,
                    period: supabaseChecklist.period,
                    shift: supabaseChecklist.shift,
                    progress: progress,
                    completionRate: supabaseChecklist.completion_rate,
                    startedAt: supabaseChecklist.started_at,
                    completedAt: supabaseChecklist.completed_at,
                    finalizedAt: supabaseChecklist.finalized_at,
                    isFinalized: supabaseChecklist.is_finalized,
                    finalReport: supabaseChecklist.final_report,
                    reopenReason: supabaseChecklist.reopen_reason,
                    reopenedAt: supabaseChecklist.reopened_at,
                    reopenCount: supabaseChecklist.reopen_count
                };
                console.log('✅ Loaded existing checklist from Supabase:', todayChecklist.id);
            }
        } catch (error) {
            console.error('❌ Failed to load checklist from Supabase:', error);
        }
        if (!todayChecklist && period) {
            console.log('🆕 Creating new checklist for period:', period.name);
            const todayDate = new Date(today);
            const { data: existingChecklists } = await supabase.from('daily_checklists').select('*').eq('user_id', user.id);
            const savedChecklists = existingChecklists || [];
            const filteredTasks = filterTasksByPeriodAndFrequency(userTemplate.tasks, period, todayDate, user.id, savedChecklists);
            console.log('Filtered tasks for period', period.name, ':', filteredTasks.length, 'tasks');
            const checklistId = generateUUID();
            const { error: checklistError } = await supabase.from('daily_checklists').insert({
                id: checklistId,
                user_id: user.id,
                date: today,
                period: period.period,
                shift: period.shift,
                completion_rate: 0,
                started_at: new Date().toISOString(),
                is_finalized: false
            });
            if (checklistError) {
                console.error('❌ Error creating checklist in Supabase:', checklistError);
                toast.error('Erro ao criar checklist no banco de dados');
                setIsLoading(false);
                return;
            }
            const initialProgress: TaskProgress[] = [];
            for (const task of filteredTasks){
                const progressId = generateUUID();
                const taskProgress = {
                    id: progressId,
                    taskId: task.id,
                    userId: user.id,
                    completed: false,
                    date: today
                };
                const { error: progressError } = await supabase.from('task_progress').insert({
                    id: progressId,
                    checklist_id: checklistId,
                    task_id: task.id,
                    user_id: user.id,
                    completed: false,
                    date: today
                });
                if (!progressError) {
                    initialProgress.push(taskProgress);
                }
            }
            todayChecklist = {
                id: checklistId,
                userId: user.id,
                templateId: userTemplate.id,
                date: today,
                period: period.period,
                shift: period.shift,
                progress: initialProgress,
                completionRate: 0,
                startedAt: new Date().toISOString(),
                isFinalized: false
            };
            console.log('✅ Created new checklist in Supabase:', checklistId);
        } else if (!todayChecklist) {
            console.log('🆕 Creating default checklist for start_day');
            const checklistId = generateUUID();
            const { error: checklistError } = await supabase.from('daily_checklists').insert({
                id: checklistId,
                user_id: user.id,
                date: today,
                period: 'start_day',
                completion_rate: 0,
                started_at: new Date().toISOString(),
                is_finalized: false
            });
            if (checklistError) {
                console.error('❌ Error creating default checklist:', checklistError);
                toast.error('Erro ao criar checklist padrão');
                setIsLoading(false);
                return;
            }
            const initialProgress: TaskProgress[] = [];
            for (const task of userTemplate.tasks){
                const progressId = generateUUID();
                const taskProgress = {
                    id: progressId,
                    taskId: task.id,
                    userId: user.id,
                    completed: false,
                    date: today
                };
                const { error: progressError } = await supabase.from('task_progress').insert({
                    id: progressId,
                    checklist_id: checklistId,
                    task_id: task.id,
                    user_id: user.id,
                    completed: false,
                    date: today
                });
                if (!progressError) {
                    initialProgress.push(taskProgress);
                }
            }
            todayChecklist = {
                id: checklistId,
                userId: user.id,
                templateId: userTemplate.id,
                date: today,
                period: 'start_day',
                progress: initialProgress,
                completionRate: 0,
                startedAt: new Date().toISOString(),
                isFinalized: false
            };
            console.log('✅ Created default checklist in Supabase');
        }
        setChecklist(todayChecklist);
        setIsLoading(false);
    };
    const updateTaskProgress = async (taskId: string, completed: boolean, notes?: string)=>{
        if (!checklist || !template || !isSupabaseConnected) return;
        console.log('🔄 [SUPABASE-ONLY] Updating task:', taskId, 'Completed:', completed, 'Notes:', notes);
        const taskProgress = checklist.progress.find((p)=>p.taskId === taskId);
        if (!taskProgress) {
            console.error('❌ Task progress not found for taskId:', taskId);
            return;
        }
        const { error: progressError } = await supabase.from('task_progress').update({
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            notes: notes || null
        }).eq('id', taskProgress.id);
        if (progressError) {
            console.error('❌ Error updating task progress in Supabase:', progressError);
            toast.error('Erro ao atualizar progresso da tarefa');
            return;
        }
        const updatedProgress = checklist.progress.map((p)=>{
            if (p.taskId === taskId) {
                return {
                    ...p,
                    completed,
                    completedAt: completed ? new Date().toISOString() : undefined,
                    notes: notes || p.notes
                };
            }
            return p;
        });
        const completedTasks = updatedProgress.filter((p)=>p.completed).length;
        const totalTasks = updatedProgress.length;
        const completionRate = Math.round((completedTasks / totalTasks) * 100);
        const isCompleted = completionRate === 100;
        const { error: checklistError } = await supabase.from('daily_checklists').update({
            completion_rate: completionRate,
            completed_at: isCompleted ? new Date().toISOString() : null
        }).eq('id', checklist.id);
        if (checklistError) {
            console.error('❌ Error updating checklist in Supabase:', checklistError);
            toast.error('Erro ao atualizar checklist');
            return;
        }
        const updatedChecklist = {
            ...checklist,
            progress: updatedProgress,
            completionRate,
            completedAt: isCompleted ? new Date().toISOString() : undefined
        };
        setChecklist(updatedChecklist);
        if (completed) {
            const task = template.tasks.find((t)=>t.id === taskId);
            toast.success(`✅ ${task?.title} completed!`);
        }
        if (completionRate === 100 && checklist.completionRate !== 100) {
            toast.success('🎉 All tasks completed! Great work!');
        }
        console.log('✅ Checklist updated in Supabase. Completion rate:', completionRate + '%');
    };
    const resetChecklist = async ()=>{
        if (!user || !template || !selectedPeriod || !isSupabaseConnected) return;
        console.log('🔄 [SUPABASE-ONLY] Resetting checklist in Supabase');
        try {
            const { error: deleteProgressError } = await supabase.from('task_progress').delete().eq('checklist_id', checklist.id);
            if (deleteProgressError) {
                console.error('❌ Error deleting task progress:', deleteProgressError);
                toast.error('Erro ao reiniciar checklist');
                return;
            }
            const { data: existingChecklists } = await supabase.from('daily_checklists').select('*').eq('user_id', user.id);
            const todayDate = new Date(today);
            const savedChecklists = existingChecklists || [];
            const filteredTasks = filterTasksByPeriodAndFrequency(template.tasks, selectedPeriod, todayDate, user.id, savedChecklists);
            const resetProgress: TaskProgress[] = [];
            for (const task of filteredTasks){
                const progressId = generateUUID();
                const taskProgress = {
                    id: progressId,
                    taskId: task.id,
                    userId: user.id,
                    completed: false,
                    date: today
                };
                const { error: progressError } = await supabase.from('task_progress').insert({
                    id: progressId,
                    checklist_id: checklist.id,
                    task_id: task.id,
                    user_id: user.id,
                    completed: false,
                    date: today
                });
                if (!progressError) {
                    resetProgress.push(taskProgress);
                }
            }
            const { error: updateChecklistError } = await supabase.from('daily_checklists').update({
                completion_rate: 0,
                started_at: new Date().toISOString(),
                is_finalized: false,
                completed_at: null,
                finalized_at: null
            }).eq('id', checklist.id);
            if (updateChecklistError) {
                console.error('❌ Error updating checklist:', updateChecklistError);
                toast.error('Erro ao atualizar checklist');
                return;
            }
            const resetChecklist = {
                ...checklist,
                progress: resetProgress,
                completionRate: 0,
                startedAt: new Date().toISOString(),
                isFinalized: false,
                completedAt: undefined,
                finalizedAt: undefined
            };
            setChecklist(resetChecklist);
            toast.success('Checklist reiniciado com sucesso');
            console.log('✅ Checklist reset successfully in Supabase');
        } catch (error) {
            console.error('❌ Failed to reset checklist:', error);
            toast.error('Erro ao reiniciar checklist');
        }
    };
    const handlePeriodSelected = async (period: ChecklistPeriod)=>{
        if (!user || !isSupabaseConnected) return;
        console.log('🔄 [SUPABASE-ONLY] Checking for existing finalized checklist...');
        const { data: existingChecklists, error } = await supabase.from('daily_checklists').select('*').eq('user_id', user.id).eq('date', today).eq('period', period.period).eq('shift', period.shift || null).eq('is_finalized', true);
        if (error) {
            console.error('❌ Error checking existing checklists:', error);
            toast.error('Erro ao verificar checklists existentes');
            return;
        }
        if (existingChecklists && existingChecklists.length > 0) {
            console.log('⚠️ Found finalized checklist, showing reopen dialog');
            setPendingPeriod(period);
            setShowReopenDialog(true);
            setShowPeriodSelector(false);
        } else {
            console.log('✅ No finalized checklist found, proceeding with period selection');
            setSelectedPeriod(period);
            setShowPeriodSelector(false);
            loadTodayChecklist(period);
        }
    };
    const handleCancelChecklist = ()=>{
        console.log('Cancel checklist button clicked');
        setShowCancelDialog(true);
    };
    const handleConfirmCancelChecklist = async ()=>{
        console.log('🗑️ [SUPABASE-ONLY] Confirmed checklist cancellation');
        if (!checklist || !isSupabaseConnected) return;
        try {
            console.log('🗑️ Deleting task progress from Supabase:', checklist.id);
            const { error: progressError } = await supabase.from('task_progress').delete().eq('checklist_id', checklist.id);
            if (progressError) {
                console.error('❌ Error deleting task progress:', progressError);
                toast.error('Erro ao deletar progresso das tarefas');
                return;
            } else {
                console.log('✅ Task progress deleted from Supabase');
            }
            console.log('🗑️ Deleting checklist from Supabase:', checklist.id);
            const { error: checklistError } = await supabase.from('daily_checklists').delete().eq('id', checklist.id);
            if (checklistError) {
                console.error('❌ Error deleting checklist from Supabase:', checklistError);
                toast.error('Erro ao cancelar checklist no banco de dados');
                return;
            } else {
                console.log('✅ Checklist deleted from Supabase');
                toast.success('Checklist cancelado e removido completamente.');
            }
        } catch (error) {
            console.error('❌ Failed to delete checklist from Supabase:', error);
            toast.error('Erro ao cancelar checklist no banco de dados');
            return;
        }
        setShowCancelDialog(false);
        setShowPeriodSelector(true);
        setChecklist(null);
        setTemplate(null);
        setSelectedPeriod(null);
    };
    const handleStayInChecklist = ()=>{
        console.log('User chose to stay in checklist');
        setShowCancelDialog(false);
    };
    const handleFinalizeChecklist = async (finalReport: string)=>{
        if (!checklist || !user) return;
        const finalizedChecklist = {
            ...checklist,
            isFinalized: true,
            finalizedAt: new Date().toISOString(),
            finalReport,
            completedAt: new Date().toISOString()
        };
        await saveChecklistToSupabase(finalizedChecklist);
        setChecklist(finalizedChecklist);
        console.log('Checklist finalized with report:', finalReport);
        toast.success('Checklist finalizado! Retornando para a tela inicial em 5 segundos...', {
            duration: 5000
        });
        setTimeout(()=>{
            console.log('Auto-returning to home after checklist finalization');
            setShowPeriodSelector(true);
            setChecklist(null);
            setTemplate(null);
            setSelectedPeriod(null);
        }, 5000);
    };
    const handleReopenChecklist = (reason: string)=>{
        if (!pendingPeriod || !user) return;
        setSelectedPeriod(pendingPeriod);
        setPendingPeriod(null);
        const newChecklistId = generateUUID();
        loadTodayChecklistWithReopenInfo(pendingPeriod, reason, newChecklistId);
    };
    const loadTodayChecklistWithReopenInfo = (period: ChecklistPeriod, reopenReason: string, newId: string)=>{
        console.log('🔄 [SUPABASE-ONLY] Loading reopened checklist:', reopenReason);
        loadTodayChecklist(period);
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
    if (showPeriodSelector && user && user.role !== 'admin') {
        return (<ChecklistPeriodSelector user={user} onPeriodSelected={handlePeriodSelected} data-spec-id="period-selector-view"/>);
    }
    if (isLoading) {
        return (<div className="flex items-center justify-center h-64" data-spec-id="LljcLYB4tRB6geXE">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" data-spec-id="NRROfpYyn0v8TlwR"/>
      </div>);
    }
    if (!template || !checklist) {
        return (<div className="text-center py-12" data-spec-id="ddVqw81KT1YDnf0J">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" data-spec-id="0fJQVFyjTELpFWuO"/>
        <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="1cjAJiTuAsQaGHbY">No checklist available</h3>
        <p className="text-gray-600" data-spec-id="cvGSAjf6XP8XPCUq">No checklist template found for your role.</p>
      </div>);
    }
    const completedTasks = checklist.progress.filter((p)=>p.completed).length;
    const totalTasks = checklist.progress.length;
    const requiredTasks = checklist.progress.filter((p)=>{
        const task = template.tasks.find((t)=>t.id === p.taskId);
        return task?.isRequired;
    }).length;
    const completedRequiredTasks = checklist.progress.filter((p)=>{
        const task = template.tasks.find((t)=>t.id === p.taskId);
        return p.completed && task?.isRequired;
    }).length;
    return (<div className="space-y-6" data-spec-id="checklist-view">
      {}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50" data-spec-id="QIMn7dQTSZJpPTuz">
        <CardHeader data-spec-id="yyB4qq8tVmN35u3a">
          <div className="flex items-center justify-between" data-spec-id="iG001rLBMpT5eogo">
            <div data-spec-id="P1gavXdm8s60SsVw">
              <CardTitle className="text-2xl text-gray-900" data-spec-id="66XSAHxwH0HvaYdS">
                Welcome back, {user?.name}!
              </CardTitle>
              <p className="text-gray-600 mt-1 capitalize" data-spec-id="3XY6puZlv8emhrSu">
                {user?.role} Daily Checklist
              </p>
              {selectedPeriod && (<p className="text-lg font-semibold text-blue-800 mt-2" data-spec-id="current-period-title">
                  📋 {getPeriodLabel(selectedPeriod.period, selectedPeriod.shift)}
                </p>)}
            </div>
            <div className="flex items-center space-x-2" data-spec-id="zgnatfbpycDaCGpD">
              <Badge variant="outline" className="text-blue-800 bg-blue-100 border-blue-200" data-spec-id="Gpy7CYsR2nOW1DaS">
                <Calendar className="w-3 h-3 mr-1" data-spec-id="vSEGkNRqBBppV6n3"/>
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4" data-spec-id="Y1Vho1SKDKoOHntP">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-spec-id="CbTKPvHmjEj76XXR">
            <div className="bg-white rounded-lg p-4 border" data-spec-id="kVIkZpM3GSWSeQiC">
              <div className="flex items-center space-x-2" data-spec-id="3giQQsfQhNXZFwSQ">
                <CheckCircle2 className="w-5 h-5 text-green-600" data-spec-id="5ew04WCluxzWq5Oe"/>
                <span className="font-medium" data-spec-id="PWxs81sUor8FMrlL">Progresso</span>
              </div>
              <div className="mt-2" data-spec-id="FfrbH1dtVUaVMaxL">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1" data-spec-id="6e3SBw7hgdrXOHUZ">
                  <span data-spec-id="y123Ps9p0RRbK4VG">Completed</span>
                  <span data-spec-id="XLfeY1X540NjGfI8">{completedTasks}/{totalTasks}</span>
                </div>
                <Progress value={checklist.completionRate} className="h-2" data-spec-id="KNBKrfOZMXl0dpO6"/>
                <p className="text-lg font-bold text-gray-900 mt-1" data-spec-id="cClHtnEOmT7WUbzj">
                  {checklist.completionRate}%
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border" data-spec-id="lnRbeA87wt9Ddpor">
              <div className="flex items-center space-x-2" data-spec-id="Euz1G3bN0kSC6mWb">
                <Target className="w-5 h-5 text-orange-600" data-spec-id="lZzPzqB2geWWvnRl"/>
                <span className="font-medium" data-spec-id="OXRBNOvNx0tDOOvy">Required Tasks</span>
              </div>
              <div className="mt-2" data-spec-id="4BlXML3tPdBvBtcS">
                <p className="text-lg font-bold text-gray-900" data-spec-id="LCXmy7gjEvBTiISI">
                  {completedRequiredTasks}/{requiredTasks}
                </p>
                <p className="text-sm text-gray-600" data-spec-id="Pc7YsdohFaOYe3DP">Deve completar</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border" data-spec-id="CqDAxlcWyd5zWZC7">
              <div className="flex items-center space-x-2" data-spec-id="DoAuPKKDwuSbrxZX">
                <CheckSquare className="w-5 h-5 text-blue-600" data-spec-id="09sq18Ujzr7ky44r"/>
                <span className="font-medium" data-spec-id="R0WkYV9ctDe6FiGl">Total de Tarefas</span>
              </div>
              <div className="mt-2" data-spec-id="h0yP2drRruiIbsKd">
                <p className="text-lg font-bold text-gray-900" data-spec-id="UjqdcPFJTfoo0ZkE">
                  {checklist.progress.length} tarefas
                </p>
                <p className="text-sm text-gray-600" data-spec-id="HgEHM7u6pPV8vfcR">Total de tarefas</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between" data-spec-id="qATqja9InJRL3Ms7">
            <div className="flex items-center space-x-2" data-spec-id="ZiBcTNyZ6i6i9TnV">
              {checklist.isFinalized && (<Badge className="bg-blue-600" data-spec-id="finalized-badge">
                  <FileCheck className="w-3 h-3 mr-1" data-spec-id="finalized-icon"/>
                  Finalizado
                </Badge>)}
              {checklist.completionRate === 100 && !checklist.isFinalized && (<Badge className="bg-green-600" data-spec-id="B5RHG2ynb5PE1oRy">
                  <TrendingUp className="w-3 h-3 mr-1" data-spec-id="FEvc3HJAl6a8yvHS"/>
                  Completed
                </Badge>)}
              {checklist.startedAt && (<p className="text-sm text-gray-600" data-spec-id="I0XokjPM87IFBE1w">
                  Started at {new Date(checklist.startedAt).toLocaleTimeString()}
                </p>)}
              {checklist.reopenReason && (<p className="text-sm text-orange-600" data-spec-id="reopen-indicator">
                  Reaberto: {checklist.reopenReason}
                </p>)}
            </div>
            
            <div className="flex items-center space-x-2" data-spec-id="checklist-actions">
              {!checklist.isFinalized && (<Button onClick={()=>setShowFinalizationDialog(true)} className="bg-green-600 hover:bg-green-700" size="sm" data-spec-id="finalize-checklist">
                  <FileCheck className="w-4 h-4 mr-2" data-spec-id="finalize-icon"/>
                  Finalizar
                </Button>)}
              
              {!checklist.isFinalized && (<Button variant="outline" size="sm" onClick={resetChecklist} data-spec-id="reset-checklist">
                  <RefreshCw className="w-4 h-4 mr-2" data-spec-id="UDxiq4j3Khdjh7LN"/>
                  Reiniciar
                </Button>)}
              
              <Button variant="outline" size="sm" onClick={handleCancelChecklist} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" data-spec-id="cancel-checklist-btn">
                <X className="w-4 h-4 mr-2" data-spec-id="cancel-icon"/>
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card data-spec-id="NZYBjQxxdMiyjVeF">
        <CardHeader data-spec-id="3RKc69zcKv6Yedh4">
          <CardTitle data-spec-id="ePmrL8I9sntcymTK">
            {selectedPeriod ? `Tarefas - ${getPeriodLabel(selectedPeriod.period, selectedPeriod.shift)}` : "Today's Tasks"}
          </CardTitle>
          <p className="text-sm text-gray-600" data-spec-id="Y4rrMTlkmIufW6ib">
            Complete your daily routine. Required tasks are marked with *
          </p>
        </CardHeader>
        <CardContent className="space-y-4" data-spec-id="mlyyIFE1b0igyA6m">
          {checklist.progress.map((progressItem)=>{
        const task = template.tasks.find((t)=>t.id === progressItem.taskId);
        if (!task) {
            console.log('Task not found for progress item:', progressItem.taskId);
            return null;
        }
        console.log('Rendering task:', task.id, task.title, 'disabled:', checklist.isFinalized);
        return (<TaskItem key={task.id} task={task} progress={progressItem} onToggle={updateTaskProgress} disabled={checklist.isFinalized} userId={user?.id} checklistHistory={[]} currentDate={new Date()} data-spec-id="3A2DWFZeND36vHRY"/>);
    })}
        </CardContent>
      </Card>

      {}
      {user && template && checklist && (<ChecklistFinalizationDialog open={showFinalizationDialog} onOpenChange={setShowFinalizationDialog} checklist={checklist} template={template} user={user} onFinalize={handleFinalizeChecklist} data-spec-id="finalization-dialog-component"/>)}

      {pendingPeriod && (<ReopenChecklistDialog open={showReopenDialog} onOpenChange={setShowReopenDialog} checklistType={getPeriodLabel(pendingPeriod.period, pendingPeriod.shift)} onConfirm={handleReopenChecklist} data-spec-id="reopen-dialog-component"/>)}

      {}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog} data-spec-id="cancel-checklist-dialog">
        <AlertDialogContent data-spec-id="cancel-dialog-content">
          <AlertDialogHeader data-spec-id="cancel-dialog-header">
            <AlertDialogTitle className="flex items-center" data-spec-id="cancel-dialog-title">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" data-spec-id="cancel-warning-icon"/>
              Cancelar Checklist
            </AlertDialogTitle>
            <AlertDialogDescription data-spec-id="cancel-dialog-description">
              Tem certeza que deseja cancelar este checklist? Todo o progresso atual será perdido e você retornará à tela inicial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-spec-id="cancel-dialog-footer">
            <AlertDialogCancel onClick={handleStayInChecklist} data-spec-id="stay-in-checklist-btn">
              Permanecer no Checklist
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancelChecklist} className="bg-red-600 hover:bg-red-700" data-spec-id="confirm-cancel-checklist-btn">
              Cancelar Checklist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
};
export default ChecklistView;
