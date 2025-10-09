import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Settings, Clock, AlertCircle, Users } from 'lucide-react';
import { ChecklistTemplate, Task, User } from '@/types';
import { mockTemplates } from '@/data/mockData';
import { toast } from 'sonner';
import UserManagement from './UserManagement';
import AdminReports from './AdminReports';
import RoleTemplateManager from './RoleTemplateManager';
const AdminView = ()=>{
    const [templates, setTemplates] = useState<ChecklistTemplate[]>(mockTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        estimatedTime: 30,
        isRequired: true
    });
    useEffect(()=>{
        const savedTemplates = localStorage.getItem('checklistTemplates');
        if (savedTemplates) {
            setTemplates(JSON.parse(savedTemplates));
        }
    }, []);
    const saveTemplates = (updatedTemplates: ChecklistTemplate[])=>{
        setTemplates(updatedTemplates);
        localStorage.setItem('checklistTemplates', JSON.stringify(updatedTemplates));
        toast.success('Templates updated successfully');
    };
    const addTask = ()=>{
        if (!selectedTemplate || !newTask.title) {
            toast.error('Por favor, preencha o título da tarefa');
            return;
        }
        const task: Task = {
            id: `task-${Date.now()}`,
            title: newTask.title,
            description: newTask.description || '',
            category: newTask.category || 'General',
            priority: newTask.priority as 'low' | 'medium' | 'high',
            estimatedTime: newTask.estimatedTime || 30,
            isRequired: newTask.isRequired || false
        };
        const updatedTemplate = {
            ...selectedTemplate,
            tasks: [
                ...selectedTemplate.tasks,
                task
            ],
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = templates.map((t)=>t.id === selectedTemplate.id ? updatedTemplate : t);
        saveTemplates(updatedTemplates);
        setSelectedTemplate(updatedTemplate);
        setNewTask({
            title: '',
            description: '',
            category: '',
            priority: 'medium',
            estimatedTime: 30,
            isRequired: true
        });
        console.log('Added new task:', task);
    };
    const updateTask = (taskId: string, updates: Partial<Task>)=>{
        if (!selectedTemplate) return;
        const updatedTemplate = {
            ...selectedTemplate,
            tasks: selectedTemplate.tasks.map((task)=>task.id === taskId ? {
                    ...task,
                    ...updates
                } : task),
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = templates.map((t)=>t.id === selectedTemplate.id ? updatedTemplate : t);
        saveTemplates(updatedTemplates);
        setSelectedTemplate(updatedTemplate);
        setEditingTask(null);
        console.log('Updated task:', taskId, updates);
    };
    const deleteTask = (taskId: string)=>{
        if (!selectedTemplate) return;
        const updatedTemplate = {
            ...selectedTemplate,
            tasks: selectedTemplate.tasks.filter((task)=>task.id !== taskId),
            updatedAt: new Date().toISOString()
        };
        const updatedTemplates = templates.map((t)=>t.id === selectedTemplate.id ? updatedTemplate : t);
        saveTemplates(updatedTemplates);
        setSelectedTemplate(updatedTemplate);
        toast.success('Task deleted');
        console.log('Deleted task:', taskId);
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
    const getRoleColor = (role: string)=>{
        const colors = {
            director: 'bg-purple-100 text-purple-800',
            secretary: 'bg-blue-100 text-blue-800',
            nurse: 'bg-green-100 text-green-800',
            sdr: 'bg-orange-100 text-orange-800'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };
    return (<div className="space-y-6" data-spec-id="admin-view">
      {}
      <div className="flex items-center justify-between" data-spec-id="CGnMgVGgfWScWxmF">
        <div data-spec-id="VFNQV2S5JeTIXmyA">
          <h2 className="text-2xl font-bold text-gray-900" data-spec-id="qgPCMezZaCKgV5ra">Painel Administrativo</h2>
          <p className="text-gray-600" data-spec-id="iwm00oAfSzyCK2N4">Gerencie usuários, templates de checklist e tarefas</p>
        </div>
        <Badge variant="outline" className="text-purple-800 bg-purple-100" data-spec-id="VaSDuD78uFLJQ7H8">
          <Settings className="w-3 h-3 mr-1" data-spec-id="2cag1J1vrOCLzL4L"/>
          Administrador
        </Badge>
      </div>

      {}
      <UserManagement data-spec-id="IoyQ2wyZTtdejaJN"/>

      {}
      <div className="border-t border-gray-200" data-spec-id="admin-divider-1"></div>

      {}
      <AdminReports data-spec-id="admin-reports-section"/>

      {}
      <div className="border-t border-gray-200" data-spec-id="admin-divider-2"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-spec-id="j3XA4zgw8WX7upcR">
        {}
        <Card className="lg:col-span-1" data-spec-id="6rifvgFMfL9pBoAY">
          <CardHeader data-spec-id="z6RmmCR84ulqOA78">
            <CardTitle className="flex items-center" data-spec-id="qFZR3yKmiI3acNVS">
              <Users className="w-5 h-5 mr-2" data-spec-id="n4QbojJfuLJCZK9f"/>
              Role Templates
            </CardTitle>
            <p className="text-sm text-gray-600" data-spec-id="fhxn9poETtK5pR0T">
              Select a role to manage its checklist
            </p>
          </CardHeader>
          <CardContent className="space-y-3" data-spec-id="WFlUMiOITm3tSh2j">
            {templates.map((template)=>(<button key={template.id} onClick={()=>setSelectedTemplate(template)} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTemplate?.id === template.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} data-spec-id={`template-${template.role}`}>
                <div className="flex items-center justify-between" data-spec-id="RG594EMlvtRJQcy5">
                  <div data-spec-id="I173662QcdCpBD7h">
                    <h3 className="font-medium text-gray-900 capitalize" data-spec-id="gHeNa1UMaGM1ISUn">
                      {template.role}
                    </h3>
                    <p className="text-sm text-gray-600" data-spec-id="U11XUbZ5RGnMHiZS">
                      {template.tasks.length} tasks
                    </p>
                  </div>
                  <Badge className={getRoleColor(template.role)} data-spec-id="gJkPsM2vwJN79Dle">
                    {template.role}
                  </Badge>
                </div>
              </button>))}
          </CardContent>
        </Card>

        {}
        <Card className="lg:col-span-2" data-spec-id="3hlGhBnpS6uIQjs0">
          {selectedTemplate ? (<>
              <CardHeader data-spec-id="pPaSKyA3bvgzpYpc">
                <div className="flex items-center justify-between" data-spec-id="00CLym0yK6p7dugd">
                  <div data-spec-id="8VW8M2EUjJh3B6bz">
                    <CardTitle className="capitalize" data-spec-id="F2b9muV16GKc61mo">
                      Checklist de {selectedTemplate.role === 'secretary' ? 'Secretária' : selectedTemplate.role === 'nurse' ? 'Enfermeira' : selectedTemplate.role === 'director' ? 'Diretora' : selectedTemplate.role === 'sdr' ? 'SDR' : selectedTemplate.role}
                    </CardTitle>
                    <p className="text-sm text-gray-600" data-spec-id="a2BE8cFnqAGx56XR">
                      Last updated: {new Date(selectedTemplate.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getRoleColor(selectedTemplate.role)} data-spec-id="ITbVP8oEMlCWRcFJ">
                    {selectedTemplate.tasks.length} tasks
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6" data-spec-id="53ysOMqQgMEhoJCu">
                {}
                <div className="border rounded-lg p-4 bg-gray-50" data-spec-id="Rvn7xyBcMEC25iiN">
                  <h4 className="font-medium text-gray-900 mb-3" data-spec-id="oFw7U1t47P7Mkm5C">Add New Task</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="oOvSJC6k8W3i7bnx">
                    <div data-spec-id="Mb4nVwuYxVU7FY9d">
                      <Label htmlFor="task-title" data-spec-id="uZLPeiXA70B5VgTn">Task Title *</Label>
                      <Input id="task-title" value={newTask.title} onChange={(e)=>setNewTask({
            ...newTask,
            title: e.target.value
        })} placeholder="Enter task title" data-spec-id="new-task-title"/>
                    </div>
                    
                    <div data-spec-id="97cvK6yPO1wjkr7o">
                      <Label htmlFor="task-category" data-spec-id="AdWew7FmZpnhsHAh">Categoria</Label>
                      <Input id="task-category" value={newTask.category} onChange={(e)=>setNewTask({
            ...newTask,
            category: e.target.value
        })} placeholder="ex: Comunicação, Administração" data-spec-id="new-task-category"/>
                    </div>
                    
                    <div data-spec-id="Gcs6irfWsjZ2ydSf">
                      <Label htmlFor="task-priority" data-spec-id="6RHXhq8z2pECSMGE">Prioridade</Label>
                      <Select value={newTask.priority} onValueChange={(value)=>setNewTask({
            ...newTask,
            priority: value as 'low' | 'medium' | 'high'
        })} data-spec-id="x9sJxWek8NkcbnRI">
                        <SelectTrigger data-spec-id="new-task-priority">
                          <SelectValue data-spec-id="XzLAGE9rJ2hLV6Jx"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="WBAUWqf9SESAX81T">
                          <SelectItem value="low" data-spec-id="WopZCqxTU3WAgIHF">Low</SelectItem>
                          <SelectItem value="medium" data-spec-id="BwDQO3NFzucjqL0B">Medium</SelectItem>
                          <SelectItem value="high" data-spec-id="2CKgfworiqSjirPp">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div data-spec-id="GitkNSznxjeoPAwy">
                      <Label htmlFor="task-time" data-spec-id="qLG2ZD6L3jiByMhQ">Estimated Time (minutes)</Label>
                      <Input id="task-time" type="number" value={newTask.estimatedTime} onChange={(e)=>setNewTask({
            ...newTask,
            estimatedTime: parseInt(e.target.value)
        })} min="5" max="480" data-spec-id="new-task-time"/>
                    </div>
                    
                    <div className="md:col-span-2" data-spec-id="BwN2YXhsyGeQ3njA">
                      <Label htmlFor="task-description" data-spec-id="lJEiY4c1VuuHD8vg">Descrição</Label>
                      <Textarea id="task-description" value={newTask.description} onChange={(e)=>setNewTask({
            ...newTask,
            description: e.target.value
        })} placeholder="Descrição opcional da tarefa" rows={2} data-spec-id="new-task-description"/>
                    </div>
                    
                    <div className="flex items-center space-x-2" data-spec-id="X9p9rPKoiGtRWMpi">
                      <input type="checkbox" id="task-required" checked={newTask.isRequired} onChange={(e)=>setNewTask({
            ...newTask,
            isRequired: e.target.checked
        })} className="rounded" data-spec-id="new-task-required"/>
                      <Label htmlFor="task-required" data-spec-id="tmThRmeKTSHYjR2Z">Tarefa obrigatória</Label>
                    </div>
                    
                    <div className="flex justify-end" data-spec-id="VYFTk4SmNvOWLVEp">
                      <Button onClick={addTask} data-spec-id="add-task-button">
                        <Plus className="w-4 h-4 mr-2" data-spec-id="6dB23MNqx3uYXyts"/>
                        Add Task
                      </Button>
                    </div>
                  </div>
                </div>

                {}
                <div className="space-y-3" data-spec-id="azEDZgY4I14DxzgB">
                  <h4 className="font-medium text-gray-900" data-spec-id="FeHokzm0xT31FvP6">Current Tasks</h4>
                  {selectedTemplate.tasks.map((task)=>(<div key={task.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow" data-spec-id={`admin-task-${task.id}`}>
                      {editingTask?.id === task.id ? (<div className="space-y-4" data-spec-id="0Gy74AxOrTOK40Bb">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="QHdcavAFEtO1Nwn2">
                            <div data-spec-id="MULKqGY7agwvkvPK">
                              <Label data-spec-id="svwKezT5ZDMrsXNP">Task Title</Label>
                              <Input value={editingTask.title} onChange={(e)=>setEditingTask({
                ...editingTask,
                title: e.target.value
            })} data-spec-id={`edit-task-title-${task.id}`}/>
                            </div>
                            
                            <div data-spec-id="uhXH1vDGRHvxAr0q">
                              <Label data-spec-id="rwRd924X0Xiqc3G3">Categoria</Label>
                              <Input value={editingTask.category} onChange={(e)=>setEditingTask({
                ...editingTask,
                category: e.target.value
            })} data-spec-id={`edit-task-category-${task.id}`}/>
                            </div>
                            
                            <div data-spec-id="2yKVApaWMpzJFOG3">
                              <Label data-spec-id="0GOnp3mlTCVCMxzc">Prioridade</Label>
                              <Select value={editingTask.priority} onValueChange={(value)=>setEditingTask({
                ...editingTask,
                priority: value as 'low' | 'medium' | 'high'
            })} data-spec-id="eKP44pJAAyZYCYQJ">
                                <SelectTrigger data-spec-id={`edit-task-priority-${task.id}`}>
                                  <SelectValue data-spec-id="eGEl6BwmiTF2YYVE"/>
                                </SelectTrigger>
                                <SelectContent data-spec-id="WC6nDpUeGx3Hj4zE">
                                  <SelectItem value="low" data-spec-id="TuCLEesAGKT6iGwL">Baixa</SelectItem>
                                  <SelectItem value="medium" data-spec-id="bbOKVS6IZRLFkz46">Média</SelectItem>
                                  <SelectItem value="high" data-spec-id="6FLcFWXucB8fMiMd">Alta</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div data-spec-id="NJ6jliZH5xvciIqu">
                              <Label data-spec-id="FwcZ60EFCnrk2E0G">Tempo Estimado (minutos)</Label>
                              <Input type="number" value={editingTask.estimatedTime} onChange={(e)=>setEditingTask({
                ...editingTask,
                estimatedTime: parseInt(e.target.value)
            })} min="5" max="480" data-spec-id={`edit-task-time-${task.id}`}/>
                            </div>
                            
                            <div className="md:col-span-2" data-spec-id="dqpeePJx0OHF2r32">
                              <Label data-spec-id="SkRyPVbc8DTCrW9j">Description</Label>
                              <Textarea value={editingTask.description} onChange={(e)=>setEditingTask({
                ...editingTask,
                description: e.target.value
            })} rows={2} data-spec-id={`edit-task-description-${task.id}`}/>
                            </div>
                            
                            <div className="flex items-center space-x-2" data-spec-id="znSMhqpws25Acv4u">
                              <input type="checkbox" checked={editingTask.isRequired} onChange={(e)=>setEditingTask({
                ...editingTask,
                isRequired: e.target.checked
            })} className="rounded" data-spec-id={`edit-task-required-${task.id}`}/>
                              <Label data-spec-id="yF0rgvTz6chhLqyp">Required task</Label>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2" data-spec-id="Hm1t0hLjZlRAKk5r">
                            <Button variant="outline" onClick={()=>setEditingTask(null)} data-spec-id={`cancel-edit-${task.id}`}>
                              <X className="w-4 h-4 mr-2" data-spec-id="BrAmolGSFKlv4FlC"/>
                              Cancel
                            </Button>
                            <Button onClick={()=>updateTask(task.id, editingTask)} data-spec-id={`save-task-${task.id}`}>
                              <Save className="w-4 h-4 mr-2" data-spec-id="qvjIDRKqqM3Djs4F"/>
                              Save
                            </Button>
                          </div>
                        </div>) : (<div data-spec-id="A3lX4wZCabJkY0oH">
                          <div className="flex items-start justify-between mb-3" data-spec-id="3iOHVVHMrwGI0j9q">
                            <div className="flex-1" data-spec-id="dhJeWr5u3kKlm2pK">
                              <h5 className="font-medium text-gray-900" data-spec-id="m90ipRiZzP5YTQjD">
                                {task.title}
                                {task.isRequired && (<span className="text-red-500 ml-1" data-spec-id="YQN2URNmELvAquOy">*</span>)}
                              </h5>
                              {task.description && (<p className="text-sm text-gray-600 mt-1" data-spec-id="GADLz6RXIV8K9B1f">
                                  {task.description}
                                </p>)}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4" data-spec-id="aHA9LLIE0pcgsosc">
                              <Button variant="ghost" size="sm" onClick={()=>setEditingTask(task)} data-spec-id={`edit-task-${task.id}`}>
                                <Edit className="w-4 h-4" data-spec-id="ZvoLuZpyye3PiaAA"/>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={()=>deleteTask(task.id)} className="text-red-600 hover:text-red-700" data-spec-id={`delete-task-${task.id}`}>
                                <Trash2 className="w-4 h-4" data-spec-id="bh4TkRuHKvJ3ejVE"/>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2" data-spec-id="LZVhxShdtJRsCiba">
                            <Badge variant="outline" className={getPriorityColor(task.priority)} data-spec-id="dJ7a5Z9BXCe9ogrX">
                              <AlertCircle className="w-3 h-3 mr-1" data-spec-id="SiZtmhthAO39SWJw"/>
                              {task.priority}
                            </Badge>
                            
                            <Badge variant="outline" className="text-blue-800 bg-blue-50 border-blue-200" data-spec-id="MCNH8ObXnbknrbV2">
                              {task.category}
                            </Badge>
                            
                            {task.estimatedTime && (<Badge variant="outline" className="text-gray-600" data-spec-id="duMkW449olnc2fmj">
                                <Clock className="w-3 h-3 mr-1" data-spec-id="am6nxjA4pBeK4TRy"/>
                                {task.estimatedTime}min
                              </Badge>)}
                          </div>
                        </div>)}
                    </div>))}
                  
                  {selectedTemplate.tasks.length === 0 && (<div className="text-center py-8 text-gray-500" data-spec-id="eV3KL3GF9kFDmLHi">
                      <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" data-spec-id="x9u0brN2c4w8DBpk"/>
                      <p data-spec-id="0HGie3pPPnTOJ7TO">Nenhuma tarefa encontrada. Adicione algumas tarefas para começar.</p>
                    </div>)}
                </div>
              </CardContent>
            </>) : (<CardContent className="text-center py-12" data-spec-id="UOmgR0Z7498Pxho7">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" data-spec-id="35aArSlB1lQQQ5yI"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="YcPq7ziUB8n3SUxP">Select a Template</h3>
              <p className="text-gray-600" data-spec-id="XuWyw3HATo3pUkDM">Choose a role template from the left to manage its tasks.</p>
            </CardContent>)}
        </Card>
      </div>
    </div>);
};
export default AdminView;
