import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Baby, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { Patient } from '@/types/patient';
import { formatDate, calculateGestationalAge } from '@/utils/dateUtils';
import { formatPhone } from '@/utils/phoneUtils';
import { useCanDeletePatient } from '@/hooks/useUserPermissions';
import { useAuth } from '@/contexts/AuthContext';
interface PatientsTableProps {
    patients: Patient[];
    onEdit?: (patient: Patient) => void;
    onDelete?: (patient: Patient) => void;
    onRegisterBirth?: (patient: Patient) => void;
    canRegisterBirthForPatient?: (patient: Patient) => boolean;
    onAssignObstetricNurse?: (patient: Patient) => void;
    onUnassignObstetricNurse?: (patient: Patient) => void;
    isDeleting?: boolean;
    isAssigningNurse?: boolean;
    isUnassigningNurse?: boolean;
}
const PatientsTable: React.FC<PatientsTableProps> = ({ patients, onEdit, onDelete, onRegisterBirth, canRegisterBirthForPatient, onAssignObstetricNurse, onUnassignObstetricNurse, isDeleting, isAssigningNurse, isUnassigningNurse })=>{
    const canDeletePatient = useCanDeletePatient();
    const { user } = useAuth();
    const isObstetricNurse = user?.role === 'enfermeira_obstetrica';
    const isLactationConsultant = user?.role === 'consultora_amamentacao';
    const isSDR = user?.role === 'sdr';
    const getDeliveryTypeLabel = (type: string)=>{
        const labels = {
            'normal': 'Normal',
            'cesariana': 'Cesariana',
            'nao_definido': 'Não Definido'
        };
        return labels[type as keyof typeof labels] || type;
    };
    const getServiceStatus = (status: string)=>{
        const labels = {
            'contratado': 'Sim',
            'nao_contratado': 'Não'
        };
        return labels[status as keyof typeof labels] || status;
    };
    const calculateAge = (birthDate: string)=>{
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            return age - 1;
        }
        return age;
    };
    return (<div className="border rounded-lg overflow-auto" data-spec-id="patients-table-container">
            <Table data-spec-id="patients-table">
                <TableHeader data-spec-id="table-header">
                    <TableRow data-spec-id="header-row">
                        <TableHead className="min-w-[200px]" data-spec-id="name-header">Nome Completo</TableHead>
                        <TableHead className="min-w-[80px]" data-spec-id="age-header">Idade</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="phone-header">Telefone</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="dpp-header">DPP</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="ga-header">IG Atual</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="delivery-type-header">Via de Parto</TableHead>
                        <TableHead className="min-w-[150px]" data-spec-id="obstetrician-header">Obstetra</TableHead>
                        <TableHead className="min-w-[150px]" data-spec-id="nurse-header">Enfermeira</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="doula-header">Doula</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="pediatrician-header">Pediatra</TableHead>
                        <TableHead className="min-w-[200px]" data-spec-id="address-header">Endereço</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="baby-name-header">Nome do Bebê</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="partner-header">Companheiro(a)</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="birth-prep-header">Prep. Parto</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="newborn-care-header">Cuid. RN</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="breastfeeding-header">Amamentação</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="nutrition-header">Nutrição</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="physiotherapy-header">Fisioterapia</TableHead>
                        <TableHead className="min-w-[100px]" data-spec-id="pediatric-consult-header">Cons. Pediatria</TableHead>
                        <TableHead className="min-w-[120px]" data-spec-id="actions-header">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody data-spec-id="table-body">
                    {patients.filter((patient)=>!patient.is_born).map((patient)=>{
        const [year, month, day] = patient.estimated_due_date.split('-').map(Number);
        const dppDate = new Date(year, month - 1, day);
        const currentGA = calculateGestationalAge(dppDate);
        const age = calculateAge(patient.birth_date);
        return (<TableRow key={patient.id} data-spec-id={`patient-row-${patient.id}`}>
                                    <TableCell className="font-medium" data-spec-id="name-cell">
                                        {patient.full_name}
                                    </TableCell>
                                    <TableCell data-spec-id="age-cell">
                                        {age} anos
                                    </TableCell>
                                    <TableCell data-spec-id="phone-cell">
                                        {formatPhone(patient.phone)}
                                    </TableCell>
                                    <TableCell data-spec-id="dpp-cell">
                                        {formatDate(dppDate)}
                                    </TableCell>
                                    <TableCell data-spec-id="ga-cell">
                                        {currentGA.weeks}s{currentGA.days}d
                                    </TableCell>
                                    <TableCell data-spec-id="delivery-type-cell">
                                        <Badge variant="outline" data-spec-id="delivery-badge">
                                            {getDeliveryTypeLabel(patient.preferred_delivery_type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell data-spec-id="obstetrician-cell">
                                        {patient.obstetrician?.full_name || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="nurse-cell">
                                        {patient.obstetric_nurse?.full_name || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="doula-cell">
                                        {patient.doula?.full_name || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="pediatrician-cell">
                                        {patient.pediatrician?.full_name || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="address-cell">
                                        {patient.street && patient.number ? `${patient.street}, ${patient.number}, ${patient.neighborhood}, ${patient.city}/${patient.state}` : [
            patient.neighborhood,
            patient.city,
            patient.state
        ].filter(Boolean).join(', ') || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="baby-name-cell">
                                        {patient.baby_name || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="partner-cell">
                                        {patient.partner_name || '-'}
                                    </TableCell>
                                    <TableCell data-spec-id="birth-prep-cell">
                                        {getServiceStatus(patient.birth_preparation_course)}
                                    </TableCell>
                                    <TableCell data-spec-id="newborn-care-cell">
                                        {getServiceStatus(patient.newborn_care_course)}
                                    </TableCell>
                                    <TableCell data-spec-id="breastfeeding-cell">
                                        {getServiceStatus(patient.breastfeeding_workshop)}
                                    </TableCell>
                                    <TableCell data-spec-id="nutrition-cell">
                                        {getServiceStatus(patient.nutritional_monitoring)}
                                    </TableCell>
                                    <TableCell data-spec-id="physiotherapy-cell">
                                        {getServiceStatus(patient.pelvic_physiotherapy)}
                                    </TableCell>
                                    <TableCell data-spec-id="pediatric-consult-cell">
                                        {getServiceStatus(patient.pediatric_consultation)}
                                    </TableCell>
                                    <TableCell data-spec-id="actions-cell">
                                        <div className="flex gap-1" data-spec-id="action-buttons">
                                            {}
                                            {isObstetricNurse && onAssignObstetricNurse && patient.preferred_delivery_type === 'normal' && !patient.obstetric_nurse_id && !user?.has_admin_power && (<Button variant="outline" size="sm" onClick={()=>onAssignObstetricNurse(patient)} disabled={isAssigningNurse} className="text-green-600" data-spec-id="assign-nurse-button">
                                                    <UserPlus className="h-3 w-3" data-spec-id="assign-nurse-icon"/>
                                                </Button>)}
                                            {}
                                            {isObstetricNurse && onUnassignObstetricNurse && patient.preferred_delivery_type === 'normal' && patient.obstetric_nurse_id === user?.id && !user?.has_admin_power && (<Button variant="outline" size="sm" onClick={()=>onUnassignObstetricNurse(patient)} disabled={isUnassigningNurse} className="text-red-600" data-spec-id="unassign-nurse-button">
                                                    <UserMinus className="h-3 w-3" data-spec-id="unassign-nurse-icon"/>
                                                </Button>)}
                                            {}
                                            {isObstetricNurse && user?.has_admin_power && onEdit && (<Button variant="outline" size="sm" onClick={()=>onEdit(patient)} className="text-orange-600" data-spec-id="admin-nurse-edit-button">
                                                    <Edit className="h-3 w-3" data-spec-id="admin-nurse-edit-icon"/>
                                                </Button>)}
                                            {onEdit && !isObstetricNurse && !isLactationConsultant && (<Button variant="outline" size="sm" onClick={()=>onEdit(patient)} data-spec-id="edit-button">
                                                    <Edit className="h-3 w-3" data-spec-id="edit-icon"/>
                                                </Button>)}
                                            {onRegisterBirth && !isObstetricNurse && !isLactationConsultant && !isSDR && canRegisterBirthForPatient && canRegisterBirthForPatient(patient) && (<Button variant="outline" size="sm" onClick={()=>onRegisterBirth(patient)} className="text-blue-600" data-spec-id="birth-button">
                                                    <Baby className="h-3 w-3" data-spec-id="birth-icon"/>
                                                </Button>)}
                                            {onDelete && canDeletePatient && (<Button variant="outline" size="sm" onClick={()=>onDelete(patient)} disabled={isDeleting} className="text-red-600" data-spec-id="delete-button">
                                                    <Trash2 className="h-3 w-3" data-spec-id="delete-icon"/>
                                                </Button>)}
                                        </div>
                                    </TableCell>
                                </TableRow>);
    })}
                </TableBody>
            </Table>
        </div>);
};
export default PatientsTable;
