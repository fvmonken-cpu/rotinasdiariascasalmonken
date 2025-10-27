import React, { useState } from 'react';
import { useRemovedPatients, usePatients } from '@/hooks/usePatients';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Search, UserX, Calendar, User, Baby, Download, ArrowUpDown, FileText, FileSpreadsheet, FileImage, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { formatPhone } from '@/utils/phoneUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addPDFHeader, addPDFFooter, addGenerationInfo } from '@/utils/pdfUtils';
import PermanentDeleteModal from './PermanentDeleteModal';
interface RemovedPatientsViewProps {
    'data-spec-id'?: string;
}
type SortOption = 'name' | 'removal_date';
const RemovedPatientsView: React.FC<RemovedPatientsViewProps> = ({ 'data-spec-id': dataSpecId })=>{
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('removal_date');
    const [selectedPatientForDeletion, setSelectedPatientForDeletion] = useState<any>(null);
    const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
    const { canViewRemovedPatients, canPermanentlyDeletePatients } = useUserPermissions();
    const { user } = useAuth();
    const { data: removedPatients, isLoading, error } = useRemovedPatients();
    const { permanentlyDeletePatient, isPermanentlyDeleting } = usePatients();
    const calculateAge = (birthDate: string): number =>{
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            return age - 1;
        }
        return age;
    };
    const getGestationalAgeAtRemoval = (patient: any)=>{
        if (patient.removal_gestational_age_weeks !== null && patient.removal_gestational_age_weeks !== undefined) {
            return {
                weeks: patient.removal_gestational_age_weeks,
                days: patient.removal_gestational_age_days || 0
            };
        }
        return null;
    };
    const formatGestationalAge = (weeks: number, days: number)=>{
        return `${weeks}s${days}d`;
    };
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
    const getStatusLabel = (patient: any)=>{
        if (patient.type === 'born_patient') {
            return 'Nascida';
        }
        return patient.is_born ? 'Nascida' : 'Gestante';
    };
    const getStatusVariant = (patient: any)=>{
        if (patient.type === 'born_patient' || patient.is_born) {
            return 'default';
        }
        return 'secondary';
    };
    const filteredPatients = removedPatients?.filter((patient)=>{
        const searchLower = searchTerm.toLowerCase();
        return patient.full_name.toLowerCase().includes(searchLower) || (patient.baby_name && patient.baby_name.toLowerCase().includes(searchLower)) || (patient.removal_reason && patient.removal_reason.toLowerCase().includes(searchLower)) || (patient.removed_by_user?.full_name && patient.removed_by_user.full_name.toLowerCase().includes(searchLower)) || (patient.obstetrician?.full_name && patient.obstetrician.full_name.toLowerCase().includes(searchLower));
    }) || [];
    const sortedAndFilteredPatients = [
        ...filteredPatients
    ].sort((a, b)=>{
        if (sortBy === 'name') {
            return a.full_name.localeCompare(b.full_name);
        } else if (sortBy === 'removal_date') {
            const dateA = a.removed_at ? new Date(a.removed_at).getTime() : 0;
            const dateB = b.removed_at ? new Date(b.removed_at).getTime() : 0;
            return dateB - dateA;
        }
        return 0;
    });
    const exportToPDF = async ()=>{
        console.log('Iniciando exportação PDF...');
        console.log('Dados filtrados:', sortedAndFilteredPatients);
        console.log('Quantidade de pacientes:', sortedAndFilteredPatients.length);
        try {
            if (!sortedAndFilteredPatients || sortedAndFilteredPatients.length === 0) {
                console.warn('Nenhum dado para exportar');
                alert('Nenhum dado para exportar!');
                return;
            }
            console.log('Criando documento PDF...');
            const doc = new jsPDF('l', 'pt', 'a4');
            console.log('Adicionando cabeçalho com logomarca...');
            const headerEndY = await addPDFHeader(doc, 'Pacientes Removidas do Acompanhamento');
            console.log('Adicionando informações de geração...');
            const tableStartY = addGenerationInfo(doc, headerEndY);
            console.log('Preparando headers...');
            const headers = [
                'Nome',
                'Idade',
                'Telefone',
                'Data Cadastro',
                'IG na Remoção',
                'Bebê',
                'Status',
                'Obstetra',
                'Data Remoção',
                'Removido Por',
                'Motivo'
            ];
            console.log('Preparando dados...');
            const data = sortedAndFilteredPatients.map((patient, index)=>{
                console.log(`Processando paciente ${index + 1}:`, patient.full_name);
                try {
                    const gestationalAge = getGestationalAgeAtRemoval(patient);
                    return [
                        patient.full_name || '-',
                        `${calculateAge(patient.patient_birth_date || patient.birth_date)} anos`,
                        formatPhone(patient.phone) || '-',
                        patient.created_at ? formatDate(new Date(patient.created_at)) : '-',
                        gestationalAge ? formatGestationalAge(gestationalAge.weeks, gestationalAge.days) : '-',
                        patient.baby_name || '-',
                        getStatusLabel(patient) || '-',
                        patient.obstetrician?.full_name || '-',
                        patient.removed_at ? formatDate(new Date(patient.removed_at)) : '-',
                        patient.removed_by_user?.full_name || '-',
                        patient.removal_reason || '-'
                    ];
                } catch (rowError) {
                    console.error(`Erro ao processar paciente ${patient.full_name}:`, rowError);
                    return [
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
                        '-'
                    ];
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
                        cellWidth: 70
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
                        cellWidth: 40
                    },
                    5: {
                        cellWidth: 45
                    },
                    6: {
                        cellWidth: 40
                    },
                    7: {
                        cellWidth: 70
                    },
                    8: {
                        cellWidth: 50
                    },
                    9: {
                        cellWidth: 70
                    },
                    10: {
                        cellWidth: 90
                    }
                }
            });
            console.log('Adicionando rodapé com copyright...');
            addPDFFooter(doc);
            console.log('Salvando arquivo...');
            doc.save('pacientes-removidas.pdf');
            console.log('PDF exportado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao exportar PDF:', error);
            console.error('Stack trace:', error.stack);
            alert(`Erro ao exportar PDF: ${error.message}`);
        }
    };
    const exportToExcel = ()=>{
        console.log('Iniciando exportação Excel...');
        console.log('Dados para Excel:', sortedAndFilteredPatients);
        console.log('Quantidade de pacientes:', sortedAndFilteredPatients.length);
        try {
            if (!sortedAndFilteredPatients || sortedAndFilteredPatients.length === 0) {
                console.warn('Nenhum dado para exportar');
                alert('Nenhum dado para exportar!');
                return;
            }
            console.log('Preparando dados do Excel...');
            const data = sortedAndFilteredPatients.map((patient, index)=>{
                console.log(`Processando paciente ${index + 1} para Excel:`, patient.full_name);
                try {
                    const gestationalAge = getGestationalAgeAtRemoval(patient);
                    return {
                        'Nome Completo': patient.full_name,
                        'Idade': `${calculateAge(patient.patient_birth_date || patient.birth_date)} anos`,
                        'Data Nascimento': formatDate(new Date(patient.patient_birth_date || patient.birth_date)),
                        'Data de Cadastro': patient.created_at ? formatDate(new Date(patient.created_at)) : '-',
                        'IG na Remoção': gestationalAge ? formatGestationalAge(gestationalAge.weeks, gestationalAge.days) : '-',
                        'Telefone': patient.phone,
                        'CEP': patient.zip_code || '-',
                        'Endereço': patient.street && patient.number ? `${patient.street}, ${patient.number}, ${patient.neighborhood}, ${patient.city}/${patient.state}` : [
                            patient.neighborhood,
                            patient.city,
                            patient.state
                        ].filter(Boolean).join(', ') || '-',
                        'DPP': formatDate(new Date(patient.estimated_due_date)),
                        'Via de Parto Preferida': getDeliveryTypeLabel(patient.preferred_delivery_type),
                        'Nome do Bebê': patient.baby_name || '-',
                        'Nome do Companheiro(a)': patient.partner_name || '-',
                        'Status': getStatusLabel(patient),
                        'Obstetra': patient.obstetrician?.full_name || '-',
                        'Enfermeira Obstétrica': patient.obstetric_nurse?.full_name || '-',
                        'Doula': patient.doula?.full_name || '-',
                        'Pediatra': patient.pediatrician?.full_name || '-',
                        'Nutricionista': patient.nutritionist?.full_name || '-',
                        'Consultora Amamentação': patient.lactation_consultant?.full_name || '-',
                        'Fisioterapeuta Pélvica': patient.pelvic_physiotherapist?.full_name || '-',
                        'Prep. Parto': getServiceStatus(patient.birth_preparation_course),
                        'Cuid. RN': getServiceStatus(patient.newborn_care_course),
                        'Workshop Amamentação': getServiceStatus(patient.breastfeeding_workshop),
                        'Acompanhamento Nutricional': getServiceStatus(patient.nutritional_monitoring),
                        'Fisioterapia Pélvica': getServiceStatus(patient.pelvic_physiotherapy),
                        'Consulta Pediátrica': getServiceStatus(patient.pediatric_consultation),
                        'Data de Remoção': patient.removed_at ? formatDate(new Date(patient.removed_at)) : '-',
                        'Removido Por': patient.removed_by_user?.full_name || '-',
                        'Tipo do Responsável': patient.removed_by_user?.user_type?.replace('_', ' ') || '-',
                        'Motivo da Remoção': patient.removal_reason || '-'
                    };
                } catch (rowError) {
                    console.error(`Erro ao processar paciente ${patient.full_name} para Excel:`, rowError);
                    return {
                        'Nome Completo': patient.full_name || '-',
                        'Idade': '-',
                        'Data Nascimento': '-',
                        'Data de Cadastro': '-',
                        'IG na Remoção': '-',
                        'Telefone': '-',
                        'CEP': '-',
                        'Endereço': '-',
                        'DPP': '-',
                        'Via de Parto Preferida': '-',
                        'Nome do Bebê': '-',
                        'Nome do Companheiro(a)': '-',
                        'Status': '-',
                        'Obstetra': '-',
                        'Enfermeira Obstétrica': '-',
                        'Doula': '-',
                        'Pediatra': '-',
                        'Nutricionista': '-',
                        'Consultora Amamentação': '-',
                        'Fisioterapeuta Pélvica': '-',
                        'Prep. Parto': '-',
                        'Cuid. RN': '-',
                        'Workshop Amamentação': '-',
                        'Acompanhamento Nutricional': '-',
                        'Fisioterapia Pélvica': '-',
                        'Consulta Pediátrica': '-',
                        'Data de Remoção': '-',
                        'Removido Por': '-',
                        'Tipo do Responsável': '-',
                        'Motivo da Remoção': '-'
                    };
                }
            });
            console.log('Dados do Excel preparados:', data);
            console.log('Criando planilha...');
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pacientes Removidas');
            console.log('Salvando arquivo Excel...');
            XLSX.writeFile(wb, 'pacientes-removidas.xlsx');
            console.log('Excel exportado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao exportar Excel:', error);
            console.error('Stack trace:', error.stack);
            alert(`Erro ao exportar Excel: ${error.message}`);
        }
    };
    const handlePermanentDelete = (patient: any)=>{
        setSelectedPatientForDeletion(patient);
        setShowPermanentDeleteModal(true);
    };
    const confirmPermanentDelete = ()=>{
        if (selectedPatientForDeletion && user) {
            permanentlyDeletePatient({
                patientId: selectedPatientForDeletion.id,
                patientType: selectedPatientForDeletion.type,
                userId: user.id
            });
            setShowPermanentDeleteModal(false);
            setSelectedPatientForDeletion(null);
        }
    };
    const closePermanentDeleteModal = ()=>{
        setShowPermanentDeleteModal(false);
        setSelectedPatientForDeletion(null);
    };
    if (!canViewRemovedPatients) {
        return (<div className="flex items-center justify-center min-h-[400px]" data-spec-id="access-denied">
        <Card className="w-full max-w-md" data-spec-id="access-denied-card">
          <CardContent className="text-center py-12" data-spec-id="access-denied-content">
            <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" data-spec-id="access-denied-icon"/>
            <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="access-denied-title">
              Acesso Negado
            </h3>
            <p className="text-gray-600" data-spec-id="access-denied-description">
              Você não tem permissão para visualizar pacientes removidas.
            </p>
          </CardContent>
        </Card>
      </div>);
    }
    return (<div className="space-y-6" data-spec-id={dataSpecId}>
      <div className="flex flex-col space-y-4" data-spec-id="header-section">
        <div className="flex items-center justify-between" data-spec-id="header-row">
          <div data-spec-id="title-section">
            <h1 className="text-2xl font-bold text-gray-900" data-spec-id="page-title">
              Pacientes Removidas
            </h1>
            <p className="text-gray-600" data-spec-id="page-description">
              Histórico de pacientes removidas do acompanhamento
            </p>
          </div>
          
          <Badge variant="outline" className="text-sm" data-spec-id="count-badge">
            {sortedAndFilteredPatients.length} paciente(s) removida(s)
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" data-spec-id="controls-section">
          <div className="relative max-w-md flex-1" data-spec-id="search-section">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" data-spec-id="search-icon"/>
            <Input placeholder="Buscar por nome, bebê, obstetra, responsável ou motivo..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="pl-10" data-spec-id="search-input"/>
          </div>

          <div className="flex gap-2" data-spec-id="action-buttons">
            {}
            <Button variant="outline" size="sm" onClick={()=>{
        console.log('Teste: Clique simples no botão ordenar');
        setSortBy(sortBy === 'name' ? 'removal_date' : 'name');
    }} data-spec-id="test-sort-button">
              <ArrowUpDown className="h-4 w-4 mr-2" data-spec-id="FlTbQTXnwWo9QXtX"/>
              {sortBy === 'name' ? 'Alternar Ordem (Data Remoção Recente-Antiga)' : 'Alternar Ordem (Nome A-Z)'}
            </Button>

            <Button variant="outline" size="sm" onClick={()=>{
        console.log('Teste: Clique simples no botão exportar');
        exportToPDF();
    }} data-spec-id="test-export-button">
              <Download className="h-4 w-4 mr-2" data-spec-id="tYSbMlYsQawJhYSA"/>
              Exportar PDF
            </Button>

            <Button variant="outline" size="sm" onClick={()=>{
        console.log('Teste: Clique simples no botão Excel');
        exportToExcel();
    }} data-spec-id="test-excel-button">
              <FileSpreadsheet className="h-4 w-4 mr-2" data-spec-id="dVZjRJnvJsyeyhIL"/>
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {}
      {error && (<Alert variant="destructive" data-spec-id="error-alert">
          <AlertCircle className="h-4 w-4" data-spec-id="error-icon"/>
          <AlertDescription data-spec-id="error-message">
            Erro ao carregar pacientes removidas: {error.message}
          </AlertDescription>
        </Alert>)}

      {isLoading && (<Card data-spec-id="loading-card">
          <CardHeader data-spec-id="loading-header">
            <Skeleton className="h-6 w-48" data-spec-id="loading-title"/>
          </CardHeader>
          <CardContent data-spec-id="loading-content">
            <div className="space-y-4" data-spec-id="loading-rows">
              {Array.from({
        length: 5
    }).map((_, index)=>(<div key={index} className="flex space-x-4" data-spec-id={`loading-row-${index}`}>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-1-${index}`}/>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-2-${index}`}/>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-3-${index}`}/>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-4-${index}`}/>
                </div>))}
            </div>
          </CardContent>
        </Card>)}

      {}
      {!isLoading && !error && (<Card data-spec-id="removed-patients-card">
          <CardHeader data-spec-id="table-header">
            <CardTitle className="flex items-center" data-spec-id="table-title">
              <UserX className="h-5 w-5 mr-2" data-spec-id="table-icon"/>
              Pacientes Removidas do Acompanhamento
            </CardTitle>
          </CardHeader>
          <CardContent data-spec-id="table-content">
            {sortedAndFilteredPatients.length === 0 ? (<div className="text-center py-12" data-spec-id="empty-state">
                <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" data-spec-id="empty-icon"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="empty-title">
                  Nenhuma paciente removida encontrada
                </h3>
                <p className="text-gray-600" data-spec-id="empty-description">
                  {searchTerm ? 'Tente ajustar os critérios de busca.' : 'Não há pacientes removidas no sistema.'}
                </p>
              </div>) : (<div className="overflow-x-auto" data-spec-id="table-container">
                <Table data-spec-id="removed-patients-table">
                  <TableHeader data-spec-id="table-header-row">
                    <TableRow data-spec-id="header-row">
                      <TableHead className="min-w-[200px]" data-spec-id="name-header">Nome Completo</TableHead>
                      <TableHead className="min-w-[80px]" data-spec-id="age-header">Idade</TableHead>
                      <TableHead className="min-w-[120px]" data-spec-id="phone-header">Telefone</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="registration-date-header">Data Cadastro</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="gestational-age-header">IG na Remoção</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="dpp-header">DPP</TableHead>
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
                      <TableHead className="min-w-[80px]" data-spec-id="status-header">Status</TableHead>
                      <TableHead className="min-w-[120px]" data-spec-id="removed-date-header">Data Remoção</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="removed-by-header">Removido Por</TableHead>
                      <TableHead className="min-w-[200px]" data-spec-id="reason-header">Motivo</TableHead>
                      {canPermanentlyDeletePatients && (<TableHead className="min-w-[100px]" data-spec-id="actions-header">Ações</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody data-spec-id="table-body">
                    {sortedAndFilteredPatients.map((patient)=>{
        const age = calculateAge(patient.patient_birth_date || patient.birth_date);
        const [year, month, day] = patient.estimated_due_date.split('-').map(Number);
        const dppDate = new Date(year, month - 1, day);
        return (<TableRow key={`${patient.type}-${patient.id}`} data-spec-id={`patient-row-${patient.id}`}>
                          <TableCell className="font-medium" data-spec-id={`name-cell-${patient.id}`}>
                            {patient.full_name}
                          </TableCell>
                          <TableCell data-spec-id={`age-cell-${patient.id}`}>
                            {age} anos
                          </TableCell>
                          <TableCell data-spec-id={`phone-cell-${patient.id}`}>
                            {formatPhone(patient.phone)}
                          </TableCell>
                          <TableCell data-spec-id={`registration-date-cell-${patient.id}`}>
                            {patient.created_at ? formatDate(new Date(patient.created_at)) : '-'}
                          </TableCell>
                          <TableCell data-spec-id={`gestational-age-cell-${patient.id}`}>
                            {(()=>{
            const gestationalAge = getGestationalAgeAtRemoval(patient);
            return gestationalAge ? formatGestationalAge(gestationalAge.weeks, gestationalAge.days) : '-';
        })()}
                          </TableCell>
                          <TableCell data-spec-id={`dpp-cell-${patient.id}`}>
                            {formatDate(dppDate)}
                          </TableCell>
                          <TableCell data-spec-id={`delivery-type-cell-${patient.id}`}>
                            <Badge variant="outline" data-spec-id={`delivery-badge-${patient.id}`}>
                              {getDeliveryTypeLabel(patient.preferred_delivery_type)}
                            </Badge>
                          </TableCell>
                          <TableCell data-spec-id={`obstetrician-cell-${patient.id}`}>
                            {patient.obstetrician?.full_name || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`nurse-cell-${patient.id}`}>
                            {patient.obstetric_nurse?.full_name || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`doula-cell-${patient.id}`}>
                            {patient.doula?.full_name || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`pediatrician-cell-${patient.id}`}>
                            {patient.pediatrician?.full_name || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`address-cell-${patient.id}`}>
                            {patient.street && patient.number ? `${patient.street}, ${patient.number}, ${patient.neighborhood}, ${patient.city}/${patient.state}` : [
            patient.neighborhood,
            patient.city,
            patient.state
        ].filter(Boolean).join(', ') || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`baby-name-cell-${patient.id}`}>
                            {patient.baby_name || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`partner-cell-${patient.id}`}>
                            {patient.partner_name || '-'}
                          </TableCell>
                          <TableCell data-spec-id={`birth-prep-cell-${patient.id}`}>
                            {getServiceStatus(patient.birth_preparation_course)}
                          </TableCell>
                          <TableCell data-spec-id={`newborn-care-cell-${patient.id}`}>
                            {getServiceStatus(patient.newborn_care_course)}
                          </TableCell>
                          <TableCell data-spec-id={`breastfeeding-cell-${patient.id}`}>
                            {getServiceStatus(patient.breastfeeding_workshop)}
                          </TableCell>
                          <TableCell data-spec-id={`nutrition-cell-${patient.id}`}>
                            {getServiceStatus(patient.nutritional_monitoring)}
                          </TableCell>
                          <TableCell data-spec-id={`physiotherapy-cell-${patient.id}`}>
                            {getServiceStatus(patient.pelvic_physiotherapy)}
                          </TableCell>
                          <TableCell data-spec-id={`pediatric-consult-cell-${patient.id}`}>
                            {getServiceStatus(patient.pediatric_consultation)}
                          </TableCell>
                          <TableCell data-spec-id={`status-cell-${patient.id}`}>
                            <Badge variant={getStatusVariant(patient)} data-spec-id={`status-badge-${patient.id}`}>
                              {getStatusLabel(patient)}
                            </Badge>
                          </TableCell>
                          <TableCell data-spec-id={`removed-date-cell-${patient.id}`}>
                            <div className="flex items-center" data-spec-id={`date-info-${patient.id}`}>
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" data-spec-id={`date-icon-${patient.id}`}/>
                              {patient.removed_at ? formatDate(new Date(patient.removed_at)) : '-'}
                            </div>
                          </TableCell>
                          <TableCell data-spec-id={`removed-by-cell-${patient.id}`}>
                            {patient.removed_by_user ? (<div data-spec-id={`remover-info-${patient.id}`}>
                                <div className="font-medium" data-spec-id={`remover-name-${patient.id}`}>
                                  {patient.removed_by_user.full_name}
                                </div>
                                <div className="text-sm text-gray-500 capitalize" data-spec-id={`remover-type-${patient.id}`}>
                                  {patient.removed_by_user.user_type?.replace('_', ' ')}
                                </div>
                              </div>) : (<span className="text-gray-400" data-spec-id={`no-remover-${patient.id}`}>-</span>)}
                          </TableCell>
                          <TableCell data-spec-id={`reason-cell-${patient.id}`}>
                            <div className="max-w-xs" data-spec-id={`reason-text-${patient.id}`}>
                              {patient.removal_reason || <span className="text-gray-400" data-spec-id={`no-reason-${patient.id}`}>-</span>}
                            </div>
                          </TableCell>
                          {canPermanentlyDeletePatients && (<TableCell data-spec-id={`actions-cell-${patient.id}`}>
                              <Button variant="outline" size="sm" onClick={()=>handlePermanentDelete(patient)} disabled={isPermanentlyDeleting} className="text-red-600 border-red-200 hover:bg-red-50" data-spec-id={`permanent-delete-button-${patient.id}`}>
                                <Trash2 className="h-4 w-4 mr-1" data-spec-id={`trash-icon-${patient.id}`}/>
                                Excluir Definitivamente
                              </Button>
                            </TableCell>)}
                        </TableRow>);
    })}
                  </TableBody>
                </Table>
              </div>)}
          </CardContent>
        </Card>)}

      {}
      <PermanentDeleteModal isOpen={showPermanentDeleteModal} onClose={closePermanentDeleteModal} onConfirm={confirmPermanentDelete} patientName={selectedPatientForDeletion?.full_name || ''} isLoading={isPermanentlyDeleting} data-spec-id="TYaULFe8QczVuVn8"/>
    </div>);
};
export default RemovedPatientsView;
