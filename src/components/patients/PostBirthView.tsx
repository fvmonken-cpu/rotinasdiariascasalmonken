import React, { useState } from 'react';
import { useBornPatients } from '@/hooks/usePatients';
import { useMaternities } from '@/hooks/useMaternities';
import { useUsers } from '@/hooks/usePatients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet, Baby, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { formatPhone } from '@/utils/phoneUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import BornPatientFilters from './BornPatientFilters';
import EditBirthModal from './EditBirthModal';
import CancelBirthModal from './CancelBirthModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addPDFHeader, addPDFFooter, addGenerationInfo } from '@/utils/pdfUtils';
interface PostBirthViewProps {
    'data-spec-id'?: string;
}
const PostBirthView: React.FC<PostBirthViewProps> = ({ 'data-spec-id': dataSpecId })=>{
    const [filters, setFilters] = useState({
        search: '',
        baby_gender: [] as string[],
        maternity: [] as string[],
        obstetrician: [] as string[],
        obstetricNursePresent: [] as string[],
        doulaPresent: [] as string[],
        deliveryType: [] as string[],
        birthDateFrom: '',
        birthDateTo: ''
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedBirth, setSelectedBirth] = useState<any>(null);
    const { user } = useAuth();
    const { canViewCommercialFields } = useUserPermissions();
    const { data: bornPatients, isLoading, error } = useBornPatients(filters, user?.id, user?.role);
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
    const formatGestationalAge = (weeks: number, days: number)=>{
        return `${weeks}s${days}d`;
    };
    const getDeliveryTypeLabel = (type: string)=>{
        const labels = {
            'normal': 'Normal',
            'cesariana': 'Cesariana'
        };
        return labels[type as keyof typeof labels] || type;
    };
    const getGenderLabel = (gender: string)=>{
        const labels = {
            'masculino': 'Masculino',
            'feminino': 'Feminino'
        };
        return labels[gender as keyof typeof labels] || gender;
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
    const canEditBirth = (birthRecord: any)=>{
        if (!user) return false;
        if (user.role === 'consultora_amamentacao') return false;
        if (user.role === 'sdr') return false;
        if (user.has_admin_power || user.is_admin) return true;
        if (birthRecord.created_by === user.id) return true;
        if (birthRecord.obstetrician_id === user.id) return true;
        return false;
    };
    const canCancelBirth = (birthRecord: any)=>{
        if (!user) return false;
        if (user.role === 'consultora_amamentacao') return false;
        if (user.role === 'sdr') return false;
        if (user.has_admin_power || user.is_admin) return true;
        if (birthRecord.created_by === user.id) return true;
        if (birthRecord.obstetrician_id === user.id) return true;
        return false;
    };
    const handleEditBirth = (birthRecord: any)=>{
        setSelectedBirth(birthRecord);
        setEditModalOpen(true);
    };
    const handleCancelBirth = (birthRecord: any)=>{
        setSelectedBirth(birthRecord);
        setCancelModalOpen(true);
    };
    const closeModals = ()=>{
        setEditModalOpen(false);
        setCancelModalOpen(false);
        setSelectedBirth(null);
    };
    const handleFiltersChange = (newFilters: any)=>{
        setFilters(newFilters);
    };
    const clearFilters = ()=>{
        setFilters({
            search: '',
            baby_gender: [],
            maternity: [],
            obstetrician: [],
            obstetricNursePresent: [],
            doulaPresent: [],
            deliveryType: [],
            birthDateFrom: '',
            birthDateTo: ''
        });
    };
    const exportToPDF = async ()=>{
        console.log('Iniciando exportação PDF...');
        console.log('Dados filtrados:', bornPatients);
        console.log('Quantidade de pacientes:', bornPatients?.length || 0);
        try {
            if (!bornPatients || bornPatients.length === 0) {
                console.warn('Nenhum dado para exportar');
                alert('Nenhum dado para exportar!');
                return;
            }
            console.log('Criando documento PDF...');
            const doc = new jsPDF('l', 'pt', 'a4');
            console.log('Adicionando cabeçalho com logomarca...');
            const headerEndY = await addPDFHeader(doc, 'Nascimentos');
            console.log('Adicionando informações de geração...');
            const activeFilters = [];
            if (filters.search) activeFilters.push(`Busca: ${filters.search}`);
            if (filters.baby_gender.length > 0) activeFilters.push(`Sexo: ${filters.baby_gender.join(', ')}`);
            if (filters.deliveryType.length > 0) activeFilters.push(`Via Parto: ${filters.deliveryType.join(', ')}`);
            if (filters.birthDateFrom || filters.birthDateTo) {
                const dateRange = `${filters.birthDateFrom || 'início'} até ${filters.birthDateTo || 'fim'}`;
                activeFilters.push(`Período: ${dateRange}`);
            }
            const tableStartY = addGenerationInfo(doc, headerEndY, activeFilters.length > 0 ? activeFilters : undefined);
            console.log('Preparando headers...');
            const headers = [
                'Nome',
                'Idade',
                'CEP',
                'Data Parto',
                'IG Parto',
                'Obs. Gestação',
                'Via Parto',
                'Sexo Bebê',
                'Nome Bebê',
                'Maternidade',
                'Obstetra',
                'EO Presente',
                'Doula Presente',
                'Serviços Extras',
                'Obs. Parto'
            ];
            if (canViewCommercialFields) {
                headers.push('Condições Comerciais', 'Registros de Pagamento');
            }
            console.log('Preparando dados...');
            const data = bornPatients.map((patient, index)=>{
                console.log(`Processando paciente ${index + 1}:`, patient.full_name);
                try {
                    const rowData = [
                        patient.full_name || '-',
                        patient.mother_age_at_birth ? `${patient.mother_age_at_birth} anos` : 'N/A',
                        patient.zip_code || '-',
                        formatDate(new Date(patient.birth_date)),
                        formatGestationalAge(patient.birth_gestational_age_weeks, patient.birth_gestational_age_days || 0),
                        patient.gestational_observations || '-',
                        getDeliveryTypeLabel(patient.delivery_type),
                        getGenderLabel(patient.baby_gender),
                        patient.baby_name || '-',
                        patient.maternity || '-',
                        patient.obstetrician?.full_name || '-',
                        patient.obstetric_nurse_present?.full_name || '-',
                        patient.doula_present?.full_name || '-',
                        getExtraServices(patient),
                        patient.birth_observations || '-'
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
                        cellWidth: 30
                    },
                    2: {
                        cellWidth: 35
                    },
                    3: {
                        cellWidth: 40
                    },
                    4: {
                        cellWidth: 35
                    },
                    5: {
                        cellWidth: 40
                    },
                    6: {
                        cellWidth: 35
                    },
                    7: {
                        cellWidth: 50
                    },
                    8: {
                        cellWidth: 60
                    },
                    9: {
                        cellWidth: 50
                    },
                    10: {
                        cellWidth: 50
                    },
                    11: {
                        cellWidth: 50
                    },
                    12: {
                        cellWidth: 60
                    }
                }
            });
            console.log('Adicionando rodapé com informações do usuário...');
            addPDFFooter(doc, user?.name || user?.full_name || 'Usuário');
            console.log('Salvando arquivo...');
            doc.save('nascimentos.pdf');
            console.log('PDF exportado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao exportar PDF:', error);
            console.error('Stack trace:', error.stack);
            alert(`Erro ao exportar PDF: ${error.message}`);
        }
    };
    const exportToExcel = ()=>{
        console.log('Iniciando exportação Excel...');
        console.log('Dados para Excel:', bornPatients);
        console.log('Quantidade de pacientes:', bornPatients?.length || 0);
        try {
            if (!bornPatients || bornPatients.length === 0) {
                console.warn('Nenhum dado para exportar');
                alert('Nenhum dado para exportar!');
                return;
            }
            console.log('Preparando dados do Excel...');
            const data = bornPatients.map((patient, index)=>{
                console.log(`Processando paciente ${index + 1} para Excel:`, patient.full_name);
                try {
                    const rowData = {
                        'Nome Completo': patient.full_name,
                        'Idade da Mãe no Parto': patient.mother_age_at_birth ? `${patient.mother_age_at_birth} anos` : 'N/A',
                        'Data de Nascimento da Mãe': formatDate(new Date(patient.patient_birth_date || patient.birth_date)),
                        'CEP': patient.zip_code || '-',
                        'Telefone': patient.phone || '-',
                        'Data do Parto': formatDate(new Date(patient.birth_date)),
                        'IG no Parto': formatGestationalAge(patient.birth_gestational_age_weeks, patient.birth_gestational_age_days || 0),
                        'Via de Parto': getDeliveryTypeLabel(patient.delivery_type),
                        'Via Parto Pretendida': patient.preferred_delivery_type === 'normal' ? 'Normal' : patient.preferred_delivery_type === 'cesariana' ? 'Cesariana' : 'Não Definido',
                        'Sexo do Bebê': getGenderLabel(patient.baby_gender),
                        'Nome do Bebê': patient.baby_name || '-',
                        'Maternidade': patient.maternity || '-',
                        'DPP': formatDate(new Date(patient.estimated_due_date)),
                        'Data Cadastro': patient.created_at ? formatDate(new Date(patient.created_at)) : '-',
                        'IG no Cadastro': formatGestationalAge(patient.registration_gestational_age_weeks, patient.registration_gestational_age_days || 0),
                        'Obstetra Responsável': patient.obstetrician?.full_name || '-',
                        'Pediatra': patient.pediatrician?.full_name || '-',
                        'EO Responsável': patient.obstetric_nurse?.full_name || '-',
                        'EO Presente no Parto': patient.obstetric_nurse_present?.full_name || '-',
                        'Doula Responsável': patient.doula?.full_name || '-',
                        'Doula Presente no Parto': patient.doula_present?.full_name || '-',
                        'Nutricionista': patient.nutritionist?.full_name || '-',
                        'Consultora Amamentação': patient.lactation_consultant?.full_name || '-',
                        'Fisioterapeuta Pélvica': patient.pelvic_physiotherapist?.full_name || '-',
                        'Serviços Extras Contratados': getExtraServices(patient),
                        'Observações da Gestação': patient.gestational_observations || '-',
                        'Observações do Parto': patient.birth_observations || '-'
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
                        'Idade da Mãe': '-',
                        'Data de Nascimento da Mãe': '-',
                        'Telefone': '-',
                        'Data do Parto': '-',
                        'IG no Parto': '-',
                        'Via de Parto': '-',
                        'Via Parto Pretendida': '-',
                        'Sexo do Bebê': '-',
                        'Nome do Bebê': '-',
                        'Maternidade': '-',
                        'Cidade Maternidade': '-',
                        'DPP': '-',
                        'Data Cadastro': '-',
                        'IG no Cadastro': '-',
                        'Obstetra Responsável': '-',
                        'Pediatra': '-',
                        'EO Responsável': '-',
                        'EO Presente no Parto': '-',
                        'Doula Responsável': '-',
                        'Doula Presente no Parto': '-',
                        'Nutricionista': '-',
                        'Consultora Amamentação': '-',
                        'Fisioterapeuta Pélvica': '-',
                        'Serviços Extras Contratados': '-',
                        'Observações da Gestação': '-',
                        'Observações do Parto': '-'
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
            XLSX.utils.book_append_sheet(wb, ws, 'Nascimentos');
            console.log('Salvando arquivo Excel...');
            XLSX.writeFile(wb, 'nascimentos.xlsx');
            console.log('Excel exportado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao exportar Excel:', error);
            console.error('Stack trace:', error.stack);
            alert(`Erro ao exportar Excel: ${error.message}`);
        }
    };
    return (<div className="space-y-6" data-spec-id={dataSpecId}>
      <div className="flex flex-col space-y-4" data-spec-id="header-section">
        <div className="flex items-center justify-between" data-spec-id="header-row">
          <div data-spec-id="title-section">
            <h1 className="text-2xl font-bold text-gray-900" data-spec-id="page-title">
              Nascimentos
            </h1>
            <p className="text-gray-600" data-spec-id="page-description">
              Histórico de pacientes que já deram à luz
            </p>
          </div>
          
          <Badge variant="outline" className="text-sm" data-spec-id="count-badge">
            {bornPatients?.length || 0} nascimento(s)
          </Badge>
        </div>

        {}
        <BornPatientFilters filters={filters} onFiltersChange={handleFiltersChange} onClearFilters={clearFilters} isDoula={user?.role === 'doula'} isLactationConsultant={user?.role === 'consultora_amamentacao'} data-spec-id="born-patient-filters-instance"/>

        {}
        {}
        {user?.role && ![
        'enfermeira_obstetrica',
        'doula',
        'consultora_amamentacao',
        'fisioterapeuta_pelvica',
        'pediatra',
        'nutricionista'
    ].includes(user.role) && (<Card data-spec-id="export-card">
            <CardContent className="p-4" data-spec-id="export-content">
              <div className="flex gap-2 justify-center" data-spec-id="export-buttons">
                <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!bornPatients || bornPatients.length === 0} data-spec-id="export-pdf-button">
                  <Download className="h-4 w-4 mr-2" data-spec-id="pdf-icon"/>
                  Exportar PDF
                </Button>

                <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!bornPatients || bornPatients.length === 0} data-spec-id="export-excel-button">
                  <FileSpreadsheet className="h-4 w-4 mr-2" data-spec-id="excel-icon"/>
                  Exportar Excel
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {}
      {error && (<Alert variant="destructive" data-spec-id="error-alert">
          <AlertCircle className="h-4 w-4" data-spec-id="error-icon"/>
          <AlertDescription data-spec-id="error-message">
            Erro ao carregar dados: {error.message}
          </AlertDescription>
        </Alert>)}

      {}
      {isLoading && (<Card data-spec-id="loading-card">
          <CardHeader data-spec-id="loading-header">
            <Skeleton className="h-6 w-48" data-spec-id="loading-title"/>
          </CardHeader>
          <CardContent data-spec-id="loading-content">
            <div className="space-y-4" data-spec-id="loading-rows">
              {Array.from({
        length: 5
    }).map((_, index)=>(<div key={index} className="flex space-x-4" data-spec-id={`loading-row-${index}`}>
                  <Skeleton className="h-4 w-1/6" data-spec-id={`loading-cell-1-${index}`}/>
                  <Skeleton className="h-4 w-1/6" data-spec-id={`loading-cell-2-${index}`}/>
                  <Skeleton className="h-4 w-1/6" data-spec-id={`loading-cell-3-${index}`}/>
                  <Skeleton className="h-4 w-1/6" data-spec-id={`loading-cell-4-${index}`}/>
                  <Skeleton className="h-4 w-1/6" data-spec-id={`loading-cell-5-${index}`}/>
                  <Skeleton className="h-4 w-1/6" data-spec-id={`loading-cell-6-${index}`}/>
                </div>))}
            </div>
          </CardContent>
        </Card>)}

      {}
      {!isLoading && !error && (<Card data-spec-id="data-card">
          <CardHeader data-spec-id="table-header">
            <CardTitle className="flex items-center" data-spec-id="table-title">
              <Baby className="h-5 w-5 mr-2" data-spec-id="table-icon"/>
              Nascimentos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent data-spec-id="table-content">
            {!bornPatients || bornPatients.length === 0 ? (<div className="text-center py-12" data-spec-id="empty-state">
                <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" data-spec-id="empty-icon"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="empty-title">
                  Nenhum nascimento encontrado
                </h3>
                <p className="text-gray-600" data-spec-id="empty-description">
                  {Object.values(filters).some((v)=>v && (Array.isArray(v) ? v.length > 0 : true)) ? 'Tente ajustar os filtros para encontrar registros.' : 'Não há nascimentos registrados no sistema.'}
                </p>
              </div>) : (<div className="overflow-x-auto" data-spec-id="table-container">
                <Table data-spec-id="born-patients-table">
                  <TableHeader data-spec-id="table-header-row">
                    <TableRow data-spec-id="header-row">
                      <TableHead className="min-w-[200px]" data-spec-id="name-header">Nome da Mãe</TableHead>
                      <TableHead className="min-w-[80px]" data-spec-id="age-header">Idade no Parto</TableHead>
                      <TableHead className="min-w-[80px]" data-spec-id="zip-header">CEP</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="birth-date-header">Data Parto</TableHead>
                      <TableHead className="min-w-[80px]" data-spec-id="ga-header">IG Parto</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="delivery-header">Via de Parto</TableHead>
                      <TableHead className="min-w-[80px]" data-spec-id="gender-header">Sexo Bebê</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="baby-name-header">Nome do Bebê</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="maternity-header">Maternidade</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="obstetrician-header">Obstetra</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="nurse-present-header">EO Presente</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="doula-present-header">Doula Presente</TableHead>
                      <TableHead className="min-w-[200px]" data-spec-id="extra-services-header">Serviços Extras</TableHead>
                      <TableHead className="min-w-[150px]" data-spec-id="gestational-observations-header">Obs. Gestação</TableHead>
                      <TableHead className="min-w-[200px]" data-spec-id="birth-observations-header">Obs. Parto</TableHead>
                      {canViewCommercialFields && (<>
                          <TableHead className="min-w-[200px]" data-spec-id="commercial-conditions-header">Condições Comerciais</TableHead>
                          <TableHead className="min-w-[200px]" data-spec-id="payment-records-header">Registros de Pagamento</TableHead>
                        </>)}
                      <TableHead className="min-w-[100px]" data-spec-id="actions-header">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-spec-id="table-body">
                    {bornPatients.map((patient)=>(<TableRow key={patient.id} data-spec-id={`patient-row-${patient.id}`}>
                        <TableCell className="font-medium" data-spec-id={`name-cell-${patient.id}`}>
                          {patient.full_name}
                        </TableCell>
                        <TableCell data-spec-id={`age-cell-${patient.id}`}>
                          {patient.mother_age_at_birth ? `${patient.mother_age_at_birth} anos` : 'N/A'}
                        </TableCell>
                        <TableCell data-spec-id={`zip-cell-${patient.id}`}>
                          {patient.zip_code || '-'}
                        </TableCell>
                        <TableCell data-spec-id={`birth-date-cell-${patient.id}`}>
                          {formatDate(new Date(patient.birth_date))}
                        </TableCell>
                        <TableCell data-spec-id={`ga-cell-${patient.id}`}>
                          {formatGestationalAge(patient.birth_gestational_age_weeks, patient.birth_gestational_age_days || 0)}
                        </TableCell>
                        <TableCell data-spec-id={`delivery-cell-${patient.id}`}>
                          <Badge variant="outline" data-spec-id={`delivery-badge-${patient.id}`}>
                            {getDeliveryTypeLabel(patient.delivery_type)}
                          </Badge>
                        </TableCell>
                        <TableCell data-spec-id={`gender-cell-${patient.id}`}>
                          <Badge variant="outline" className={patient.baby_gender === 'masculino' ? 'bg-[#bfddf3] text-black border-[#bfddf3]' : 'bg-[#eedae5] text-black border-[#eedae5]'} data-spec-id={`gender-badge-${patient.id}`}>
                            {getGenderLabel(patient.baby_gender)}
                          </Badge>
                        </TableCell>
                        <TableCell data-spec-id={`baby-name-cell-${patient.id}`}>
                          {patient.baby_name || '-'}
                        </TableCell>
                        <TableCell data-spec-id={`maternity-cell-${patient.id}`}>
                          {patient.maternity || '-'}
                        </TableCell>
                        <TableCell data-spec-id={`obstetrician-cell-${patient.id}`}>
                          {patient.obstetrician?.full_name || '-'}
                        </TableCell>
                        <TableCell data-spec-id={`nurse-present-cell-${patient.id}`}>
                          {patient.obstetric_nurse_present?.full_name || '-'}
                        </TableCell>
                        <TableCell data-spec-id={`doula-present-cell-${patient.id}`}>
                          {patient.doula_present?.full_name || '-'}
                        </TableCell>
                        <TableCell data-spec-id={`extra-services-cell-${patient.id}`}>
                          <div className="max-w-xs text-sm" data-spec-id={`extra-services-text-${patient.id}`}>
                            {getExtraServices(patient)}
                          </div>
                        </TableCell>
                        <TableCell data-spec-id={`gestational-observations-cell-${patient.id}`}>
                          <div className="max-w-xs text-sm" data-spec-id={`gestational-observations-text-${patient.id}`}>
                            {patient.gestational_observations || '-'}
                          </div>
                        </TableCell>
                        <TableCell data-spec-id={`birth-observations-cell-${patient.id}`}>
                          <div className="max-w-xs" data-spec-id={`birth-observations-text-${patient.id}`}>
                            {patient.birth_observations || '-'}
                          </div>
                        </TableCell>
                        {canViewCommercialFields && (<>
                            <TableCell data-spec-id={`commercial-conditions-cell-${patient.id}`}>
                              <div className="max-w-xs text-sm" data-spec-id={`commercial-conditions-text-${patient.id}`}>
                                {patient.commercial_conditions || '-'}
                              </div>
                            </TableCell>
                            <TableCell data-spec-id={`payment-records-cell-${patient.id}`}>
                              <div className="max-w-xs text-sm" data-spec-id={`payment-records-text-${patient.id}`}>
                                {patient.payment_records || '-'}
                              </div>
                            </TableCell>
                          </>)}
                        <TableCell data-spec-id={`actions-cell-${patient.id}`}>
                          <div className="flex gap-1" data-spec-id={`actions-buttons-${patient.id}`}>
                            {canEditBirth(patient) && (<Button variant="ghost" size="sm" onClick={()=>handleEditBirth(patient)} className="h-8 w-8 p-0" title="Editar nascimento" data-spec-id={`edit-birth-${patient.id}`}>
                                <Edit className="h-4 w-4" data-spec-id={`edit-icon-${patient.id}`}/>
                              </Button>)}
                            {canCancelBirth(patient) && (<Button variant="ghost" size="sm" onClick={()=>handleCancelBirth(patient)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700" title="Cancelar nascimento" data-spec-id={`cancel-birth-${patient.id}`}>
                                <Trash2 className="h-4 w-4" data-spec-id={`cancel-icon-${patient.id}`}/>
                              </Button>)}
                          </div>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>)}
          </CardContent>
        </Card>)}
      
      {}
      {selectedBirth && (<>
          <EditBirthModal isOpen={editModalOpen} onClose={closeModals} birthData={selectedBirth} data-spec-id="edit-birth-modal-instance"/>
          <CancelBirthModal isOpen={cancelModalOpen} onClose={closeModals} birthData={selectedBirth} data-spec-id="cancel-birth-modal-instance"/>
        </>)}
    </div>);
};
export default PostBirthView;
