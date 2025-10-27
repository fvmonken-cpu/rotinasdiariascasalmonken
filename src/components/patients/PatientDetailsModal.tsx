import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, MapPin, Phone, Heart, Baby, Stethoscope, Edit } from 'lucide-react';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { calculateGestationalAge, formatDate as formatDateUtil } from '@/utils/dateUtils';
import PatientHistorySection from './PatientHistorySection';
import CommercialSection from './CommercialSection';
import MedicalObservationsSection from './MedicalObservationsSection';
interface PatientDetailsModalProps {
    patient: Patient | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (patient: Patient) => void;
    onRegisterBirth?: (patient: Patient) => void;
}
const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ patient, isOpen, onClose, onEdit, onRegisterBirth })=>{
    if (!patient) return null;
    const { user } = useAuth();
    const { canRegisterBirth, canRegisterAnyBirth } = useUserPermissions();
    const calculateAge = (birthDate: string)=>{
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };
    const calculateCurrentGA = (dppDate: string)=>{
        const [year, month, day] = dppDate.split('-').map(Number);
        const dpp = new Date(year, month - 1, day);
        return calculateGestationalAge(dpp);
    };
    const formatDate = (dateString: string)=>{
        const [year, month, day] = dateString.split('-').map(Number);
        const safeDate = new Date(year, month - 1, day);
        return safeDate.toLocaleDateString('pt-BR');
    };
    const getDeliveryTypeLabel = (type: string)=>{
        const types: Record<string, string> = {
            'normal': 'Parto Normal',
            'cesariana': 'Cesariana',
            'nao_definido': 'Não Definido'
        };
        return types[type] || type;
    };
    const getServiceStatus = (service: string)=>{
        const statuses: Record<string, {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
        }> = {
            'contratado': {
                label: 'Contratado',
                variant: 'default'
            },
            'nao_contratado': {
                label: 'Não Contratado',
                variant: 'secondary'
            }
        };
        return statuses[service] || {
            label: service,
            variant: 'outline'
        };
    };
    const isObstetricNurse = user?.role === 'enfermeira_obstetrica';
    const isDoula = user?.role === 'doula';
    const canEdit = user && onEdit && !isObstetricNurse && !isDoula && user.role !== 'consultora_amamentacao' && (user.role === 'administrativo' || user.role === 'superusuario' || user.role === 'sdr' || (user.role === 'obstetra' && (user.isAdmin || patient.obstetrician_id === user.id)));
    const canRegisterBirthForPatient = !patient.is_born && canRegisterBirth && onRegisterBirth && !isObstetricNurse && !isDoula && user?.role !== 'sdr' && (canRegisterAnyBirth || patient.obstetrician_id === user?.id);
    const currentGA = calculateCurrentGA(patient.estimated_due_date);
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="patient-details-modal">
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-spec-id="patient-details-content">
        <DialogHeader data-spec-id="patient-details-header">
          <div className="flex items-center justify-between" data-spec-id="header-content">
            <DialogTitle className="flex items-center space-x-2" data-spec-id="patient-details-title">
              <User className="h-5 w-5" data-spec-id="patient-icon"/>
              <span data-spec-id="patient-name">{patient.full_name}</span>
              <Badge variant={patient.is_born ? 'default' : 'secondary'} data-spec-id="patient-status-badge">
                {patient.is_born ? 'Nascido' : 'Ativa'}
              </Badge>
            </DialogTitle>
            
            <div className="flex space-x-2" data-spec-id="action-buttons">
              {canRegisterBirthForPatient && (<Button variant="default" size="sm" onClick={()=>onRegisterBirth!(patient)} data-spec-id="register-birth-button">
                  <Baby className="h-4 w-4 mr-2" data-spec-id="birth-icon"/>
                  Registrar Nascimento
                </Button>)}
              
              {canEdit && (<Button variant="outline" size="sm" onClick={()=>onEdit!(patient)} data-spec-id="edit-patient-button">
                  <Edit className="h-4 w-4 mr-2" data-spec-id="edit-icon"/>
                  Editar
                </Button>)}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-spec-id="patient-details-grid">
          {}
          <Card data-spec-id="personal-info-card">
            <CardHeader data-spec-id="personal-info-header">
              <CardTitle className="flex items-center space-x-2" data-spec-id="personal-info-title">
                <User className="h-4 w-4" data-spec-id="personal-icon"/>
                <span data-spec-id="5crHKbt46mutp8yz">Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-spec-id="personal-info-content">
              <div data-spec-id="birth-date-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="birth-date-label">Data de Nascimento:</label>
                <p className="text-sm" data-spec-id="birth-date-value">
                  {formatDate(patient.birth_date)} ({calculateAge(patient.birth_date)} anos)
                </p>
              </div>
              
              <div data-spec-id="phone-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="phone-label">Telefone:</label>
                <p className="text-sm" data-spec-id="phone-value">{patient.phone}</p>
              </div>

              {patient.partner_name && (<div data-spec-id="partner-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="partner-label">Companheiro:</label>
                  <p className="text-sm" data-spec-id="partner-value">{patient.partner_name}</p>
                </div>)}
            </CardContent>
          </Card>

          {}
          <Card data-spec-id="address-card">
            <CardHeader data-spec-id="address-header">
              <CardTitle className="flex items-center space-x-2" data-spec-id="address-title">
                <MapPin className="h-4 w-4" data-spec-id="address-icon"/>
                <span data-spec-id="sdbCUt4CrnBK9840">Endereço</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-spec-id="address-content">
              <div data-spec-id="street-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="street-label">Logradouro:</label>
                <p className="text-sm" data-spec-id="street-value">
                  {patient.street}
                  {patient.number && `, ${patient.number}`}
                  {patient.complement && `, ${patient.complement}`}
                </p>
              </div>
              
              <div data-spec-id="neighborhood-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="neighborhood-label">Bairro:</label>
                <p className="text-sm" data-spec-id="neighborhood-value">{patient.neighborhood}</p>
              </div>

              <div data-spec-id="city-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="city-label">Cidade/Estado:</label>
                <p className="text-sm" data-spec-id="city-value">{[
        patient.neighborhood,
        patient.city,
        patient.state
    ].filter(Boolean).join(', ')}</p>
              </div>

              <div data-spec-id="zip-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="zip-label">CEP:</label>
                <p className="text-sm" data-spec-id="zip-value">{patient.zip_code}</p>
              </div>
            </CardContent>
          </Card>

          {}
          <Card data-spec-id="pregnancy-info-card">
            <CardHeader data-spec-id="pregnancy-info-header">
              <CardTitle className="flex items-center space-x-2" data-spec-id="pregnancy-info-title">
                <Baby className="h-4 w-4" data-spec-id="pregnancy-icon"/>
                <span data-spec-id="ED0uDcFV3hFItxx9">Informações da Gestação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-spec-id="pregnancy-info-content">
              <div data-spec-id="dpp-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="dpp-label">Data Provável do Parto:</label>
                <p className="text-sm" data-spec-id="dpp-value">{formatDate(patient.estimated_due_date)}</p>
              </div>
              
              <div data-spec-id="current-ga-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="current-ga-label">Idade Gestacional Atual:</label>
                <p className="text-sm" data-spec-id="current-ga-value">
                  {currentGA.weeks} semanas e {currentGA.days} dias
                </p>
              </div>

              <div data-spec-id="delivery-type-field">
                <label className="text-sm font-medium text-gray-600" data-spec-id="delivery-type-label">Via de Parto Preferida:</label>
                <p className="text-sm" data-spec-id="delivery-type-value">
                  {getDeliveryTypeLabel(patient.preferred_delivery_type)}
                </p>
              </div>

              {patient.baby_name && (<div data-spec-id="baby-name-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="baby-name-label">Nome do Bebê:</label>
                  <p className="text-sm" data-spec-id="baby-name-value">{patient.baby_name}</p>
                </div>)}
            </CardContent>
          </Card>

          {}
          <Card data-spec-id="medical-team-card">
            <CardHeader data-spec-id="medical-team-header">
              <CardTitle className="flex items-center space-x-2" data-spec-id="medical-team-title">
                <Stethoscope className="h-4 w-4" data-spec-id="medical-icon"/>
                <span data-spec-id="aUME8ipQuMcjOBVE">Equipe Médica</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-spec-id="medical-team-content">
              {patient.obstetrician && (<div data-spec-id="obstetrician-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="obstetrician-label">Obstetra:</label>
                  <p className="text-sm" data-spec-id="obstetrician-value">{patient.obstetrician.full_name}</p>
                </div>)}

              {patient.obstetric_nurse && (<div data-spec-id="obstetric-nurse-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="obstetric-nurse-label">Enfermeira Obstétrica:</label>
                  <p className="text-sm" data-spec-id="obstetric-nurse-value">{patient.obstetric_nurse.full_name}</p>
                </div>)}

              {patient.doula && (<div data-spec-id="doula-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="doula-label">Doula:</label>
                  <p className="text-sm" data-spec-id="doula-value">{patient.doula.full_name}</p>
                </div>)}

              {patient.pediatrician && patient.pediatric_consultation === 'contratado' && (<div data-spec-id="pediatrician-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="pediatrician-label">Pediatra:</label>
                  <p className="text-sm" data-spec-id="pediatrician-value">{patient.pediatrician.full_name}</p>
                </div>)}

              {patient.nutritionist && patient.nutritional_monitoring === 'contratado' && (<div data-spec-id="nutritionist-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="nutritionist-label">Nutricionista:</label>
                  <p className="text-sm" data-spec-id="nutritionist-value">{patient.nutritionist.full_name}</p>
                </div>)}

              {patient.lactation_consultant && patient.breastfeeding_workshop === 'contratado' && (<div data-spec-id="lactation-consultant-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="lactation-consultant-label">Consultora de Amamentação:</label>
                  <p className="text-sm" data-spec-id="lactation-consultant-value">{patient.lactation_consultant.full_name}</p>
                </div>)}

              {patient.pelvic_physiotherapist && patient.pelvic_physiotherapy === 'contratado' && (<div data-spec-id="pelvic-physiotherapist-field">
                  <label className="text-sm font-medium text-gray-600" data-spec-id="pelvic-physiotherapist-label">Fisioterapeuta Pélvico:</label>
                  <p className="text-sm" data-spec-id="pelvic-physiotherapist-value">{patient.pelvic_physiotherapist.full_name}</p>
                </div>)}
            </CardContent>
          </Card>

          {}
          <Card className="md:col-span-2" data-spec-id="services-card">
            <CardHeader data-spec-id="services-header">
              <CardTitle className="flex items-center space-x-2" data-spec-id="services-title">
                <Heart className="h-4 w-4" data-spec-id="services-icon"/>
                <span data-spec-id="3YO0PxY570mAicbb">Serviços Contratados</span>
              </CardTitle>
            </CardHeader>
            <CardContent data-spec-id="services-content">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-spec-id="services-grid">
                <div className="flex flex-col items-center space-y-2" data-spec-id="birth-preparation-service">
                  <span className="text-sm font-medium" data-spec-id="birth-preparation-label">Curso Preparo Parto</span>
                  <Badge {...getServiceStatus(patient.birth_preparation_course)} data-spec-id="birth-preparation-badge">
                    {getServiceStatus(patient.birth_preparation_course).label}
                  </Badge>
                </div>

                <div className="flex flex-col items-center space-y-2" data-spec-id="newborn-care-service">
                  <span className="text-sm font-medium" data-spec-id="newborn-care-label">Curso Cuidados RN</span>
                  <Badge {...getServiceStatus(patient.newborn_care_course)} data-spec-id="newborn-care-badge">
                    {getServiceStatus(patient.newborn_care_course).label}
                  </Badge>
                </div>

                <div className="flex flex-col items-center space-y-2" data-spec-id="pelvic-physiotherapy-service">
                  <span className="text-sm font-medium" data-spec-id="pelvic-physiotherapy-label">Fisioterapia Pélvica</span>
                  <Badge {...getServiceStatus(patient.pelvic_physiotherapy)} data-spec-id="pelvic-physiotherapy-badge">
                    {getServiceStatus(patient.pelvic_physiotherapy).label}
                  </Badge>
                </div>

                <div className="flex flex-col items-center space-y-2" data-spec-id="breastfeeding-workshop-service">
                  <span className="text-sm font-medium" data-spec-id="breastfeeding-workshop-label">Consultoria Amamentação</span>
                  <Badge {...getServiceStatus(patient.breastfeeding_workshop)} data-spec-id="breastfeeding-workshop-badge">
                    {getServiceStatus(patient.breastfeeding_workshop).label}
                  </Badge>
                </div>

                <div className="flex flex-col items-center space-y-2" data-spec-id="pediatric-consultation-service">
                  <span className="text-sm font-medium" data-spec-id="pediatric-consultation-label">Consulta Pediátrica</span>
                  <Badge {...getServiceStatus(patient.pediatric_consultation)} data-spec-id="pediatric-consultation-badge">
                    {getServiceStatus(patient.pediatric_consultation).label}
                  </Badge>
                </div>

                <div className="flex flex-col items-center space-y-2" data-spec-id="nutritional-monitoring-service">
                  <span className="text-sm font-medium" data-spec-id="nutritional-monitoring-label">Acompanhamento Nutricional</span>
                  <Badge {...getServiceStatus(patient.nutritional_monitoring)} data-spec-id="nutritional-monitoring-badge">
                    {getServiceStatus(patient.nutritional_monitoring).label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <div className="md:col-span-2" data-spec-id="commercial-section-container">
            <CommercialSection formData={{
        commercial_conditions: patient.commercial_conditions,
        payment_records: patient.payment_records,
        weeks_20_date: patient.weeks_20_date,
        weeks_30_date: patient.weeks_30_date,
        weeks_32_date: patient.weeks_32_date,
        weeks_36_date: patient.weeks_36_date
    }} onChange={()=>{}} readOnly={true} data-spec-id="patient-details-commercial-section"/>
          </div>

          {}
          <div className="md:col-span-2" data-spec-id="medical-observations-section-container">
            <MedicalObservationsSection value={patient.gestational_observations || ''} onChange={()=>{}} readOnly={true} data-spec-id="patient-details-medical-observations"/>
          </div>

          {}
          <div className="md:col-span-2" data-spec-id="history-section-container">
            <PatientHistorySection patientId={patient.id} data-spec-id="patient-history-component"/>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
};
export default PatientDetailsModal;
