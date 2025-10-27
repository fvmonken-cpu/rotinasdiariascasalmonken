import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Baby, Calendar, Clock, MapPin, Phone, Stethoscope, User, Edit, Trash2, Eye, UserPlus, UserMinus } from 'lucide-react';
import { Patient } from '@/types/patient';
import { formatDate, calculateGestationalAge } from '@/utils/dateUtils';
import { formatPhone } from '@/utils/phoneUtils';
import { useCanDeletePatient } from '@/hooks/useUserPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
interface PatientCardProps {
    patient: Patient;
    onEdit?: (patient: Patient) => void;
    onDelete?: (patient: Patient) => void;
    onRegisterBirth?: (patient: Patient) => void;
    onViewDetails?: (patient: Patient) => void;
    onAssignObstetricNurse?: (patient: Patient) => void;
    onUnassignObstetricNurse?: (patient: Patient) => void;
    onAssignDoula?: (patient: Patient) => void;
    onUnassignDoula?: (patient: Patient) => void;
    isDeleting?: boolean;
    isAssigningNurse?: boolean;
    isUnassigningNurse?: boolean;
    isAssigningDoula?: boolean;
    isUnassigningDoula?: boolean;
}
const PatientCard: React.FC<PatientCardProps> = ({ patient, onEdit, onDelete, onRegisterBirth, onViewDetails, onAssignObstetricNurse, onUnassignObstetricNurse, onAssignDoula, onUnassignDoula, isDeleting, isAssigningNurse, isUnassigningNurse, isAssigningDoula, isUnassigningDoula })=>{
    const { user } = useAuth();
    const canDeletePatient = useCanDeletePatient();
    const isMobile = useIsMobile();
    const isObstetricNurse = user?.role === 'enfermeira_obstetrica';
    const isDoula = user?.role === 'doula';
    const isLactationConsultant = user?.role === 'consultora_amamentacao';
    const isSDR = user?.role === 'sdr';
    const getStatusColor = (is_born: boolean)=>{
        return is_born ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    };
    const getStatusText = (is_born: boolean)=>{
        return is_born ? 'Pós-Parto' : 'Gestante Ativa';
    };
    console.log('PatientCard - DPP do banco:', patient.estimated_due_date);
    console.log('PatientCard - Nome da paciente:', patient.full_name);
    const currentGA = patient.is_born ? null : (()=>{
        const [year, month, day] = patient.estimated_due_date.split('-').map(Number);
        const dppFromDB = new Date(year, month - 1, day);
        console.log('PatientCard - Data criada do banco:', dppFromDB);
        const ga = calculateGestationalAge(dppFromDB);
        console.log('PatientCard - IG calculada:', ga);
        return ga;
    })();
    const getInitials = (name: string)=>{
        return name.split(' ').map((word)=>word.charAt(0)).join('').toUpperCase().slice(0, 2);
    };
    const getDeliveryTypeIcon = (deliveryType: string)=>{
        switch(deliveryType){
            case 'normal':
                return {
                    text: 'PN',
                    color: 'bg-green-100 text-green-700 border-green-300'
                };
            case 'cesariana':
                return {
                    text: 'PC',
                    color: 'bg-blue-100 text-blue-700 border-blue-300'
                };
            case 'nao_definido':
            default:
                return {
                    text: 'ND',
                    color: 'bg-gray-100 text-gray-700 border-gray-300'
                };
        }
    };
    const getProfessionalStatusIcon = (isAssigned: boolean, type: 'EO' | 'D')=>{
        return {
            text: type,
            color: isAssigned ? 'bg-green-100 text-green-700 border-green-400' : 'bg-red-100 text-red-700 border-red-400'
        };
    };
    return (<Card className="hover:shadow-md transition-shadow" data-spec-id="patient-card">
      <CardHeader className="pb-3" data-spec-id="patient-card-header">
        <div className="flex items-start justify-between" data-spec-id="header-content">
          <div className="flex items-center space-x-3" data-spec-id="patient-info">
            <Avatar className="h-12 w-12" data-spec-id="patient-avatar">
              <AvatarFallback className="bg-blue-100 text-blue-700" data-spec-id="avatar-fallback">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div data-spec-id="patient-details">
              <h3 className="font-semibold text-lg text-gray-900" data-spec-id="patient-name">
                {patient.full_name}
              </h3>
              <p className="text-sm text-gray-600 flex items-center" data-spec-id="baby-name">
                <Baby className="h-4 w-4 mr-1" data-spec-id="baby-icon"/>
                {patient.baby_name || 'Nome não informado'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2" data-spec-id="status-indicators">
            {}
            {patient.is_born && (<Badge className={getStatusColor(patient.is_born)} data-spec-id="status-badge">
                {getStatusText(patient.is_born)}
              </Badge>)}
            
            {}
            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600" data-spec-id="registration-date-badge">
              <UserPlus className="h-3 w-3 mr-1" data-spec-id="registration-icon"/>
              {(()=>{
        const registrationDate = new Date(patient.created_at);
        return registrationDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    })()}
            </Badge>
            
            <div className="flex items-center space-x-2" data-spec-id="delivery-indicators">
              {}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getDeliveryTypeIcon(patient.preferred_delivery_type).color}`} data-spec-id="delivery-type-icon" title={`Via de parto: ${patient.preferred_delivery_type === 'normal' ? 'Normal' : patient.preferred_delivery_type === 'cesariana' ? 'Cesariana' : 'Não definido'}`}>
                {getDeliveryTypeIcon(patient.preferred_delivery_type).text}
              </div>
              
              {}
              {patient.preferred_delivery_type === 'normal' && (<>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getProfessionalStatusIcon(!!patient.obstetric_nurse_id, 'EO').color}`} data-spec-id="obstetric-nurse-status-icon" title={`Enfermeira Obstétrica: ${patient.obstetric_nurse_id ? 'Atribuída' : 'Não atribuída'}`}>
                    {getProfessionalStatusIcon(!!patient.obstetric_nurse_id, 'EO').text}
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getProfessionalStatusIcon(!!patient.doula_id, 'D').color}`} data-spec-id="doula-status-icon" title={`Doula: ${patient.doula_id ? 'Atribuída' : 'Não atribuída'}`}>
                    {getProfessionalStatusIcon(!!patient.doula_id, 'D').text}
                  </div>
                </>)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4" data-spec-id="patient-card-content">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-spec-id="gestational-info">
          <div className="flex items-center text-sm text-gray-600" data-spec-id="due-date">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" data-spec-id="calendar-icon"/>
            <span data-spec-id="due-date-text">
              DPP: {(()=>{
        const [year, month, day] = patient.estimated_due_date.split('-').map(Number);
        const safeDate = new Date(year, month - 1, day);
        return formatDate(safeDate);
    })()}
            </span>
          </div>
          
          {!patient.is_born && currentGA && (<div className="flex items-center text-sm text-gray-600" data-spec-id="current-ga">
              <Clock className="h-4 w-4 mr-2 text-green-500" data-spec-id="clock-icon"/>
              <span data-spec-id="ga-text">
                IG: {currentGA.weeks}s{currentGA.days}d
              </span>
            </div>)}
        </div>

        {}
        <div className="grid grid-cols-1 gap-2" data-spec-id="contact-info">
          {patient.phone && (<div className="flex items-center text-sm text-gray-600" data-spec-id="phone-info">
              <Phone className="h-4 w-4 mr-2 text-gray-500" data-spec-id="phone-icon"/>
              <span data-spec-id="phone-text">
                {formatPhone(patient.phone)}
              </span>
            </div>)}
          
          {(patient.neighborhood || patient.city || patient.state) && (<div className="flex items-center text-sm text-gray-600" data-spec-id="location-info">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" data-spec-id="map-icon"/>
              <span data-spec-id="location-text">
                {[
        patient.neighborhood,
        patient.city,
        patient.state
    ].filter(Boolean).join(', ')}
              </span>
            </div>)}
        </div>

        {}
        <div className="space-y-2" data-spec-id="medical-team">
          {patient.obstetrician && (<div className="flex items-center text-sm text-gray-600" data-spec-id="obstetrician-info">
              <Stethoscope className="h-4 w-4 mr-2 text-red-500" data-spec-id="stethoscope-icon"/>
              <span data-spec-id="obstetrician-text">
                Obstetra: {patient.obstetrician.full_name}
              </span>
            </div>)}
        </div>

        {}
        <div className="border-t pt-3" data-spec-id="services-section">
          <h4 className="text-sm font-medium text-gray-900 mb-2" data-spec-id="services-title">
            Serviços Contratados:
          </h4>
          <div className="flex flex-wrap gap-1" data-spec-id="services-badges">
            {patient.birth_preparation_course === 'contratado' && (<Badge variant="secondary" className="text-xs" data-spec-id="birth-prep-badge">
                Preparação Parto
              </Badge>)}
            {patient.newborn_care_course === 'contratado' && (<Badge variant="secondary" className="text-xs" data-spec-id="newborn-care-badge">
                Cuidados RN
              </Badge>)}
            {patient.breastfeeding_workshop === 'contratado' && (<Badge variant="secondary" className="text-xs" data-spec-id="breastfeeding-badge">
                Consultoria Amamentação
              </Badge>)}
            {patient.nutritional_monitoring === 'contratado' && (<Badge variant="secondary" className="text-xs" data-spec-id="nutrition-badge">
                Nutrição
              </Badge>)}
            {patient.pelvic_physiotherapy === 'contratado' && (<Badge variant="secondary" className="text-xs" data-spec-id="physiotherapy-badge">
                Fisioterapia
              </Badge>)}
            {patient.pediatric_consultation === 'contratado' && (<Badge variant="secondary" className="text-xs" data-spec-id="pediatric-badge">
                Cons. Pediatria
              </Badge>)}
            {[
        patient.birth_preparation_course,
        patient.newborn_care_course,
        patient.breastfeeding_workshop,
        patient.nutritional_monitoring,
        patient.pelvic_physiotherapy,
        patient.pediatric_consultation
    ].every((service)=>service === 'nao_contratado') && (<Badge variant="outline" className="text-xs text-gray-500" data-spec-id="no-services-badge">
                Nenhum serviço contratado
              </Badge>)}
          </div>
        </div>

        {}
        <div className="flex items-center justify-between pt-2 border-t" data-spec-id="actions-section">
          {}
          <div className="flex gap-2 flex-wrap" data-spec-id="primary-actions">
            {onViewDetails && (<Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={()=>onViewDetails(patient)} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" data-spec-id="view-details-button" title={isMobile ? "Ver Detalhes" : undefined}>
                <Eye className="h-4 w-4" data-spec-id="view-details-icon"/>
                {!isMobile && <span className="ml-1" data-spec-id="jAMbmGucW3Tav3KC">Ver Detalhes</span>}
              </Button>)}

            {}
            {isObstetricNurse && onAssignObstetricNurse && !patient.is_born && patient.preferred_delivery_type === 'normal' && !patient.obstetric_nurse_id && !user?.has_admin_power && (<Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={()=>onAssignObstetricNurse(patient)} disabled={isAssigningNurse} className="text-green-600 border-green-200 hover:bg-green-50" data-spec-id="assign-nurse-button">
                <UserPlus className="h-4 w-4 mr-1" data-spec-id="assign-nurse-icon"/>
                {isAssigningNurse ? 'Atribuindo...' : (isMobile ? 'Atribuir' : 'Me Atribuir')}
              </Button>)}

            {isDoula && onAssignDoula && !patient.is_born && patient.preferred_delivery_type === 'normal' && !patient.doula_id && (<Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={()=>onAssignDoula(patient)} disabled={isAssigningDoula} className="text-green-600 border-green-200 hover:bg-green-50" data-spec-id="assign-doula-button">
                <UserPlus className="h-4 w-4 mr-1" data-spec-id="assign-doula-icon"/>
                {isAssigningDoula ? 'Vinculando...' : 'Vincular'}
              </Button>)}

            {!patient.is_born && onRegisterBirth && !isObstetricNurse && !isDoula && !isLactationConsultant && !isSDR && (<Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={()=>onRegisterBirth(patient)} className="text-blue-600 border-blue-200 hover:bg-blue-50" data-spec-id="register-birth-button" title={isMobile ? "Registrar Nascimento" : undefined}>
                <Baby className="h-4 w-4" data-spec-id="baby-register-icon"/>
                {!isMobile && <span className="ml-1" data-spec-id="0zetQffRnpIZaMK8">Registrar Nascimento</span>}
              </Button>)}

            {}
            {isMobile && (<>
                {onEdit && !isObstetricNurse && !isDoula && (<Button variant="outline" size="xs" onClick={()=>onEdit(patient)} className="text-orange-600 border-orange-200 hover:bg-orange-50 p-2" data-spec-id="edit-button-mobile" title="Editar">
                    <Edit className="h-4 w-4" data-spec-id="edit-icon-mobile"/>
                  </Button>)}
                
                {onDelete && canDeletePatient && (<Button variant="outline" size="xs" onClick={()=>onDelete(patient)} disabled={isDeleting} className="text-red-600 border-red-200 hover:bg-red-50 p-2" data-spec-id="delete-button-mobile" title="Remover">
                    <Trash2 className="h-4 w-4" data-spec-id="trash-icon-mobile"/>
                  </Button>)}
              </>)}

            {}
            {!isMobile && (<>
                {isObstetricNurse && onUnassignObstetricNurse && !patient.is_born && patient.preferred_delivery_type === 'normal' && patient.obstetric_nurse_id === user?.id && !user?.has_admin_power && (<Button variant="outline" size="sm" onClick={()=>onUnassignObstetricNurse(patient)} disabled={isUnassigningNurse} className="text-red-600 border-red-200 hover:bg-red-50" data-spec-id="unassign-nurse-button">
                    <UserMinus className="h-4 w-4 mr-1" data-spec-id="unassign-nurse-icon"/>
                    {isUnassigningNurse ? 'Desvinculando...' : 'Desvincular'}
                  </Button>)}

                {isDoula && onUnassignDoula && !patient.is_born && patient.preferred_delivery_type === 'normal' && patient.doula_id === user?.id && (<Button variant="outline" size="sm" onClick={()=>onUnassignDoula(patient)} disabled={isUnassigningDoula} className="text-red-600 border-red-200 hover:bg-red-50" data-spec-id="unassign-doula-button">
                    <UserMinus className="h-4 w-4 mr-1" data-spec-id="unassign-doula-icon"/>
                    {isUnassigningDoula ? 'Desvinculando...' : 'Desvincular'}
                  </Button>)}

                {onEdit && !isObstetricNurse && !isDoula && (<Button variant="outline" size="sm" onClick={()=>onEdit(patient)} className="text-orange-600 border-orange-200 hover:bg-orange-50" data-spec-id="edit-button">
                    <Edit className="h-4 w-4 mr-1" data-spec-id="edit-icon"/>
                    Editar
                  </Button>)}
                
                {onDelete && canDeletePatient && (<Button variant="outline" size="sm" onClick={()=>onDelete(patient)} disabled={isDeleting} className="text-red-600 border-red-200 hover:bg-red-50" data-spec-id="delete-button">
                    <Trash2 className="h-4 w-4 mr-1" data-spec-id="trash-icon"/>
                    Remover
                  </Button>)}
              </>)}
          </div>


        </div>
      </CardContent>
    </Card>);
};
export default PatientCard;
