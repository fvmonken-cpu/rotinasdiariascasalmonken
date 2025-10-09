import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, AlertCircle, CheckCircle2, MessageSquare, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Task, TaskProgress } from '@/types';
import { cn } from '@/lib/utils';
import { getTaskRescheduleInfo } from '@/utils/taskFrequencyUtils';
interface TaskItemProps {
    task: Task;
    progress?: TaskProgress;
    onToggle: (taskId: string, completed: boolean, notes?: string) => void;
    disabled?: boolean;
    userId?: string;
    checklistHistory?: any[];
    currentDate?: Date;
}
const TaskItem = ({ task, progress, onToggle, disabled, userId, checklistHistory, currentDate }: TaskItemProps)=>{
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState(progress?.notes || '');
    const [showNotes, setShowNotes] = useState(false);
    const isCompleted = progress?.completed || false;
    const rescheduleInfo = userId && checklistHistory && currentDate ? getTaskRescheduleInfo(task, currentDate, userId, checklistHistory) : {
        isRescheduled: false
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
    const handleToggle = ()=>{
        console.log('TaskItem handleToggle called for task:', task.id, 'isCompleted:', isCompleted, 'disabled:', disabled);
        if (disabled) {
            console.log('Task is disabled, ignoring toggle');
            return;
        }
        onToggle(task.id, !isCompleted, notes);
        if (!isCompleted && notes) {
            setShowNotes(false);
        }
    };
    const handleNotesChange = (value: string)=>{
        setNotes(value);
        if (isCompleted) {
            onToggle(task.id, true, value);
        }
    };
    return (<div className={cn("border rounded-lg p-4 transition-all duration-200", isCompleted ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300")} data-spec-id={`task-${task.id}`}>
      <div className="flex items-start space-x-3" data-spec-id="46sIhpWeaKHx0c8E">
        <Checkbox checked={isCompleted} onCheckedChange={()=>handleToggle()} disabled={disabled} className="mt-1" data-spec-id={`task-checkbox-${task.id}`}/>
        
        <div className="flex-1 space-y-2" data-spec-id="IxaVRh9UOt7uyoc9">
          <div className="flex items-start justify-between" data-spec-id="XMku3LAFgLPZ0ZRt">
            <div className="flex-1" data-spec-id="IYGKJd7oMdeLRnuT">
              <h3 className={cn("font-medium text-gray-900", isCompleted && "line-through text-gray-500")} data-spec-id="VncALGpmj7L23iOQ">
                {task.title}
                {task.isRequired && (<span className="text-red-500 ml-1" data-spec-id="Du6iNnXFvb7stDVG">*</span>)}
                {rescheduleInfo.isRescheduled && (<span className="ml-2 inline-flex items-center text-amber-600" data-spec-id="rescheduled-indicator">
                    <RotateCcw className="w-3 h-3 mr-1" data-spec-id="reschedule-icon"/>
                    <span className="text-xs" data-spec-id="reschedule-text">Reagendada</span>
                  </span>)}
              </h3>
              
              {(task.description || isExpanded) && (<p className={cn("text-sm text-gray-600 mt-1", isCompleted && "line-through")} data-spec-id="mw3cFUf4Eedk9muZ">
                  {task.description}
                </p>)}
              
              {rescheduleInfo.isRescheduled && isExpanded && (<div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md" data-spec-id="reschedule-info">
                  <p className="text-sm text-amber-800" data-spec-id="reschedule-explanation">
                    <RotateCcw className="w-4 h-4 inline mr-1" data-spec-id="reschedule-info-icon"/>
                    {rescheduleInfo.reason}
                  </p>
                </div>)}
            </div>
            
            <div className="flex items-center space-x-2 ml-4" data-spec-id="ycY18RuSHs1P5qiv">
              {isCompleted && (<CheckCircle2 className="w-5 h-5 text-green-600" data-spec-id="AWayIOe7mzvLDfNn"/>)}
              
              <Button variant="ghost" size="sm" onClick={()=>setIsExpanded(!isExpanded)} data-spec-id={`task-expand-${task.id}`}>
                {isExpanded ? (<ChevronUp className="w-4 h-4" data-spec-id="4uLjCvi01NBBBLRY"/>) : (<ChevronDown className="w-4 h-4" data-spec-id="aUyXj2EsQ4JvcTui"/>)}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between" data-spec-id="trIU71JwlXXQYNtI">
            <div className="flex items-center space-x-2" data-spec-id="WB4YfBnHuArZAs9t">
              <Badge variant="outline" className={getPriorityColor(task.priority)} data-spec-id="DD9qlLWscPnBGkID">
                <AlertCircle className="w-3 h-3 mr-1" data-spec-id="J5OZHqRceXuPKm1E"/>
                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              
              <Badge variant="outline" className="text-blue-800 bg-blue-50 border-blue-200" data-spec-id="UGkfDRPdzy1AOG05">
                {task.category}
              </Badge>
              

            </div>
            
            <Button variant="ghost" size="sm" onClick={()=>setShowNotes(!showNotes)} className={cn(showNotes && "bg-gray-100", (notes || progress?.notes) && "text-blue-600")} data-spec-id={`task-notes-${task.id}`}>
              <MessageSquare className="w-4 h-4" data-spec-id="CuYWpR4wF1BrYdX0"/>
            </Button>
          </div>
          
          {progress?.completedAt && (<p className="text-xs text-green-600" data-spec-id="OepcinjcMl4PdGtO">
              Completed at {new Date(progress.completedAt).toLocaleTimeString()}
            </p>)}
          
          {showNotes && (<div className="mt-3 space-y-2" data-spec-id="hXIZDnvKartHxO2t">
              <Textarea placeholder="Add notes about this task..." value={notes} onChange={(e)=>handleNotesChange(e.target.value)} className="min-h-[80px]" disabled={disabled} data-spec-id={`task-notes-input-${task.id}`}/>
              {notes !== (progress?.notes || '') && (<Button size="sm" onClick={()=>onToggle(task.id, isCompleted, notes)} disabled={disabled} data-spec-id={`task-save-notes-${task.id}`}>
                  Salvar Notas
                </Button>)}
            </div>)}
        </div>
      </div>
    </div>);
};
export default TaskItem;
