import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CheckCircle2, Clock, TrendingUp, AlertTriangle, Target, Calendar } from 'lucide-react';
import { DailyChecklist, User } from '@/types';
import { mockTemplates } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
const mockUsers: User[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        role: 'director'
    },
    {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@company.com',
        role: 'secretary'
    },
    {
        id: '3',
        name: 'Anna Rodriguez',
        email: 'anna@company.com',
        role: 'nurse'
    },
    {
        id: '4',
        name: 'David Kim',
        email: 'david@company.com',
        role: 'sdr'
    },
    {
        id: '5',
        name: 'Lisa Wang',
        email: 'lisa@company.com',
        role: 'secretary'
    },
    {
        id: '6',
        name: 'John Smith',
        email: 'john@company.com',
        role: 'nurse'
    }
];
interface TeamMemberProgress {
    user: User;
    checklist?: DailyChecklist;
    completionRate: number;
    completedTasks: number;
    totalTasks: number;
    requiredTasksCompleted: number;
    totalRequiredTasks: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
    lastActivity?: string;
}
const DashboardView = ()=>{
    const [teamProgress, setTeamProgress] = useState<TeamMemberProgress[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const { isSupabaseConnected } = useSupabaseAuth();
    const getLocalDateString = ()=>{
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const today = getLocalDateString();
    useEffect(()=>{
        loadTeamProgress();
    }, []);
    const loadTeamProgress = async ()=>{
        console.log('Loading team progress data...');
        console.log('📅 Dashboard loading data for date:', today);
        try {
            if (isSupabaseConnected) {
                const progress = await loadSupabaseTeamProgress();
                setTeamProgress(progress);
                console.log('✅ Team progress loaded from Supabase:', progress);
            } else {
                const progress = loadMockTeamProgress();
                setTeamProgress(progress);
                console.log('✅ Team progress loaded from localStorage:', progress);
            }
        } catch (error) {
            console.error('❌ Error loading team progress:', error);
            const fallbackProgress = loadMockTeamProgress();
            setTeamProgress(fallbackProgress);
        } finally{
            setIsLoading(false);
        }
    };
    const loadSupabaseTeamProgress = async (): Promise<TeamMemberProgress[]> =>{
        console.log('🔍 Loading Supabase team progress for date:', today);
        const { data: users, error: usersError } = await supabase.from('users').select('*').neq('role', 'admin').neq('id', '00000000-0000-0000-0000-000000000001');
        if (usersError) {
            console.error('❌ Error loading users:', usersError);
            throw usersError;
        }
        console.log('👥 Users found for dashboard:', users?.length || 0);
        const { data: checklists, error: checklistsError } = await supabase.from('daily_checklists').select(`
                *,
                task_progress (*)
            `).eq('date', today);
        if (checklistsError) {
            console.error('❌ Error loading checklists:', checklistsError);
            throw checklistsError;
        }
        console.log('📋 Checklists found for today:', checklists?.length || 0);
        const progress: TeamMemberProgress[] = (users || []).map((user)=>{
            const userChecklists = (checklists || []).filter((checklist)=>checklist.user_id === user.id || (checklist.deleted_user_email === user.email));
            console.log(`📊 Dashboard - User ${user.name}: ${userChecklists.length} checklists`);
            const userChecklist = userChecklists.length > 0 ? userChecklists.sort((a, b)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] : null;
            const template = mockTemplates.find((t)=>t.role === user.role);
            const totalTasks = template?.tasks.length || 0;
            const totalRequiredTasks = template?.tasks.filter((t)=>t.isRequired).length || 0;
            let completedTasks = 0;
            let requiredTasksCompleted = 0;
            let lastActivity: string | undefined;
            if (userChecklist && userChecklist.task_progress) {
                completedTasks = userChecklist.task_progress.filter((p: any)=>p.completed).length;
                requiredTasksCompleted = userChecklist.task_progress.filter((p: any)=>{
                    const task = template?.tasks.find((t)=>t.id === p.task_id);
                    return p.completed && task?.isRequired;
                }).length;
                const lastCompletedTask = userChecklist.task_progress.filter((p: any)=>p.completed_at).sort((a: any, b: any)=>new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
                if (lastCompletedTask?.completed_at) {
                    lastActivity = lastCompletedTask.completed_at;
                } else if (userChecklist.started_at) {
                    lastActivity = userChecklist.started_at;
                }
            }
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            let status: TeamMemberProgress['status'] = 'not-started';
            if (completionRate === 100) {
                status = 'completed';
            } else if (completionRate > 0) {
                status = 'in-progress';
            }
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                checklist: userChecklist ? {
                    id: userChecklist.id,
                    userId: userChecklist.user_id || user.id,
                    templateId: userChecklist.template_id || '',
                    date: userChecklist.date,
                    period: userChecklist.period,
                    shift: userChecklist.shift,
                    completionRate: userChecklist.completion_rate || 0,
                    startedAt: userChecklist.started_at,
                    completedAt: userChecklist.completed_at,
                    isFinalized: userChecklist.is_finalized || false,
                    finalReport: userChecklist.final_report,
                    progress: (userChecklist.task_progress || []).map((progress: any)=>({
                            taskId: progress.task_id,
                            completed: progress.completed,
                            completedAt: progress.completed_at,
                            notes: progress.notes
                        }))
                } : undefined,
                completionRate,
                completedTasks,
                totalTasks,
                requiredTasksCompleted,
                totalRequiredTasks,
                status,
                lastActivity
            };
        });
        return progress;
    };
    const loadMockTeamProgress = (): TeamMemberProgress[] =>{
        const savedChecklists = JSON.parse(localStorage.getItem('dailyChecklists') || '[]');
        const progress: TeamMemberProgress[] = mockUsers.map((user)=>{
            const userChecklist = savedChecklists.find((c: DailyChecklist)=>c.userId === user.id && c.date === today);
            const template = mockTemplates.find((t)=>t.role === user.role);
            const totalTasks = template?.tasks.length || 0;
            const totalRequiredTasks = template?.tasks.filter((t)=>t.isRequired).length || 0;
            let completedTasks = 0;
            let requiredTasksCompleted = 0;
            let lastActivity: string | undefined;
            if (userChecklist) {
                completedTasks = userChecklist.progress.filter((p)=>p.completed).length;
                requiredTasksCompleted = userChecklist.progress.filter((p)=>{
                    const task = template?.tasks.find((t)=>t.id === p.taskId);
                    return p.completed && task?.isRequired;
                }).length;
                const lastCompletedTask = userChecklist.progress.filter((p)=>p.completedAt).sort((a, b)=>new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
                if (lastCompletedTask?.completedAt) {
                    lastActivity = lastCompletedTask.completedAt;
                } else if (userChecklist.startedAt) {
                    lastActivity = userChecklist.startedAt;
                }
            }
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            let status: TeamMemberProgress['status'] = 'not-started';
            if (completionRate === 100) {
                status = 'completed';
            } else if (completionRate > 0) {
                status = 'in-progress';
            }
            return {
                user,
                checklist: userChecklist,
                completionRate,
                completedTasks,
                totalTasks,
                requiredTasksCompleted,
                totalRequiredTasks,
                status,
                lastActivity
            };
        });
        return progress;
    };
    const filteredProgress = selectedRole === 'all' ? teamProgress : teamProgress.filter((p)=>p.user.role === selectedRole);
    const overallStats = {
        totalMembers: teamProgress.length,
        completedChecklists: teamProgress.filter((p)=>p.status === 'completed').length,
        inProgress: teamProgress.filter((p)=>p.status === 'in-progress').length,
        notStarted: teamProgress.filter((p)=>p.status === 'not-started').length,
        averageCompletion: Math.round(teamProgress.reduce((acc, p)=>acc + p.completionRate, 0) / teamProgress.length)
    };
    const getStatusColor = (status: string)=>{
        switch(status){
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'not-started':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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
    if (isLoading) {
        return (<div className="flex items-center justify-center h-64" data-spec-id="sjgEZg60tqnz010G">
        <Clock className="w-6 h-6 animate-spin text-blue-600" data-spec-id="V7z4mJxgdDxVkoDt"/>
      </div>);
    }
    return (<div className="space-y-6" data-spec-id="dashboard-view">
      {}
      <div className="flex items-center justify-between" data-spec-id="yhDjviaOncAqdNC2">
        <div data-spec-id="eYmWsgqQG5IXvDD1">
          <h2 className="text-2xl font-bold text-gray-900" data-spec-id="1KoNwyact8C4SkQI">Team Dashboard</h2>
          <p className="text-gray-600" data-spec-id="wwCotg75Kw4Pze0e">Monitor team progress and completion rates</p>
        </div>
        <Badge variant="outline" className="text-blue-800 bg-blue-100" data-spec-id="8iXkCISedZf66L7c">
          <Calendar className="w-3 h-3 mr-1" data-spec-id="ALsdgt1MiWx9Uy65"/>
          {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-spec-id="wVb3XCwvatYEN7Hz">
        <Card data-spec-id="dUaKjLD3J6w8HGOr">
          <CardContent className="p-4" data-spec-id="l5BT3m0zikeU7iux">
            <div className="flex items-center space-x-2" data-spec-id="MC9r3jyS29Nh7vlZ">
              <Users className="w-5 h-5 text-blue-600" data-spec-id="S9Hk6SADjsQAsvSb"/>
              <span className="font-medium" data-spec-id="lqI02JaLZzloCzbZ">Total Members</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2" data-spec-id="P7D7MYVTLIXmIDaM">
              {overallStats.totalMembers}
            </p>
          </CardContent>
        </Card>
        
        <Card data-spec-id="IdL4zQWBLG5sPAG2">
          <CardContent className="p-4" data-spec-id="i52qWs56I8sjS4uK">
            <div className="flex items-center space-x-2" data-spec-id="hx1rqDVszffDmsB9">
              <CheckCircle2 className="w-5 h-5 text-green-600" data-spec-id="m200cjLcorzjF8h3"/>
              <span className="font-medium" data-spec-id="2XDX9KTPzHYPaXP6">Concluídos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2" data-spec-id="jAPvdpVdNn88TOKL">
              {overallStats.completedChecklists}
            </p>
          </CardContent>
        </Card>
        
        <Card data-spec-id="ARhD3IZuRdtZdNUG">
          <CardContent className="p-4" data-spec-id="OxzvTDA3CVRTVORR">
            <div className="flex items-center space-x-2" data-spec-id="57j7uiWb6vWGcM15">
              <Clock className="w-5 h-5 text-blue-600" data-spec-id="9GTEKdLcgsrSE6DZ"/>
              <span className="font-medium" data-spec-id="fX9mgwnY6CO5ybT1">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2" data-spec-id="GpUKRAOWsbH6j6va">
              {overallStats.inProgress}
            </p>
          </CardContent>
        </Card>
        
        <Card data-spec-id="QrLtshobp5b53Mfl">
          <CardContent className="p-4" data-spec-id="Sp4WhOKpm2IssMgF">
            <div className="flex items-center space-x-2" data-spec-id="G4uRXwjuoi3sIQxe">
              <TrendingUp className="w-5 h-5 text-purple-600" data-spec-id="Adpd6Tx2zQHbd7k4"/>
              <span className="font-medium" data-spec-id="EUBx1inXyRy7KXas">Avg. Completion</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2" data-spec-id="QmGaHa4vV05BzQUv">
              {overallStats.averageCompletion}%
            </p>
          </CardContent>
        </Card>
      </div>

      {}
      <Card data-spec-id="5YfIVeA1GPArqpbb">
        <CardHeader data-spec-id="aOs9YxeQrSeEavZQ">
          <CardTitle data-spec-id="RGNK8NxzpD3YKgVA">Progresso da Equipe</CardTitle>
          <Tabs value={selectedRole} onValueChange={setSelectedRole} data-spec-id="1UVAM1bK36vhugk3">
            <TabsList data-spec-id="KQK4AWJtcl8PJzmO">
              <TabsTrigger value="all" data-spec-id="HekD4xIXHGDG6kUf">Todas as Funções</TabsTrigger>
              <TabsTrigger value="secretary" data-spec-id="8FyV0YlP4bTh96YJ">Secretária</TabsTrigger>
              <TabsTrigger value="nurse" data-spec-id="Laa5il1mEJXK6Dmr">Enfermeira</TabsTrigger>
              <TabsTrigger value="sdr" data-spec-id="jwGJnE0fqLhR2Xv2">SDR</TabsTrigger>
              <TabsTrigger value="director" data-spec-id="gaZ6J7aXEkx3ztoO">Diretora</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent data-spec-id="WXnaiRzokE9GScHn">
          <div className="space-y-4" data-spec-id="mBUUAYi66PFdW6j6">
            {filteredProgress.map((member)=>(<div key={member.user.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow" data-spec-id={`team-member-${member.user.id}`}>
                <div className="flex items-center justify-between mb-3" data-spec-id="KBtWM7qQEbNPdigc">
                  <div className="flex items-center space-x-3" data-spec-id="nlVU84qqJHcsa6wF">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center" data-spec-id="X8kKXPZLHZqETnVJ">
                      <span className="font-medium text-gray-700" data-spec-id="PBnBrC756ymz3cxX">
                        {member.user.name.split(' ').map((n)=>n[0]).join('')}
                      </span>
                    </div>
                    <div data-spec-id="XojiHc7hzsOXNPNn">
                      <h3 className="font-medium text-gray-900" data-spec-id="C5R4eEEixBP1RS6E">{member.user.name}</h3>
                      <p className="text-sm text-gray-600" data-spec-id="uI7nHnwuGW03bIBD">{member.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2" data-spec-id="on4nzcfJ6QwKj8WB">
                    <Badge className={getRoleColor(member.user.role)} data-spec-id="XXjgfwgduoNtSNFJ">
                      {member.user.role === 'secretary' ? 'Secretária' : member.user.role === 'nurse' ? 'Enfermeira' : member.user.role === 'director' ? 'Diretora' : member.user.role === 'sdr' ? 'SDR' : member.user.role}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(member.status)} data-spec-id="3XqmIzlodzF7WDQ4">
                      {member.status === 'completed' ? 'Concluído' : member.status === 'in-progress' ? 'Em Progresso' : member.status === 'not-started' ? 'Não Iniciado' : 'Em Atraso'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-spec-id="EA7wgtm0EaBtmm5j">
                  <div data-spec-id="foGKLfr5SadOg96c">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1" data-spec-id="AyRWsSdkjELk0iSX">
                      <span data-spec-id="NtWetbiem4gFoatL">Overall Progress</span>
                      <span data-spec-id="xy9FjnatjpRtGQbp">{member.completedTasks}/{member.totalTasks}</span>
                    </div>
                    <Progress value={member.completionRate} className="h-2" data-spec-id="XNqdMfivkbityWPV"/>
                    <p className="text-sm font-medium text-gray-900 mt-1" data-spec-id="TNam6lUaMXaFt33P">
                      {member.completionRate}%
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2" data-spec-id="HWMcdZEfcn1tuS2c">
                    <Target className="w-4 h-4 text-orange-600" data-spec-id="O6J9bZusrdPs80ms"/>
                    <div data-spec-id="36uhesUJf8ED2EXN">
                      <p className="text-sm text-gray-600" data-spec-id="mNYOTi71RcqA2t2n">Required Tasks</p>
                      <p className="font-medium" data-spec-id="8iAQCz5fTCrYbKyz">
                        {member.requiredTasksCompleted}/{member.totalRequiredTasks}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2" data-spec-id="U4lEPZrIky0g8aN0">
                    <Clock className="w-4 h-4 text-blue-600" data-spec-id="aIRC7gbXemdykrOX"/>
                    <div data-spec-id="wMw84bppwaiol8Re">
                      <p className="text-sm text-gray-600" data-spec-id="s5KzOhbCd0qORJJm">Last Activity</p>
                      <p className="font-medium text-sm" data-spec-id="8bNw33Luqao9wWNU">
                        {member.lastActivity ? new Date(member.lastActivity).toLocaleTimeString() : 'Not started'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>))}
          </div>
          
          {filteredProgress.length === 0 && (<div className="text-center py-8" data-spec-id="qErA1528p6MgLvYq">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" data-spec-id="MkUmofFTpPjUhPpm"/>
              <p className="text-gray-600" data-spec-id="RZIed77d1Nz1zF7w">No team members found for this role.</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
};
export default DashboardView;
