import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, User, Clock, Edit } from 'lucide-react';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
interface PatientHistorySectionProps {
    patientId: string;
}
const PatientHistorySection: React.FC<PatientHistorySectionProps> = ({ patientId })=>{
    const { history, isLoading, error } = usePatientHistory(patientId);
    const { canViewCommercialFields } = useUserPermissions();
    const commercialFields = [
        'commercial_conditions',
        'payment_records',
        'weeks_20_date',
        'weeks_30_date',
        'weeks_32_date',
        'weeks_36_date'
    ];
    const isCommercialField = (field: string): boolean =>{
        return commercialFields.includes(field);
    };
    const getFieldLabel = (field: string): string =>{
        const fieldLabels: Record<string, string> = {
            full_name: 'Nome Completo',
            birth_date: 'Data de Nascimento',
            phone: 'Telefone',
            estimated_due_date: 'Data Provável do Parto',
            preferred_delivery_type: 'Via de Parto Preferida',
            obstetrician_id: 'Obstetra Responsável',
            obstetric_nurse_id: 'Enfermeira Obstétrica',
            doula_id: 'Doula',
            pediatrician_id: 'Pediatra',
            nutritionist_id: 'Nutricionista',
            lactation_consultant_id: 'Consultora de Amamentação',
            pelvic_physiotherapist_id: 'Fisioterapeuta Pélvica',
            birth_preparation_course: 'Curso de Preparação para o Parto',
            newborn_care_course: 'Curso de Cuidados com Recém-Nascido',
            breastfeeding_workshop: 'Workshop de Amamentação',
            nutritional_monitoring: 'Acompanhamento Nutricional',
            pelvic_physiotherapy: 'Fisioterapia Pélvica',
            pediatric_consultation: 'Consulta Pediátrica',
            baby_name: 'Nome do Bebê',
            partner_name: 'Nome do Companheiro',
            zip_code: 'CEP',
            street: 'Logradouro',
            number: 'Número',
            complement: 'Complemento',
            neighborhood: 'Bairro',
            city: 'Cidade',
            state: 'Estado',
            current_gestational_age_weeks: 'Idade Gestacional (Semanas)',
            current_gestational_age_days: 'Idade Gestacional (Dias)',
            commercial_conditions: 'Condições Comerciais',
            payment_records: 'Registros de Pagamentos',
            weeks_20_date: 'Data das 20 Semanas',
            weeks_30_date: 'Data das 30 Semanas',
            weeks_32_date: 'Data das 32 Semanas',
            weeks_36_date: 'Data das 36 Semanas'
        };
        return fieldLabels[field] || field;
    };
    const formatValue = (value: any): string =>{
        if (value === null || value === undefined) return 'Não informado';
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        if (typeof value === 'string') {
            if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                try {
                    return formatDate(new Date(value));
                } catch  {
                    return value;
                }
            }
            if (value === 'contratado') return 'Contratado';
            if (value === 'nao_contratado') return 'Não Contratado';
            if (value === 'normal') return 'Parto Normal';
            if (value === 'cesariana') return 'Cesariana';
            if (value === 'nao_definido') return 'Não Definido';
            return value;
        }
        return String(value);
    };
    const getActionIcon = (actionType: string)=>{
        switch(actionType){
            case 'create':
                return <User className="h-4 w-4 text-green-600" data-spec-id="create-icon"/>;
            case 'update':
                return <Edit className="h-4 w-4 text-blue-600" data-spec-id="update-icon"/>;
            default:
                return <History className="h-4 w-4 text-gray-600" data-spec-id="default-icon"/>;
        }
    };
    const getActionLabel = (actionType: string)=>{
        switch(actionType){
            case 'create':
                return 'Criação';
            case 'update':
                return 'Atualização';
            default:
                return 'Ação';
        }
    };
    const getUserTypeLabel = (userType: string)=>{
        const labels: Record<string, string> = {
            admin: 'Administrador',
            obstetra: 'Obstetra',
            enfermeira_obstetrica: 'Enfermeira Obstétrica',
            doula: 'Doula',
            pediatra: 'Pediatra',
            nutricionista: 'Nutricionista',
            consultora_amamentacao: 'Consultora de Amamentação',
            fisioterapeuta_pelvica: 'Fisioterapeuta Pélvica'
        };
        return labels[userType] || userType;
    };
    if (error) {
        return (<Card data-spec-id="history-error-card">
        <CardContent className="p-4" data-spec-id="xepakYHN6HHUFwgl">
          <p className="text-red-600 text-sm" data-spec-id="history-error">
            Erro ao carregar histórico: {error.message}
          </p>
        </CardContent>
      </Card>);
    }
    return (<Card data-spec-id="patient-history-section">
      <CardHeader data-spec-id="history-header">
        <CardTitle className="flex items-center space-x-2" data-spec-id="history-title">
          <History className="h-5 w-5" data-spec-id="history-title-icon"/>
          <span data-spec-id="history-title-text">Histórico de Alterações</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-spec-id="history-content">
        {isLoading ? (<div className="space-y-3" data-spec-id="history-loading">
            {Array.from({
        length: 3
    }).map((_, index)=>(<div key={index} className="space-y-2" data-spec-id={`history-skeleton-${index}`}>
                <Skeleton className="h-4 w-1/4" data-spec-id={`skeleton-header-${index}`}/>
                <Skeleton className="h-3 w-full" data-spec-id={`skeleton-line-1-${index}`}/>
                <Skeleton className="h-3 w-3/4" data-spec-id={`skeleton-line-2-${index}`}/>
              </div>))}
          </div>) : history.length === 0 ? (<p className="text-gray-500 text-sm text-center py-4" data-spec-id="no-history">
            Nenhuma alteração registrada ainda.
          </p>) : (<div className="space-y-4" data-spec-id="history-list">
            {history.map((entry)=>(<div key={entry.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg" data-spec-id={`history-entry-${entry.id}`}>
                <div className="flex items-start justify-between mb-2" data-spec-id="history-entry-header">
                  <div className="flex items-center space-x-2" data-spec-id="action-info">
                    {getActionIcon(entry.action_type)}
                    <Badge variant={entry.action_type === 'create' ? 'default' : 'secondary'} data-spec-id="action-badge">
                      {getActionLabel(entry.action_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500" data-spec-id="timestamp-info">
                    <Clock className="h-3 w-3" data-spec-id="clock-icon"/>
                    <span data-spec-id="timestamp">{formatDateTime(new Date(entry.created_at))}</span>
                  </div>
                </div>

                <div className="mb-2" data-spec-id="user-info">
                  <div className="flex items-center space-x-2 text-sm" data-spec-id="user-details">
                    <User className="h-3 w-3 text-gray-400" data-spec-id="user-icon"/>
                    <span className="font-medium" data-spec-id="user-name">
                      {entry.new_values?._user_name || entry.users?.full_name || `Usuário ID: ${entry.user_id}`}
                    </span>
                    {(entry.new_values?._user_type || entry.users?.user_type) && (<Badge variant="outline" className="text-xs" data-spec-id="user-type-badge">
                        {getUserTypeLabel(entry.new_values?._user_type || entry.users?.user_type)}
                      </Badge>)}
                  </div>
                </div>

                {entry.action_type === 'update' && entry.changed_fields.length > 0 && (<div className="space-y-2" data-spec-id="changes-list">
                    <h4 className="text-sm font-medium text-gray-700" data-spec-id="changes-title">
                      Campos alterados:
                    </h4>
                    {entry.changed_fields.filter((field)=>!field.startsWith('_') && (!isCommercialField(field) || canViewCommercialFields)).map((field)=>(<div key={field} className="text-xs space-y-1 ml-4" data-spec-id={`change-${field}`}>
                        <div className="font-medium text-gray-600" data-spec-id="field-name">
                          {getFieldLabel(field)}:
                        </div>
                        <div className="grid grid-cols-2 gap-2" data-spec-id="value-comparison">
                          <div data-spec-id="old-value">
                            <span className="text-red-600 font-medium" data-spec-id="fBQlQrLa3XYL7Y2L">Anterior: </span>
                            <span className="text-red-700" data-spec-id="O4lsrkKEZLM8xfUZ">
                              {formatValue(entry.old_values[field])}
                            </span>
                          </div>
                          <div data-spec-id="new-value">
                            <span className="text-green-600 font-medium" data-spec-id="GGtzP3J0DvCjlKW6">Novo: </span>
                            <span className="text-green-700" data-spec-id="VuNQeGTm1hq1BNU8">
                              {formatValue(entry.new_values[field])}
                            </span>
                          </div>
                        </div>
                      </div>))}
                  </div>)}

                {entry.action_type === 'create' && (<div className="text-sm text-gray-600" data-spec-id="creation-message">
                    <p data-spec-id="creation-text">
                      Paciente <span className="font-medium text-gray-800" data-spec-id="patient-name">
                        {entry.new_values?.patient_name || 'não identificada'}
                      </span> foi cadastrada no sistema.
                    </p>
                  </div>)}
              </div>))}
          </div>)}
      </CardContent>
    </Card>);
};
export default PatientHistorySection;
