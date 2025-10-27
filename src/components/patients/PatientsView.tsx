import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Plus, Grid, List, Download, RefreshCw, AlertCircle, Clock, AlertTriangle, Eye, SortAsc, SortDesc, ArrowUpDown, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addPDFHeader, addPDFFooter, addGenerationInfo } from '@/utils/pdfUtils';
import { formatDate } from '@/utils/dateUtils';
import { formatPhone } from '@/utils/phoneUtils';
import { usePatients, useSDREditServices } from '@/hooks/usePatients';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { calculateGestationalAge } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import PatientFilters from './PatientFilters';
import PatientCard from './PatientCard';
import PatientsTable from './PatientsTable';
import PatientDetailsModal from './PatientDetailsModal';
import EditPatientForm from './EditPatientForm';
import RemovePatientModal from './RemovePatientModal';
import ObstetricNurseEditModal from './ObstetricNurseEditModal';
import SDREditModal from './SDREditModal';
import SectionHeader from '@/components/layout/SectionHeader';
import { Patient } from '@/types/patient';
interface PatientsViewProps {
    onNewPatient?: () => void;
    onEditPatient?: (patient: Patient) => void;
    onRegisterBirth?: (patient: Patient) => void;
}
const PatientsView: React.FC<PatientsViewProps> = ({ onNewPatient, onEditPatient, onRegisterBirth })=>{
    const [filters, setFilters] = useState({
        search: '',
        status: 'ativas' as 'todas' | 'ativas' | 'nascidos',
        obstetrician: [] as string[],
        deliveryType: [] as string[],
        obstetricNurse: [] as string[],
        doula: [] as string[],
        dueDateFrom: undefined as string | undefined,
        dueDateTo: undefined as string | undefined
    });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'name_asc' | 'name_desc' | 'ga_asc' | 'ga_desc' | 'registration_asc' | 'registration_desc'>('name_asc');
    const [gestationalAgeFilter, setGestationalAgeFilter] = useState<'all' | '34-37' | '37+' | 'normal-no-prof'>('all');
    const isMobile = useIsMobile();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [patientToRemove, setPatientToRemove] = useState<Patient | null>(null);
    const [isObstetricNurseEditModalOpen, setIsObstetricNurseEditModalOpen] = useState(false);
    const [patientForNurseEdit, setPatientForNurseEdit] = useState<Patient | null>(null);
    const [isSDREditModalOpen, setIsSDREditModalOpen] = useState(false);
    const [patientForSDREdit, setPatientForSDREdit] = useState<Patient | null>(null);
    const { patients, isLoading, error, refetch, deletePatient, isDeleting, assignObstetricNurse, isAssigningNurse, unassignObstetricNurse, isUnassigningNurse, assignDoula, isAssigningDoula, unassignDoula, isUnassigningDoula } = usePatients(filters);
    const { user } = useAuth();
    const { canRegisterBirth, canRegisterAnyBirth, canViewCommercialFields } = useUserPermissions();
    const sdrEditServices = useSDREditServices();
    React.useEffect(()=>{
        console.log('PatientsView - Filtros atuais:', filters);
    }, [
        filters
    ]);
    const handleClearFilters = ()=>{
        setFilters({
            search: '',
            status: 'ativas',
            obstetrician: [],
            deliveryType: [],
            obstetricNurse: [],
            doula: [],
            dueDateFrom: undefined,
            dueDateTo: undefined
        });
        setGestationalAgeFilter('all');
        setSortOrder('name_asc');
    };
    const handleDeletePatient = (patient: Patient)=>{
        setPatientToRemove(patient);
        setIsRemoveModalOpen(true);
    };
    const handleConfirmRemoval = (reason: string)=>{
        if (patientToRemove && user) {
            deletePatient({
                patientId: patientToRemove.id,
                userId: user.id,
                reason
            });
            setIsRemoveModalOpen(false);
            setPatientToRemove(null);
        }
    };
    const handleCancelRemoval = ()=>{
        setIsRemoveModalOpen(false);
        setPatientToRemove(null);
    };
    const handleViewDetails = (patient: Patient)=>{
        setSelectedPatient(patient);
        setIsDetailsModalOpen(true);
    };
    const handleCloseDetailsModal = ()=>{
        setIsDetailsModalOpen(false);
        setSelectedPatient(null);
    };
    const handleEditPatient = (patient: Patient)=>{
        console.log('Editar paciente:', patient);
        if (user?.role === 'enfermeira_obstetrica' && user?.has_admin_power) {
            setPatientForNurseEdit(patient);
            setIsObstetricNurseEditModalOpen(true);
            setIsDetailsModalOpen(false);
            return;
        }
        if (user?.role === 'sdr') {
            setPatientForSDREdit(patient);
            setIsSDREditModalOpen(true);
            setIsDetailsModalOpen(false);
            return;
        }
        setPatientToEdit(patient);
        setIsEditing(true);
        setIsDetailsModalOpen(false);
    };
    const handleCancelEdit = ()=>{
        setIsEditing(false);
        setSelectedPatient(patientToEdit);
        setIsDetailsModalOpen(true);
        setPatientToEdit(null);
    };
    const handleEditSuccess = ()=>{
        setIsEditing(false);
        setPatientToEdit(null);
        refetch();
    };
    const handleSDRSaveServices = (patientId: string, services: any, userId: string)=>{
        sdrEditServices.mutate({
            patientId,
            services,
            userId
        }, {
            onSuccess: ()=>{
                setIsSDREditModalOpen(false);
                setPatientForSDREdit(null);
            }
        });
    };
    const handleCloseSDRModal = ()=>{
        setIsSDREditModalOpen(false);
        setPatientForSDREdit(null);
    };
    const handleAssignObstetricNurse = (patient: Patient)=>{
        if (user?.id) {
            assignObstetricNurse({
                patientId: patient.id,
                nurseId: user.id,
                userId: user.id
            });
        }
    };
    const handleUnassignObstetricNurse = (patient: Patient)=>{
        if (user?.id && patient.obstetric_nurse_id) {
            unassignObstetricNurse({
                patientId: patient.id,
                currentNurseId: patient.obstetric_nurse_id,
                userId: user.id
            });
        }
    };
    const handleAssignDoula = (patient: Patient)=>{
        if (user?.id) {
            assignDoula({
                patientId: patient.id,
                doulaId: user.id,
                userId: user.id
            });
        }
    };
    const handleUnassignDoula = (patient: Patient)=>{
        if (user?.id && patient.doula_id) {
            unassignDoula({
                patientId: patient.id,
                currentDoulaId: patient.doula_id,
                userId: user.id
            });
        }
    };
    const canRegisterBirthForPatient = (patient: Patient)=>{
        if (!canRegisterBirth) return false;
        if (canRegisterAnyBirth) return true;
        return patient.obstetrician_id === user?.id;
    };
    const handleView34To37Weeks = ()=>{
        handleClearFilters();
        setFilters((prev)=>({
                ...prev,
                status: 'ativas'
            }));
        setGestationalAgeFilter('34-37');
    };
    const handleViewOver37Weeks = ()=>{
        handleClearFilters();
        setFilters((prev)=>({
                ...prev,
                status: 'ativas'
            }));
        setGestationalAgeFilter('37+');
    };
    const handleViewNormalWithoutProfessionals = ()=>{
        handleClearFilters();
        setFilters((prev)=>({
                ...prev,
                status: 'ativas'
            }));
        setGestationalAgeFilter('normal-no-prof');
    };
    const calculateCurrentGA = (dppDate: string)=>{
        const [year, month, day] = dppDate.split('-').map(Number);
        const dpp = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = dpp.getTime() - today.getTime();
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        const currentWeeks = 40 - diffWeeks;
        return Math.max(0, currentWeeks);
    };
    const calculatePreciseGA = (dppDate: string)=>{
        const [year, month, day] = dppDate.split('-').map(Number);
        const safeDppDate = new Date(year, month - 1, day);
        const ga = calculateGestationalAge(safeDppDate);
        return ga.weeks + (ga.days / 7);
    };
    const getFilteredAndSortedPatients = ()=>{
        let filteredPatients = [
            ...patients
        ];
        if (user?.role === 'enfermeira_obstetrica' || user?.role === 'doula') {
            filteredPatients = filteredPatients.filter((p)=>p.preferred_delivery_type === 'normal' || p.preferred_delivery_type === 'nao_definido');
        }
        if (user?.role === 'consultora_amamentacao') {
            filteredPatients = filteredPatients.filter((p)=>p.breastfeeding_workshop === 'contratado');
        }
        if (gestationalAgeFilter === '34-37') {
            filteredPatients = filteredPatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                const minWeeks = user?.role === 'consultora_amamentacao' ? 32 : 34;
                return preciseGA >= minWeeks && preciseGA < 37;
            });
        } else if (gestationalAgeFilter === '37+') {
            filteredPatients = filteredPatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 37;
            });
        } else if (gestationalAgeFilter === 'normal-no-prof') {
            filteredPatients = filteredPatients.filter((p)=>p.preferred_delivery_type === 'normal' && (!p.obstetric_nurse_id || !p.doula_id));
        }
        filteredPatients.sort((a, b)=>{
            switch(sortOrder){
                case 'name_asc':
                    return a.full_name.localeCompare(b.full_name);
                case 'name_desc':
                    return b.full_name.localeCompare(a.full_name);
                case 'ga_asc':
                    return calculateCurrentGA(a.estimated_due_date) - calculateCurrentGA(b.estimated_due_date);
                case 'ga_desc':
                    return calculateCurrentGA(b.estimated_due_date) - calculateCurrentGA(a.estimated_due_date);
                case 'registration_asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'registration_desc':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                default:
                    return 0;
            }
        });
        return filteredPatients;
    };
    const getStatsData = ()=>{
        const isObstetricNurse = user?.role === 'enfermeira_obstetrica';
        const isDoula = user?.role === 'doula';
        if (isObstetricNurse) {
            const activePatients = patients.filter((p)=>!p.is_born && (p.preferred_delivery_type === 'normal' || p.preferred_delivery_type === 'nao_definido'));
            const active = activePatients.length;
            const between34And37Weeks = activePatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 34 && preciseGA < 37;
            }).length;
            const over37Weeks = activePatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 37;
            }).length;
            const normalWithoutObstetricNurse = activePatients.filter((p)=>p.preferred_delivery_type === 'normal' && !p.obstetric_nurse_id).length;
            const myPatients = activePatients.filter((p)=>p.obstetric_nurse_id === user?.id).length;
            return {
                active,
                between34And37Weeks,
                over37Weeks,
                normalWithoutProfessionals: normalWithoutObstetricNurse,
                myPatients
            };
        } else if (isDoula) {
            const activePatients = patients.filter((p)=>!p.is_born && (p.preferred_delivery_type === 'normal' || p.preferred_delivery_type === 'nao_definido'));
            const active = activePatients.length;
            const between34And37Weeks = activePatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 34 && preciseGA < 37;
            }).length;
            const over37Weeks = activePatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 37;
            }).length;
            const normalWithoutDoula = activePatients.filter((p)=>p.preferred_delivery_type === 'normal' && !p.doula_id).length;
            const myPatients = activePatients.filter((p)=>p.doula_id === user?.id).length;
            return {
                active,
                between34And37Weeks,
                over37Weeks,
                normalWithoutProfessionals: normalWithoutDoula,
                myPatients
            };
        } else if (user?.role === 'consultora_amamentacao') {
            const consultancyPatients = patients.filter((p)=>!p.is_born && p.breastfeeding_workshop === 'contratado');
            const active = consultancyPatients.length;
            const between32And37Weeks = consultancyPatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 32 && preciseGA < 37;
            }).length;
            const over37Weeks = consultancyPatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 37;
            }).length;
            return {
                active,
                between34And37Weeks: between32And37Weeks,
                over37Weeks,
                normalWithoutProfessionals: 0
            };
        } else {
            const activePatients = patients.filter((p)=>!p.is_born);
            const active = activePatients.length;
            const between34And37Weeks = activePatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 34 && preciseGA < 37;
            }).length;
            const over37Weeks = activePatients.filter((p)=>{
                const preciseGA = calculatePreciseGA(p.estimated_due_date);
                return preciseGA >= 37;
            }).length;
            const normalWithoutProfessionals = activePatients.filter((p)=>p.preferred_delivery_type === 'normal' && (!p.obstetric_nurse_id || !p.doula_id)).length;
            return {
                active,
                between34And37Weeks,
                over37Weeks,
                normalWithoutProfessionals
            };
        }
    };
    const stats = getStatsData();
    const displayedPatients = getFilteredAndSortedPatients();
    const canExport = user?.role === 'sdr' || user?.role === 'obstetra' || user?.role === 'administrativo' || user?.is_admin;
    const getDeliveryTypeLabel = (type: string)=>{
        const labels = {
            'normal': 'Normal',
            'cesariana': 'Cesariana',
            'nao_definido': 'Não Definido'
        };
        return labels[type as keyof typeof labels] || type;
    };
    const getExtraServices = (patient: any)=>{
        const services = [];
        if (patient.birth_preparation_course === 'contratado') services.push('Prep. Parto');
        if (patient.newborn_care_course === 'contratado') services.push('Cuidados RN');
        if (patient.pelvic_physiotherapy === 'contratado') services.push('Fisiot. Pélvica');
        if (patient.breastfeeding_workshop === 'contratado') services.push('Workshop Amamentação');
        if (patient.pediatric_consultation === 'contratado') services.push('Consulta Pediátrica');
        if (patient.nutritional_monitoring === 'contratado') services.push('Acompanhamento Nutricional');
        return services.length > 0 ? services.join(', ') : '-';
    };
    const exportToPDF = async ()=>{
        console.log('Iniciando exportação PDF...');
        console.log('Dados filtrados:', displayedPatients);
        console.log('Quantidade de pacientes:', displayedPatients?.length || 0);
        try {
            if (!displayedPatients || displayedPatients.length === 0) {
                console.warn('Nenhum dado para exportar');
                alert('Nenhum dado para exportar!');
                return;
            }
            console.log('Criando documento PDF...');
            const doc = new jsPDF('l', 'pt', 'a4');
            console.log('Adicionando cabeçalho com logomarca...');
            const headerEndY = await addPDFHeader(doc, 'Gestantes');
            console.log('Adicionando informações de geração...');
            const activeFilters = [];
            if (filters.search) activeFilters.push(`Busca: ${filters.search}`);
            if (filters.status !== 'ativas') activeFilters.push(`Status: ${filters.status}`);
            if (filters.deliveryType.length > 0) activeFilters.push(`Via Parto: ${filters.deliveryType.join(', ')}`);
            if (filters.dueDateFrom || filters.dueDateTo) {
                const dateRange = `${filters.dueDateFrom || 'início'} até ${filters.dueDateTo || 'fim'}`;
                activeFilters.push(`Período DPP: ${dateRange}`);
            }
            const tableStartY = addGenerationInfo(doc, headerEndY, activeFilters.length > 0 ? activeFilters : undefined);
            console.log('Preparando headers...');
            const headers = [
                'Nome',
                'Idade',
                'Telefone',
                'CEP',
                'DPP',
                'IG Atual',
                'Via Parto',
                'Nome Bebê',
                'Obstetra',
                'Enf. Obstétrica',
                'Doula',
                'Serviços Extras',
                'Obs. Gestação'
            ];
            if (canViewCommercialFields) {
                headers.push('Condições Comerciais', 'Registros de Pagamento');
            }
            console.log('Preparando dados...');
            const data = displayedPatients.map((patient, index)=>{
                console.log(`Processando paciente ${index + 1}:`, patient.full_name);
                try {
                    const currentGA = calculateGestationalAge(new Date(patient.estimated_due_date));
                    const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear();
                    const rowData = [
                        patient.full_name || '-',
                        `${age} anos`,
                        formatPhone(patient.phone) || '-',
                        patient.zip_code || '-',
                        formatDate(new Date(patient.estimated_due_date)),
                        `${currentGA.weeks}s${currentGA.days}d`,
                        getDeliveryTypeLabel(patient.preferred_delivery_type),
                        patient.baby_name || '-',
                        patient.obstetrician?.full_name || '-',
                        patient.obstetric_nurse?.full_name || '-',
                        patient.doula?.full_name || '-',
                        getExtraServices(patient),
                        patient.gestational_observations || '-'
                    ];
                    if (canViewCommercialFields) {
                        rowData.push(patient.commercial_conditions || '-', patient.payment_records || '-');
                    }
                    return rowData;
                } catch (rowError) {
                    console.error(`Erro ao processar paciente ${patient.full_name}:`, rowError);
                    const errorRow = [
                        patient.full_name || '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-'
                    ];
                    if (canViewCommercialFields) {
                        errorRow.push('-', '-');
                    }
                    return errorRow;
                }
            });
            console.log('Dados preparados:', data);
            console.log('Gerando tabela PDF...');
            autoTable(doc, {
                head: [
                    headers
                ],
                body: data,
                startY: tableStartY,
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [
                        100,
                        100,
                        100
                    ]
                },
                columnStyles: {
                    0: {
                        cellWidth: 60
                    },
                    1: {
                        cellWidth: 35
                    },
                    2: {
                        cellWidth: 55
                    },
                    3: {
                        cellWidth: 45
                    },
                    4: {
                        cellWidth: 45
                    },
                    5: {
                        cellWidth: 35
                    },
                    6: {
                        cellWidth: 45
                    },
                    7: {
                        cellWidth: 50
                    },
                    8: {
                        cellWidth: 60
                    },
                    9: {
                        cellWidth: 60
                    },
                    10: {
                        cellWidth: 50
                    },
                    11: {
                        cellWidth: 70
                    },
                    12: {
                        cellWidth: 70
                    },
                    ...(canViewCommercialFields && {
                        13: {
                            cellWidth: 80
                        },
                        14: {
                            cellWidth: 80
                        }
                    })
                },
                margin: {
                    top: tableStartY,
                    left: 40,
                    right: 40,
                    bottom: 100
                }
            });
            console.log('Adicionando rodapé...');
            addPDFFooter(doc, user?.name || user?.full_name || 'Usuário');
            console.log('Salvando arquivo...');
            doc.save('gestantes.pdf');
            console.log('PDF exportado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao exportar PDF:', error);
            alert(`Erro ao exportar PDF: ${error.message}`);
        }
    };
    const exportToExcel = ()=>{
        console.log('Iniciando exportação Excel...');
        console.log('Dados para Excel:', displayedPatients);
        try {
            if (!displayedPatients || displayedPatients.length === 0) {
                console.warn('Nenhum dado para exportar');
                alert('Nenhum dado para exportar!');
                return;
            }
            console.log('Preparando dados do Excel...');
            const data = displayedPatients.map((patient, index)=>{
                console.log(`Processando paciente ${index + 1} para Excel:`, patient.full_name);
                try {
                    const currentGA = calculateGestationalAge(new Date(patient.estimated_due_date));
                    const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear();
                    const rowData = {
                        'Nome Completo': patient.full_name,
                        'Data de Nascimento': formatDate(new Date(patient.birth_date)),
                        'Idade': `${age} anos`,
                        'Telefone': formatPhone(patient.phone) || '-',
                        'CEP': patient.zip_code || '-',
                        'Endereço': `${patient.street || ''}${patient.number ? `, ${patient.number}` : ''}`,
                        'Bairro': patient.neighborhood || '-',
                        'Cidade': patient.city || '-',
                        'Estado': patient.state || '-',
                        'Data Provável do Parto': formatDate(new Date(patient.estimated_due_date)),
                        'Idade Gestacional Atual': `${currentGA.weeks}s${currentGA.days}d`,
                        'Via de Parto Preferida': getDeliveryTypeLabel(patient.preferred_delivery_type),
                        'Nome do Bebê': patient.baby_name || '-',
                        'Nome do Companheiro': patient.partner_name || '-',
                        'Data de Cadastro': formatDate(new Date(patient.created_at)),
                        'Obstetra Responsável': patient.obstetrician?.full_name || '-',
                        'Enfermeira Obstétrica': patient.obstetric_nurse?.full_name || '-',
                        'Doula': patient.doula?.full_name || '-',
                        'Pediatra': patient.pediatrician?.full_name || '-',
                        'Nutricionista': patient.nutritionist?.full_name || '-',
                        'Consultora Amamentação': patient.lactation_consultant?.full_name || '-',
                        'Fisioterapeuta Pélvica': patient.pelvic_physiotherapist?.full_name || '-',
                        'Serviços Contratados': getExtraServices(patient),
                        'Observações Gestação': patient.gestational_observations || '-'
                    };
                    if (canViewCommercialFields) {
                        rowData['Condições Comerciais'] = patient.commercial_conditions || '-';
                        rowData['Registros de Pagamento'] = patient.payment_records || '-';
                    }
                    return rowData;
                } catch (rowError) {
                    console.error(`Erro ao processar paciente ${patient.full_name} para Excel:`, rowError);
                    const errorData = {
                        'Nome Completo': patient.full_name || '-',
                        'Data de Nascimento': '-',
                        'Idade': '-',
                        'Telefone': '-',
                        'CEP': '-',
                        'Endereço': '-',
                        'Bairro': '-',
                        'Cidade': '-',
                        'Estado': '-',
                        'Data Provável do Parto': '-',
                        'Idade Gestacional Atual': '-',
                        'Via de Parto Preferida': '-',
                        'Nome do Bebê': '-',
                        'Nome do Companheiro': '-',
                        'Data de Cadastro': '-',
                        'Obstetra Responsável': '-',
                        'Enfermeira Obstétrica': '-',
                        'Doula': '-',
                        'Pediatra': '-',
                        'Nutricionista': '-',
                        'Consultora Amamentação': '-',
                        'Fisioterapeuta Pélvica': '-',
                        'Serviços Contratados': '-',
                        'Observações Gestação': '-'
                    };
                    if (canViewCommercialFields) {
                        errorData['Condições Comerciais'] = '-';
                        errorData['Registros de Pagamento'] = '-';
                    }
                    return errorData;
                }
            });
            console.log('Dados do Excel preparados:', data);
            console.log('Criando planilha...');
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Gestantes');
            console.log('Salvando arquivo Excel...');
            XLSX.writeFile(wb, `gestantes_${new Date().toISOString().split('T')[0]}.xlsx`);
            console.log('Excel exportado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao exportar Excel:', error);
            alert(`Erro ao exportar Excel: ${error.message}`);
        }
    };
    return (<div className="space-y-6" data-spec-id="patients-view">
      {}
      <SectionHeader title="Gestantes" subtitle={user?.role === 'enfermeira_obstetrica' ? 'Confira as gestantes ativas na equipe.' : user?.role === 'doula' ? 'Acompanhe as gestantes com parto normal.' : user?.role === 'consultora_amamentacao' ? 'Acompanhe as gestantes com consultoria de amamentação.' : 'Gerencie todas as pacientes do sistema'} data-spec-id="patients-header">
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : 'justify-end space-x-2'}`} data-spec-id="header-actions">
          <Button variant="outline" onClick={()=>refetch()} disabled={isLoading} size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""} data-spec-id="refresh-button">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} data-spec-id="refresh-icon"/>
            Atualizar
          </Button>
          
          {onNewPatient && user?.role !== 'enfermeira_obstetrica' && user?.role !== 'doula' && user?.role !== 'consultora_amamentacao' && user?.role !== 'sdr' && (<Button onClick={onNewPatient} size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""} data-spec-id="new-patient-button">
              <Plus className="h-4 w-4 mr-2" data-spec-id="plus-icon"/>
              Nova Paciente
            </Button>)}
        </div>
      </SectionHeader>

      {}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : `grid-cols-1 md:grid-cols-2 ${(user?.role === 'enfermeira_obstetrica' || user?.role === 'doula') ? 'lg:grid-cols-5' : user?.role === 'consultora_amamentacao' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}`} data-spec-id="stats-cards">
        <Card data-spec-id="active-stats-card">
          <CardContent className="p-4" data-spec-id="active-stats-content">
            <div className="flex items-center justify-between mb-3" data-spec-id="active-stats-row">
              <div data-spec-id="active-stats-info">
                <p className="text-sm font-medium text-gray-600" data-spec-id="active-label">
                  {user?.role === 'enfermeira_obstetrica' ? 'Parto Normal/Não Def.' : user?.role === 'doula' ? 'Parto Normal/Não Def.' : 'Gestantes Ativas'}
                </p>
                <p className="text-2xl font-bold text-green-600" data-spec-id="active-count">
                  {stats.active}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center" data-spec-id="active-icon-container">
                <Users className="h-4 w-4 text-green-600" data-spec-id="active-icon"/>
              </div>
            </div>
            <Button variant={gestationalAgeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={handleClearFilters} className="w-full text-xs" data-spec-id="view-all-active-button">
              <Eye className="h-3 w-3 mr-1" data-spec-id="view-all-active-icon"/>
              Ver
            </Button>
          </CardContent>
        </Card>

        <Card data-spec-id="between-34-37-weeks-card">
          <CardContent className="p-4" data-spec-id="between-34-37-weeks-content">
            <div className="flex items-center justify-between mb-3" data-spec-id="between-34-37-weeks-row">
              <div data-spec-id="between-34-37-weeks-info">
                <p className="text-sm font-medium text-gray-600" data-spec-id="between-34-37-weeks-label">
                  {user?.role === 'consultora_amamentacao' ? '32-36 Semanas' : '34-36 Semanas'}
                </p>
                <p className="text-2xl font-bold text-yellow-600" data-spec-id="between-34-37-weeks-count">
                  {stats.between34And37Weeks}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center" data-spec-id="between-34-37-weeks-icon-container">
                <Clock className="h-4 w-4 text-yellow-600" data-spec-id="between-34-37-weeks-icon"/>
              </div>
            </div>
            <Button variant={gestationalAgeFilter === '34-37' ? 'default' : 'outline'} size="sm" onClick={handleView34To37Weeks} className="w-full text-xs" data-spec-id="view-34-37-weeks-button">
              <Eye className="h-3 w-3 mr-1" data-spec-id="view-34-37-weeks-icon"/>
              Ver
            </Button>
          </CardContent>
        </Card>

        <Card data-spec-id="over-37-weeks-card">
          <CardContent className="p-4" data-spec-id="over-37-weeks-content">
            <div className="flex items-center justify-between mb-3" data-spec-id="over-37-weeks-row">
              <div data-spec-id="over-37-weeks-info">
                <p className="text-sm font-medium text-gray-600" data-spec-id="over-37-weeks-label">
                  37+ Semanas
                </p>
                <p className="text-2xl font-bold text-orange-600" data-spec-id="over-37-weeks-count">
                  {stats.over37Weeks}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center" data-spec-id="over-37-weeks-icon-container">
                <AlertCircle className="h-4 w-4 text-orange-600" data-spec-id="over-37-weeks-icon"/>
              </div>
            </div>
            <Button variant={gestationalAgeFilter === '37+' ? 'default' : 'outline'} size="sm" onClick={handleViewOver37Weeks} className="w-full text-xs" data-spec-id="view-over-37-weeks-button">
              <Eye className="h-3 w-3 mr-1" data-spec-id="view-over-37-weeks-icon"/>
              Ver
            </Button>
          </CardContent>
        </Card>

        {user?.role !== 'consultora_amamentacao' && (<Card data-spec-id="normal-without-professionals-card">
            <CardContent className="p-4" data-spec-id="normal-without-professionals-content">
              <div className="flex items-center justify-between mb-3" data-spec-id="normal-without-professionals-row">
                <div data-spec-id="normal-without-professionals-info">
                  <p className="text-sm font-medium text-gray-600" data-spec-id="normal-without-professionals-label">
                    {user?.role === 'enfermeira_obstetrica' ? 'Normal s/ EO Atribuída' : user?.role === 'doula' ? 'Normal s/ Doula Atribuída' : 'Normal s/ Profissional'}
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-spec-id="normal-without-professionals-count">
                    {stats.normalWithoutProfessionals}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center" data-spec-id="normal-without-professionals-icon-container">
                  <AlertTriangle className="h-4 w-4 text-red-600" data-spec-id="normal-without-professionals-icon"/>
                </div>
              </div>
              <Button variant={gestationalAgeFilter === 'normal-no-prof' ? 'default' : 'outline'} size="sm" onClick={handleViewNormalWithoutProfessionals} className="w-full text-xs" data-spec-id="view-normal-without-professionals-button">
                <Eye className="h-3 w-3 mr-1" data-spec-id="view-normal-without-professionals-icon"/>
                Ver
              </Button>
            </CardContent>
          </Card>)}

        {}
        {(user?.role === 'enfermeira_obstetrica' || user?.role === 'doula') && (<Card data-spec-id="my-patients-card">
            <CardContent className="p-4" data-spec-id="my-patients-content">
              <div className="flex items-center justify-between mb-3" data-spec-id="my-patients-row">
                <div data-spec-id="my-patients-info">
                  <p className="text-sm font-medium text-gray-600" data-spec-id="my-patients-label">
                    Sob Minha Responsabilidade
                  </p>
                  <p className="text-2xl font-bold text-blue-600" data-spec-id="my-patients-count">
                    {stats.myPatients || 0}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center" data-spec-id="my-patients-icon-container">
                  <Users className="h-4 w-4 text-blue-600" data-spec-id="my-patients-icon"/>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={()=>{
        handleClearFilters();
        setFilters((prev)=>({
                ...prev,
                status: 'ativas',
                ...(user?.role === 'enfermeira_obstetrica' ? {
                    obstetricNurse: [
                        user?.id || ''
                    ]
                } : {}),
                ...(user?.role === 'doula' ? {
                    doula: [
                        user?.id || ''
                    ]
                } : {})
            }));
    }} className="w-full text-xs" data-spec-id="view-my-patients-button">
                <Eye className="h-3 w-3 mr-1" data-spec-id="view-my-patients-icon"/>
                Ver
              </Button>
            </CardContent>
          </Card>)}
      </div>

      {}
      <PatientFilters filters={filters} onFiltersChange={setFilters} onClearFilters={handleClearFilters} data-spec-id="patient-filters"/>

      {}
      {canExport && (<Card data-spec-id="export-card">
          <CardContent className="p-4" data-spec-id="export-content">
            <div className="flex gap-2 justify-center" data-spec-id="export-buttons">
              <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!displayedPatients || displayedPatients.length === 0} data-spec-id="export-pdf-button">
                <Download className="h-4 w-4 mr-2" data-spec-id="pdf-icon"/>
                Exportar PDF
              </Button>

              <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!displayedPatients || displayedPatients.length === 0} data-spec-id="export-excel-button">
                <FileSpreadsheet className="h-4 w-4 mr-2" data-spec-id="excel-icon"/>
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>)}

      {}
      <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`} data-spec-id="view-controls">
        <div className="flex items-center space-x-2" data-spec-id="view-mode-toggle">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size={isMobile ? "xs" : "sm"} onClick={()=>setViewMode('grid')} data-spec-id="grid-view-button">
            <Grid className="h-4 w-4 mr-1" data-spec-id="grid-icon"/>
            {isMobile ? '' : 'Grade'}
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size={isMobile ? "xs" : "sm"} onClick={()=>setViewMode('list')} data-spec-id="list-view-button">
            <List className="h-4 w-4 mr-1" data-spec-id="list-icon"/>
            {isMobile ? '' : 'Lista'}
          </Button>
          
          {isMobile && (<Badge variant="secondary" className="ml-2" data-spec-id="mobile-results-count">
              {displayedPatients.length}
            </Badge>)}
        </div>

        <div className={`flex items-center ${isMobile ? 'justify-center' : 'space-x-2'}`} data-spec-id="controls-right">
          <DropdownMenu data-spec-id="sort-dropdown">
            <DropdownMenuTrigger className={`flex items-center justify-center rounded-md border border-input bg-background text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isMobile ? 'px-2 py-1' : 'px-3 py-2'}`} onClick={()=>console.log('DropdownMenu trigger clicado')} data-spec-id="sort-trigger">
              <ArrowUpDown className="h-4 w-4 mr-1" data-spec-id="sort-icon"/>
              {isMobile ? '' : 'Ordenar'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-spec-id="sort-content">
              <DropdownMenuItem onClick={()=>{
        console.log('Ordenação clicada: name_asc');
        setSortOrder('name_asc');
    }} data-spec-id="sort-name-asc">
                <SortAsc className="h-4 w-4 mr-2" data-spec-id="sort-asc-icon"/>
                Nome (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setSortOrder('name_desc')} data-spec-id="sort-name-desc">
                <SortDesc className="h-4 w-4 mr-2" data-spec-id="sort-desc-icon"/>
                Nome (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setSortOrder('ga_asc')} data-spec-id="sort-ga-asc">
                <SortAsc className="h-4 w-4 mr-2" data-spec-id="sort-ga-asc-icon"/>
                IG (Menor-Maior)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setSortOrder('ga_desc')} data-spec-id="sort-ga-desc">
                <SortDesc className="h-4 w-4 mr-2" data-spec-id="sort-ga-desc-icon"/>
                IG (Maior-Menor)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setSortOrder('registration_asc')} data-spec-id="sort-registration-asc">
                <SortAsc className="h-4 w-4 mr-2" data-spec-id="sort-registration-asc-icon"/>
                Data Cadastro (Mais Antigo)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setSortOrder('registration_desc')} data-spec-id="sort-registration-desc">
                <SortDesc className="h-4 w-4 mr-2" data-spec-id="sort-registration-desc-icon"/>
                Data Cadastro (Mais Recente)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isMobile && (<Badge variant="secondary" data-spec-id="results-count">
              {displayedPatients.length} resultado(s)
            </Badge>)}
        </div>
      </div>

      {}
      {error && (<Alert variant="destructive" data-spec-id="error-alert">
          <AlertCircle className="h-4 w-4" data-spec-id="error-icon"/>
          <AlertDescription data-spec-id="error-message">
            Erro ao carregar pacientes: {error.message}
          </AlertDescription>
        </Alert>)}

      {}
      {isLoading && (<div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`} data-spec-id="loading-skeleton">
          {Array.from({
        length: 6
    }).map((_, index)=>(<Card key={index} data-spec-id={`skeleton-card-${index}`}>
              <CardHeader data-spec-id={`skeleton-header-${index}`}>
                <Skeleton className="h-6 w-3/4" data-spec-id={`skeleton-title-${index}`}/>
                <Skeleton className="h-4 w-1/2" data-spec-id={`skeleton-subtitle-${index}`}/>
              </CardHeader>
              <CardContent data-spec-id={`skeleton-content-${index}`}>
                <div className="space-y-2" data-spec-id={`skeleton-lines-${index}`}>
                  <Skeleton className="h-4 w-full" data-spec-id={`skeleton-line-1-${index}`}/>
                  <Skeleton className="h-4 w-2/3" data-spec-id={`skeleton-line-2-${index}`}/>
                  <Skeleton className="h-4 w-1/2" data-spec-id={`skeleton-line-3-${index}`}/>
                </div>
              </CardContent>
            </Card>))}
        </div>)}

      {}
      {!isLoading && !error && (<>
          {displayedPatients.length === 0 ? (<Card data-spec-id="empty-state-card">
              <CardContent className="text-center py-12" data-spec-id="empty-state-content">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" data-spec-id="empty-state-icon"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="empty-state-title">
                  Nenhuma paciente encontrada
                </h3>
                <p className="text-gray-600 mb-4" data-spec-id="empty-state-description">
                  {Object.values(filters).some((v)=>v && v !== 'todas') || gestationalAgeFilter !== 'all' ? 'Tente ajustar os filtros para encontrar pacientes.' : 'Comece cadastrando sua primeira paciente no sistema.'}
                </p>
                {onNewPatient && (<Button onClick={onNewPatient} data-spec-id="empty-state-action">
                    <Plus className="h-4 w-4 mr-2" data-spec-id="empty-action-icon"/>
                    Cadastrar Primeira Paciente
                  </Button>)}
              </CardContent>
            </Card>) : (viewMode === 'list' ? (<PatientsTable patients={displayedPatients} onEdit={handleEditPatient} onDelete={handleDeletePatient} onRegisterBirth={onRegisterBirth} canRegisterBirthForPatient={canRegisterBirthForPatient} isDeleting={isDeleting} onAssignObstetricNurse={handleAssignObstetricNurse} onUnassignObstetricNurse={handleUnassignObstetricNurse} isAssigningNurse={isAssigningNurse} isUnassigningNurse={isUnassigningNurse} data-spec-id="patients-table-view"/>) : (<div className="grid gap-3 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3" data-spec-id="patients-grid">
                  {displayedPatients.map((patient)=>(<PatientCard key={patient.id} patient={patient} onEdit={handleEditPatient} onDelete={handleDeletePatient} onRegisterBirth={canRegisterBirthForPatient(patient) ? onRegisterBirth : undefined} onViewDetails={handleViewDetails} isDeleting={isDeleting} onAssignObstetricNurse={handleAssignObstetricNurse} onUnassignObstetricNurse={handleUnassignObstetricNurse} isAssigningNurse={isAssigningNurse} isUnassigningNurse={isUnassigningNurse} onAssignDoula={handleAssignDoula} onUnassignDoula={handleUnassignDoula} isAssigningDoula={isAssigningDoula} isUnassigningDoula={isUnassigningDoula} data-spec-id={`patient-card-${patient.id}`}/>))}
                </div>))}
        </>)}

      {}
      <PatientDetailsModal patient={selectedPatient} isOpen={isDetailsModalOpen} onClose={handleCloseDetailsModal} onEdit={handleEditPatient} onRegisterBirth={onRegisterBirth} data-spec-id="patient-details-modal-instance"/>

      {}
      {isEditing && patientToEdit && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-spec-id="edit-modal-overlay">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" data-spec-id="edit-modal-container">
            <div className="p-6 overflow-y-auto max-h-[90vh]" data-spec-id="edit-modal-content">
              <EditPatientForm patient={patientToEdit} onSuccess={handleEditSuccess} onCancel={handleCancelEdit} data-spec-id="edit-patient-form-instance"/>
            </div>
          </div>
        </div>)}

      {}
      <RemovePatientModal isOpen={isRemoveModalOpen} onClose={handleCancelRemoval} onConfirm={handleConfirmRemoval} patientName={patientToRemove?.full_name || ''} isLoading={isDeleting} data-spec-id="remove-patient-modal"/>

      {}
      <ObstetricNurseEditModal patient={patientForNurseEdit} isOpen={isObstetricNurseEditModalOpen} onClose={()=>{
        setIsObstetricNurseEditModalOpen(false);
        setPatientForNurseEdit(null);
    }} data-spec-id="obstetric-nurse-edit-modal-instance"/>

      {}
      <SDREditModal patient={patientForSDREdit} isOpen={isSDREditModalOpen} onClose={handleCloseSDRModal} onSave={handleSDRSaveServices} isLoading={sdrEditServices.isPending} data-spec-id="sdr-edit-modal-instance"/>
    </div>);
};
export default PatientsView;
