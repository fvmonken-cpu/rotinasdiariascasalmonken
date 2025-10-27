import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Calendar, Phone, MapPin, Heart, Baby, Lock, Loader2, Info, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCEP } from '@/hooks/useCEP';
import { useUsers } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone, isValidPhone } from '@/utils/phoneUtils';
import { formatCEP, isValidCEP } from '@/utils/cepUtils';
import { calculateDPP, formatDate, calculateGestationalAge, formatGestationalAge, normalizeDateForDB } from '@/utils/dateUtils';
import { formatName, formatBabyName, formatPartnerName } from '@/utils/textUtils';
import { Patient } from '@/types/patient';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { calculateGestationalWeekDates } from '@/utils/gestationalUtils';
import CommercialSection from './CommercialSection';
import MedicalObservationsSection from './MedicalObservationsSection';
interface EditPatientFormProps {
    patient: Patient;
    onSuccess: () => void;
    onCancel: () => void;
}
const editPatientSchema = z.object({
    nomeCompleto: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
    dpp: z.string().min(1, 'Data provável do parto é obrigatória'),
    telefone: z.string().min(1, 'Telefone é obrigatório').refine(isValidPhone, 'Telefone inválido'),
    cep: z.string().min(1, 'CEP é obrigatório').refine(isValidCEP, 'CEP inválido'),
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().min(1, 'Estado é obrigatório'),
    nomeCompanheiro: z.string().optional(),
    nomeBebe: z.string().optional(),
    viaPartoEscolhida: z.enum([
        'normal',
        'cesariana',
        'nao_definido'
    ]),
    obstetraResponsavel: z.string().min(1, 'Obstetra responsável é obrigatório'),
    enfermeiraObstetrica: z.string().optional(),
    doula: z.string().optional(),
    consultoraAmamentacao: z.string().optional(),
    pediatraResponsavel: z.string().optional(),
    nutricionista: z.string().optional(),
    fisioterapeutaPelvica: z.string().optional(),
    consulta_amamentacao: z.boolean().default(false),
    curso_cuidados_recem_nascido: z.boolean().default(false),
    consulta_pediatrica: z.boolean().default(false),
    acompanhamento_nutricional: z.boolean().default(false),
    fisioterapia_pelvica: z.boolean().default(false),
    curso_preparo_parto: z.boolean().default(false),
    commercial_conditions: z.string().optional(),
    payment_records: z.string().optional(),
    gestational_observations: z.string().optional()
});
type EditPatientFormData = z.infer<typeof editPatientSchema>;
const EditPatientForm: React.FC<EditPatientFormProps> = ({ patient, onSuccess, onCancel })=>{
    const { user } = useAuth();
    const { loading: cepLoading, error: cepError, fetchCEP } = useCEP();
    const { createHistoryEntry } = usePatientHistory(patient.id);
    const [gestationalAge, setGestationalAge] = useState<{
        weeks: number;
        days: number;
    } | null>(null);
    const [patientAge, setPatientAge] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, control, watch, setValue, formState: { errors }, clearErrors } = useForm<EditPatientFormData>({
        resolver: zodResolver(editPatientSchema),
        defaultValues: {
            nomeCompleto: patient.full_name,
            dataNascimento: patient.birth_date,
            dpp: patient.estimated_due_date,
            telefone: patient.phone,
            cep: patient.zip_code,
            logradouro: patient.street,
            numero: patient.number || '',
            complemento: patient.complement || '',
            bairro: patient.neighborhood,
            cidade: patient.city,
            estado: patient.state,
            nomeCompanheiro: patient.partner_name || '',
            nomeBebe: patient.baby_name || '',
            viaPartoEscolhida: patient.preferred_delivery_type as 'normal' | 'cesariana' | 'nao_definido',
            obstetraResponsavel: patient.obstetrician_id || '',
            enfermeiraObstetrica: patient.obstetric_nurse_id || 'none',
            doula: patient.doula_id || 'none',
            consultoraAmamentacao: patient.lactation_consultant_id || 'none',
            pediatraResponsavel: patient.pediatrician_id || 'none',
            nutricionista: patient.nutritionist_id || 'none',
            fisioterapeutaPelvica: patient.pelvic_physiotherapist_id || 'none',
            consulta_amamentacao: patient.breastfeeding_workshop === 'contratado',
            curso_cuidados_recem_nascido: patient.newborn_care_course === 'contratado',
            consulta_pediatrica: patient.pediatric_consultation === 'contratado',
            acompanhamento_nutricional: patient.nutritional_monitoring === 'contratado',
            fisioterapia_pelvica: patient.pelvic_physiotherapy === 'contratado',
            curso_preparo_parto: patient.birth_preparation_course === 'contratado',
            commercial_conditions: patient.commercial_conditions || '',
            payment_records: patient.payment_records || '',
            gestational_observations: patient.gestational_observations || ''
        }
    });
    const watchedFields = watch();
    const viaPartoEscolhida = watch('viaPartoEscolhida');
    const dpp = watch('dpp');
    const dataNascimento = watch('dataNascimento');
    const consultaAmamentacao = watch('consulta_amamentacao');
    const consultaPediatrica = watch('consulta_pediatrica');
    const { data: obstetricians = [] } = useUsers('obstetra');
    const { data: obstetricNurses = [] } = useUsers('enfermeira_obstetrica');
    const { data: doulas = [] } = useUsers('doula');
    const { data: pediatricians = [] } = useUsers('pediatra');
    const { data: nutritionists = [] } = useUsers('nutricionista');
    const { data: lactationConsultants = [] } = useUsers('consultora_amamentacao');
    const { data: pelvicPhysiotherapists = [] } = useUsers('fisioterapeuta_pelvica');
    useEffect(()=>{
        if (dpp) {
            console.log('EditForm useEffect DPP - Input:', dpp);
            const [year, month, day] = dpp.split('-').map(Number);
            const dppDate = new Date(year, month - 1, day);
            console.log('EditForm useEffect DPP - Data criada:', dppDate);
            if (!isNaN(dppDate.getTime())) {
                const age = calculateGestationalAge(dppDate);
                console.log('EditForm useEffect DPP - Idade gestacional:', age);
                setGestationalAge(age);
            }
        }
    }, [
        dpp
    ]);
    useEffect(()=>{
        if (dataNascimento) {
            const birthDate = new Date(dataNascimento);
            const today = new Date();
            if (!isNaN(birthDate.getTime())) {
                const ageInYears = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();
                let calculatedAge = ageInYears;
                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                    calculatedAge--;
                }
                setPatientAge(calculatedAge);
            }
        }
    }, [
        dataNascimento
    ]);
    useEffect(()=>{
        if (viaPartoEscolhida === 'cesariana') {
            setValue('enfermeiraObstetrica', 'none');
            setValue('doula', 'none');
            setValue('curso_preparo_parto', false);
        }
    }, [
        viaPartoEscolhida,
        setValue
    ]);
    useEffect(()=>{
        if (!consultaAmamentacao) {
            setValue('consultoraAmamentacao', 'none');
        }
    }, [
        consultaAmamentacao,
        setValue
    ]);
    useEffect(()=>{
        if (!consultaPediatrica) {
            setValue('pediatraResponsavel', 'none');
        }
    }, [
        consultaPediatrica,
        setValue
    ]);
    const handleCEPChange = async (value: string)=>{
        const formattedCEP = formatCEP(value);
        setValue('cep', formattedCEP);
        if (isValidCEP(formattedCEP)) {
            const cepData = await fetchCEP(formattedCEP);
            if (cepData) {
                setValue('logradouro', cepData.logradouro);
                setValue('bairro', cepData.bairro);
                setValue('cidade', cepData.localidade);
                setValue('estado', cepData.uf);
                clearErrors([
                    'logradouro',
                    'bairro',
                    'cidade',
                    'estado'
                ]);
                toast.success('Endereço preenchido automaticamente');
            }
        }
    };
    const handlePhoneChange = (value: string)=>{
        const formattedPhone = formatPhone(value);
        setValue('telefone', formattedPhone);
    };
    const onSubmit = async (data: EditPatientFormData)=>{
        try {
            setIsSubmitting(true);
            console.log('Atualizando paciente:', patient.id, data);
            console.log('EditForm onSubmit - DPP original:', data.dpp);
            const [year, month, day] = data.dpp.split('-').map(Number);
            const dppDate = new Date(year, month - 1, day);
            console.log('EditForm onSubmit - Data DPP criada:', dppDate);
            const gestAge = calculateGestationalAge(dppDate);
            console.log('EditForm onSubmit - Idade gestacional calculada:', gestAge);
            const gestationalWeekDates = calculateGestationalWeekDates(dppDate);
            console.log('EditForm onSubmit - Datas das semanas gestacionais:', gestationalWeekDates);
            const patientData = {
                full_name: formatName(data.nomeCompleto),
                birth_date: normalizeDateForDB(data.dataNascimento),
                phone: data.telefone,
                zip_code: data.cep.replace(/\D/g, ''),
                street: data.logradouro,
                number: data.numero || null,
                complement: data.complemento || null,
                neighborhood: data.bairro,
                city: data.cidade,
                state: data.estado,
                partner_name: formatPartnerName(data.nomeCompanheiro) || null,
                baby_name: formatBabyName(data.nomeBebe) || null,
                estimated_due_date: normalizeDateForDB(data.dpp),
                current_gestational_age_weeks: gestAge.weeks,
                current_gestational_age_days: gestAge.days,
                preferred_delivery_type: data.viaPartoEscolhida,
                obstetrician_id: data.obstetraResponsavel || null,
                obstetric_nurse_id: data.enfermeiraObstetrica === 'none' ? null : data.enfermeiraObstetrica || null,
                doula_id: data.doula === 'none' ? null : data.doula || null,
                pediatrician_id: data.pediatraResponsavel === 'none' ? null : data.pediatraResponsavel || null,
                nutritionist_id: data.nutricionista === 'none' ? null : data.nutricionista || null,
                lactation_consultant_id: data.consultoraAmamentacao === 'none' ? null : data.consultoraAmamentacao || null,
                pelvic_physiotherapist_id: data.fisioterapeutaPelvica === 'none' ? null : data.fisioterapeutaPelvica || null,
                birth_preparation_course: data.curso_preparo_parto ? 'contratado' : 'nao_contratado',
                newborn_care_course: data.curso_cuidados_recem_nascido ? 'contratado' : 'nao_contratado',
                pelvic_physiotherapy: data.fisioterapia_pelvica ? 'contratado' : 'nao_contratado',
                breastfeeding_workshop: data.consulta_amamentacao ? 'contratado' : 'nao_contratado',
                pediatric_consultation: data.consulta_pediatrica ? 'contratado' : 'nao_contratado',
                nutritional_monitoring: data.acompanhamento_nutricional ? 'contratado' : 'nao_contratado',
                commercial_conditions: data.commercial_conditions || null,
                payment_records: data.payment_records || null,
                gestational_observations: data.gestational_observations || null,
                weeks_20_date: gestationalWeekDates.weeks_20_date.toISOString().split('T')[0],
                weeks_30_date: gestationalWeekDates.weeks_30_date.toISOString().split('T')[0],
                weeks_32_date: gestationalWeekDates.weeks_32_date.toISOString().split('T')[0],
                weeks_36_date: gestationalWeekDates.weeks_36_date.toISOString().split('T')[0],
                updated_at: new Date().toISOString()
            };
            const originalPatientData = {
                full_name: patient.full_name,
                birth_date: patient.birth_date,
                phone: patient.phone,
                zip_code: patient.zip_code,
                street: patient.street,
                number: patient.number,
                complement: patient.complement,
                neighborhood: patient.neighborhood,
                city: patient.city,
                state: patient.state,
                partner_name: patient.partner_name,
                baby_name: patient.baby_name,
                estimated_due_date: patient.estimated_due_date,
                current_gestational_age_weeks: patient.current_gestational_age_weeks,
                current_gestational_age_days: patient.current_gestational_age_days,
                preferred_delivery_type: patient.preferred_delivery_type,
                obstetrician_id: patient.obstetrician_id,
                obstetric_nurse_id: patient.obstetric_nurse_id,
                doula_id: patient.doula_id,
                pediatrician_id: patient.pediatrician_id,
                nutritionist_id: patient.nutritionist_id,
                lactation_consultant_id: patient.lactation_consultant_id,
                pelvic_physiotherapist_id: patient.pelvic_physiotherapist_id,
                birth_preparation_course: patient.birth_preparation_course,
                newborn_care_course: patient.newborn_care_course,
                pelvic_physiotherapy: patient.pelvic_physiotherapy,
                breastfeeding_workshop: patient.breastfeeding_workshop,
                pediatric_consultation: patient.pediatric_consultation,
                nutritional_monitoring: patient.nutritional_monitoring,
                commercial_conditions: patient.commercial_conditions,
                payment_records: patient.payment_records,
                gestational_observations: patient.gestational_observations,
                weeks_20_date: patient.weeks_20_date,
                weeks_30_date: patient.weeks_30_date,
                weeks_32_date: patient.weeks_32_date,
                weeks_36_date: patient.weeks_36_date
            };
            const changedFields: string[] = [];
            const oldValues: Record<string, any> = {};
            const newValues: Record<string, any> = {};
            const resolveProfessionalName = (fieldName: string, userId: string | null): string =>{
                if (!userId || userId === 'none') return 'Não informado';
                const allProfessionals = [
                    ...obstetricians,
                    ...obstetricNurses,
                    ...doulas,
                    ...pediatricians,
                    ...nutritionists,
                    ...lactationConsultants,
                    ...pelvicPhysiotherapists
                ];
                const professional = allProfessionals.find((p)=>p.id === userId);
                return professional ? professional.full_name : userId;
            };
            Object.keys(patientData).forEach((key)=>{
                if (key === 'updated_at') return;
                if (patientData[key as keyof typeof patientData] !== originalPatientData[key as keyof typeof originalPatientData]) {
                    changedFields.push(key);
                    let oldValue = originalPatientData[key as keyof typeof originalPatientData];
                    let newValue = patientData[key as keyof typeof patientData];
                    if (key.includes('_id') && (key.includes('obstetrician') || key.includes('nurse') || key.includes('doula') || key.includes('pediatrician') || key.includes('nutritionist') || key.includes('lactation') || key.includes('physiotherapist'))) {
                        oldValue = resolveProfessionalName(key, oldValue);
                        newValue = resolveProfessionalName(key, newValue);
                    }
                    oldValues[key] = oldValue;
                    newValues[key] = newValue;
                }
            });
            const { error } = await supabase.from('patients').update(patientData).eq('id', patient.id);
            if (error) {
                console.error('Erro ao atualizar paciente:', error);
                throw error;
            }
            if (changedFields.length > 0 && user?.id) {
                try {
                    console.log('Dados do usuário para histórico:', {
                        id: user.id,
                        name: user.name,
                        full_name: user.full_name,
                        role: user.role,
                        user_type: user.user_type
                    });
                    await createHistoryEntry(patient.id, 'update', changedFields, oldValues, newValues, user.id, user.name || user.full_name || 'Usuário não identificado', user.role || user.user_type || 'unknown');
                } catch (historyError) {
                    console.error('Erro ao criar entrada no histórico:', historyError);
                }
            }
            toast.success('Paciente atualizada com sucesso!');
            onSuccess();
        } catch (error) {
            console.error('Erro na atualização:', error);
            toast.error('Erro ao atualizar paciente');
        } finally{
            setIsSubmitting(false);
        }
    };
    return (<div className="space-y-6" data-spec-id="edit-patient-form">
            <div className="flex items-center justify-between" data-spec-id="form-header">
                <h2 className="text-2xl font-bold text-gray-900" data-spec-id="form-title">
                    Editar Paciente
                </h2>
                <div className="flex gap-2" data-spec-id="form-actions">
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting} data-spec-id="cancel-button">
                        <X className="h-4 w-4 mr-2" data-spec-id="Wr5ftpTg9bdXkq1E"/>
                        Cancelar
                    </Button>
                    <Button type="submit" form="edit-patient-form" disabled={isSubmitting} data-spec-id="save-button">
                        {isSubmitting ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" data-spec-id="rxGPzFgdplC8ZQ3Q"/>) : (<Save className="h-4 w-4 mr-2" data-spec-id="79F3io68Nx0fsmmE"/>)}
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-spec-id="patient-form">
                {}
                <Card data-spec-id="personal-info-section">
                    <CardHeader data-spec-id="personal-info-header">
                        <CardTitle className="flex items-center space-x-2" data-spec-id="personal-info-title">
                            <UserPlus className="h-5 w-5" data-spec-id="pDjMq3VjYCr9b7JC"/>
                            <span data-spec-id="D3SbhsxkPX84x6gx">Informações Pessoais</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-spec-id="personal-info-content">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="personal-info-grid">
                            <div className="space-y-2" data-spec-id="full-name-field">
                                <Label htmlFor="nomeCompleto" data-spec-id="tov5aDh8lAdI9us9">Nome Completo *</Label>
                                <Controller name="nomeCompleto" control={control} render={({ field })=>(<Input id="nomeCompleto" value={field.value} onChange={(e)=>{
            const rawValue = e.target.value;
            field.onChange(rawValue);
        }} onBlur={(e)=>{
            const formattedValue = formatName(e.target.value);
            field.onChange(formattedValue);
            field.onBlur();
        }} className={errors.nomeCompleto ? 'border-red-500' : ''} data-spec-id="SyXijkwMmVG5URH3"/>)} data-spec-id="f7fKcwhv6LLzxIOo"/>
                                {errors.nomeCompleto && (<p className="text-sm text-red-600" data-spec-id="Ybyp12kZR4gH7eyy">{errors.nomeCompleto.message}</p>)}
                            </div>

                            <div className="space-y-2" data-spec-id="birth-date-field">
                                <Label htmlFor="dataNascimento" data-spec-id="nLMJbISNVRjAz9BC">Data de Nascimento *</Label>
                                <div className="flex items-center space-x-2" data-spec-id="0D6my14K6hZ1797u">
                                    <Input id="dataNascimento" type="date" {...register('dataNascimento')} className={errors.dataNascimento ? 'border-red-500' : ''} data-spec-id="7WldUbUbMT0RlrrH"/>
                                    {patientAge !== null && (<Badge variant="outline" data-spec-id="patient-age-badge">
                                            {patientAge} anos
                                        </Badge>)}
                                </div>
                                {errors.dataNascimento && (<p className="text-sm text-red-600" data-spec-id="2VtmqCLTfJabOUkP">{errors.dataNascimento.message}</p>)}
                            </div>

                            <div className="space-y-2" data-spec-id="phone-field">
                                <Label htmlFor="telefone" data-spec-id="mvuUQPmOKhNwVF7y">Telefone *</Label>
                                <Input id="telefone" {...register('telefone')} onChange={(e)=>handlePhoneChange(e.target.value)} placeholder="(31) 99999-9999" className={errors.telefone ? 'border-red-500' : ''} data-spec-id="Cy6IPqZY0kriSDf1"/>
                                {errors.telefone && (<p className="text-sm text-red-600" data-spec-id="a57MZBII4lFJ0kuW">{errors.telefone.message}</p>)}
                            </div>

                            <div className="space-y-2" data-spec-id="partner-field">
                                <Label htmlFor="nomeCompanheiro" data-spec-id="lr4LTXhrtCu87HYe">Nome do Companheiro</Label>
                                <Controller name="nomeCompanheiro" control={control} render={({ field })=>(<Input id="nomeCompanheiro" placeholder="Opcional" value={field.value || ''} onChange={(e)=>{
            const rawValue = e.target.value;
            field.onChange(rawValue);
        }} onBlur={(e)=>{
            const formattedValue = formatPartnerName(e.target.value);
            field.onChange(formattedValue);
            field.onBlur();
        }} data-spec-id="bgURHPJ4jWqFekBK"/>)} data-spec-id="Iy2MTX5H99t9X1kF"/>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {}
                <Card data-spec-id="address-section">
                    <CardHeader data-spec-id="address-header">
                        <CardTitle className="flex items-center space-x-2" data-spec-id="address-title">
                            <MapPin className="h-5 w-5" data-spec-id="odWLzs13rrUh8dLS"/>
                            <span data-spec-id="li5b4xTZ45S1qDq3">Endereço</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-spec-id="address-content">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-spec-id="address-grid">
                            <div className="space-y-2" data-spec-id="cep-field">
                                <Label htmlFor="cep" data-spec-id="yJFfnYqi9ne3lZXU">CEP *</Label>
                                <Input id="cep" {...register('cep')} onChange={(e)=>handleCEPChange(e.target.value)} placeholder="00000-000" className={errors.cep ? 'border-red-500' : ''} data-spec-id="AN6zX3rPnnNFzxVa"/>
                                {cepLoading && <p className="text-sm text-blue-600" data-spec-id="m6Gl0a91c9ym5HOb">Buscando endereço...</p>}
                                {cepError && <p className="text-sm text-red-600" data-spec-id="0usvfYaiKnhxZKNT">{cepError}</p>}
                                {errors.cep && <p className="text-sm text-red-600" data-spec-id="P0rXY3RWKOMrlOgt">{errors.cep.message}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-2" data-spec-id="street-field">
                                <Label htmlFor="logradouro" data-spec-id="JQvrfACcdibuUK6W">Logradouro *</Label>
                                <Input id="logradouro" {...register('logradouro')} className={errors.logradouro ? 'border-red-500' : ''} data-spec-id="t2aL56lL9WWSC3bI"/>
                                {errors.logradouro && (<p className="text-sm text-red-600" data-spec-id="vmv7bLrUEyFDClKt">{errors.logradouro.message}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-spec-id="address-details-grid">
                            <div className="space-y-2" data-spec-id="number-field">
                                <Label htmlFor="numero" data-spec-id="6zltx2RaNZfizMNM">Número</Label>
                                <Input id="numero" {...register('numero')} placeholder="123" data-spec-id="ufLzHmy4dpkFlUCr"/>
                            </div>

                            <div className="space-y-2" data-spec-id="complement-field">
                                <Label htmlFor="complemento" data-spec-id="DzDMgwpMA2ptqi1z">Complemento</Label>
                                <Input id="complemento" {...register('complemento')} placeholder="Apt 45" data-spec-id="UoOMEoYDYHzH7tac"/>
                            </div>

                            <div className="space-y-2" data-spec-id="neighborhood-field">
                                <Label htmlFor="bairro" data-spec-id="eAYPNR4nMSfXnmGf">Bairro *</Label>
                                <Input id="bairro" {...register('bairro')} className={errors.bairro ? 'border-red-500' : ''} data-spec-id="SDt4g7v5iqZJ8rxN"/>
                                {errors.bairro && (<p className="text-sm text-red-600" data-spec-id="LmxsquPajLoVHiRo">{errors.bairro.message}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="city-state-grid">
                            <div className="space-y-2" data-spec-id="city-field">
                                <Label htmlFor="cidade" data-spec-id="Xt4SzlnnVPQ0FbP4">Cidade *</Label>
                                <Input id="cidade" {...register('cidade')} className={errors.cidade ? 'border-red-500' : ''} data-spec-id="UFv9aFPaeEiOybf6"/>
                                {errors.cidade && (<p className="text-sm text-red-600" data-spec-id="2m993osGvpG7OeY0">{errors.cidade.message}</p>)}
                            </div>

                            <div className="space-y-2" data-spec-id="state-field">
                                <Label htmlFor="estado" data-spec-id="4BfXQBc0Jv7PuWao">Estado *</Label>
                                <Input id="estado" {...register('estado')} className={errors.estado ? 'border-red-500' : ''} data-spec-id="xtE1LQ5nsemlA9zX"/>
                                {errors.estado && (<p className="text-sm text-red-600" data-spec-id="aIyXTKy3IAnqsgo0">{errors.estado.message}</p>)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {}
                <Card data-spec-id="pregnancy-section">
                    <CardHeader data-spec-id="pregnancy-header">
                        <CardTitle className="flex items-center space-x-2" data-spec-id="pregnancy-title">
                            <Baby className="h-5 w-5" data-spec-id="sejymBMC3RJ4QWCr"/>
                            <span data-spec-id="cc0bv7zcEmQjeZLM">Informações da Gestação</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-spec-id="pregnancy-content">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="pregnancy-grid">
                            <div className="space-y-2" data-spec-id="dpp-field">
                                <Label htmlFor="dpp" data-spec-id="WdFuARpE7DeK7dRi">Data Provável do Parto (DPP) *</Label>
                                <div className="flex items-center space-x-2" data-spec-id="B45Sf6Nadezj6CUA">
                                    <Input id="dpp" type="date" {...register('dpp')} className={errors.dpp ? 'border-red-500' : ''} data-spec-id="luQ4lqrvTqrytdEu"/>
                                    {gestationalAge && (<Badge variant="outline" data-spec-id="gestational-age-badge">
                                            {gestationalAge.weeks}s {gestationalAge.days}d
                                        </Badge>)}
                                </div>
                                {errors.dpp && <p className="text-sm text-red-600" data-spec-id="zIJsF0A4u7NSUmLj">{errors.dpp.message}</p>}
                            </div>

                            <div className="space-y-2" data-spec-id="baby-name-field">
                                <Label htmlFor="nomeBebe" data-spec-id="iYBz0GjGIZRsXxME">Nome do Bebê</Label>
                                <Controller name="nomeBebe" control={control} render={({ field })=>(<Input id="nomeBebe" placeholder="Opcional" value={field.value || ''} onChange={(e)=>{
            const rawValue = e.target.value;
            field.onChange(rawValue);
        }} onBlur={(e)=>{
            const formattedValue = formatBabyName(e.target.value);
            field.onChange(formattedValue);
            field.onBlur();
        }} data-spec-id="bdDAIA4MY3bqT77P"/>)} data-spec-id="Jpj0niOQRkNk0gO9"/>
                            </div>
                        </div>

                        <div className="space-y-2" data-spec-id="delivery-type-field">
                            <Label htmlFor="viaPartoEscolhida" data-spec-id="Ln3JdrtWkfpJG1r7">Via de Parto Escolhida *</Label>
                            <Controller name="viaPartoEscolhida" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="PDDI0G56JJZMr64X">
                                        <SelectTrigger className={errors.viaPartoEscolhida ? 'border-red-500' : ''} data-spec-id="hp8gSUY4YhBTr4Ko">
                                            <SelectValue placeholder="Selecione a via de parto" data-spec-id="l5W0XBs4Yav4sSUO"/>
                                        </SelectTrigger>
                                        <SelectContent data-spec-id="I81lzCBEDpJJkleS">
                                            <SelectItem value="nao_definido" data-spec-id="OaOEDRp3ftj2K4xZ">Não Definido</SelectItem>
                                            <SelectItem value="normal" data-spec-id="3Oz7oigcRRFZfyIu">Parto Normal</SelectItem>
                                            <SelectItem value="cesariana" data-spec-id="e8GF9gt9pyKizIJk">Cesariana</SelectItem>
                                        </SelectContent>
                                    </Select>)} data-spec-id="ijeN1cpDOPAYITft"/>
                            {errors.viaPartoEscolhida && (<p className="text-sm text-red-600" data-spec-id="4LT9qDrwEz13ftrY">{errors.viaPartoEscolhida.message}</p>)}
                        </div>
                    </CardContent>
                </Card>

                {}
                <Card data-spec-id="medical-team-section">
                    <CardHeader data-spec-id="medical-team-header">
                        <CardTitle className="flex items-center space-x-2" data-spec-id="medical-team-title">
                            <Heart className="h-5 w-5" data-spec-id="HSgXLWl2grPQ3liN"/>
                            <span data-spec-id="qdB0lLHLsjur3fR8">Equipe Médica</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-spec-id="medical-team-content">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="medical-team-grid">
                            {}
                            <div className="space-y-2" data-spec-id="obstetrician-field">
                                <Label htmlFor="obstetraResponsavel" data-spec-id="xU0jbGW4TJ15hkz8">Obstetra Responsável *</Label>
                                <Controller name="obstetraResponsavel" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="oPsS9k2vr3SqHG78">
                                            <SelectTrigger className={errors.obstetraResponsavel ? 'border-red-500' : ''} data-spec-id="2ZFQWq4KadJM1HD3">
                                                <SelectValue placeholder="Selecione o obstetra" data-spec-id="1MAhDyjSOQvrUCAP"/>
                                            </SelectTrigger>
                                            <SelectContent data-spec-id="XVFhhBhfoJBjP614">
                                                {obstetricians.map((obstetrician)=>(<SelectItem key={obstetrician.id} value={obstetrician.id} data-spec-id="inE4VwLslHvfahCr">
                                                        {obstetrician.full_name}
                                                    </SelectItem>))}
                                            </SelectContent>
                                        </Select>)} data-spec-id="5LJIfTbIGXkoWdEV"/>
                                {errors.obstetraResponsavel && (<p className="text-sm text-red-600" data-spec-id="m0z7sK5NZYFyLbf9">{errors.obstetraResponsavel.message}</p>)}
                            </div>

                            {}
                            {viaPartoEscolhida === 'normal' && (<div className="space-y-2" data-spec-id="obstetric-nurse-field">
                                    <Label htmlFor="enfermeiraObstetrica" data-spec-id="qSUWqfVkkVWA2T2Q">Enfermeira Obstétrica</Label>
                                    <Controller name="enfermeiraObstetrica" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="vwWtlaEgHN2rXkwI">
                                                <SelectTrigger data-spec-id="x1HSLWGZUdSJkGQh">
                                                    <SelectValue placeholder="Selecione a enfermeira" data-spec-id="wBeChgoXMDC9Oy4Z"/>
                                                </SelectTrigger>
                                                <SelectContent data-spec-id="c6DFhXKK1cqCpZBa">
                                                    <SelectItem value="none" data-spec-id="tPPxFaVNwGJsmsvh">Nenhuma</SelectItem>
                                                    {obstetricNurses.map((nurse)=>(<SelectItem key={nurse.id} value={nurse.id} data-spec-id="Mz6Ng8c4pTaeScYe">
                                                            {nurse.full_name}
                                                        </SelectItem>))}
                                                </SelectContent>
                                            </Select>)} data-spec-id="KbuwsYyxiQmtRoTV"/>
                                </div>)}

                            {}
                            {viaPartoEscolhida === 'normal' && (<div className="space-y-2" data-spec-id="doula-field">
                                    <Label htmlFor="doula" data-spec-id="IT2dN3IAcwh8XgAn">Doula</Label>
                                    <Controller name="doula" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="qvQ0Nmz9DJeAHzto">
                                                <SelectTrigger data-spec-id="R32Ht0ZyqP5vViHv">
                                                    <SelectValue placeholder="Selecione a doula" data-spec-id="8b2mB5Uh1BJkXAzA"/>
                                                </SelectTrigger>
                                                <SelectContent data-spec-id="cBFgnwK7xateg1nE">
                                                    <SelectItem value="none" data-spec-id="E0CaxexlDWF6PdRV">Nenhuma</SelectItem>
                                                    {doulas.map((doula)=>(<SelectItem key={doula.id} value={doula.id} data-spec-id="AMMKMhXOwiLTO2RF">
                                                            {doula.full_name}
                                                        </SelectItem>))}
                                                </SelectContent>
                                            </Select>)} data-spec-id="5ZDZcsDKmLbcN9la"/>
                                </div>)}

                            {}
                            <div className="space-y-2" data-spec-id="nutritionist-field">
                                <Label htmlFor="nutricionista" data-spec-id="McDAsloNsfDpaxOE">Nutricionista</Label>
                                <Controller name="nutricionista" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="zXIZWyKouH12MQp3">
                                            <SelectTrigger data-spec-id="CTz7iiMCbIABCuMP">
                                                <SelectValue placeholder="Selecione a nutricionista" data-spec-id="iT2vy9iGZXLJCURe"/>
                                            </SelectTrigger>
                                            <SelectContent data-spec-id="fDxY1anGdyyBUc9J">
                                                <SelectItem value="none" data-spec-id="IFMbv03i3taHoZ4R">Nenhuma</SelectItem>
                                                {nutritionists.map((nutritionist)=>(<SelectItem key={nutritionist.id} value={nutritionist.id} data-spec-id="BQgP9AcuzfMXoQjB">
                                                        {nutritionist.full_name}
                                                    </SelectItem>))}
                                            </SelectContent>
                                        </Select>)} data-spec-id="XhZdJe9YlZXNdqAJ"/>
                            </div>

                            {}
                            <div className="space-y-2" data-spec-id="physiotherapist-field">
                                <Label htmlFor="fisioterapeutaPelvica" data-spec-id="vrEkNBVgi8ehZpNG">Fisioterapeuta Pélvica</Label>
                                <Controller name="fisioterapeutaPelvica" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="3YrQ9cANKG8O9p5x">
                                            <SelectTrigger data-spec-id="GG2A8MdhaMZEP968">
                                                <SelectValue placeholder="Selecione a fisioterapeuta" data-spec-id="TASqcdCCDkSOzkdK"/>
                                            </SelectTrigger>
                                            <SelectContent data-spec-id="SfOBToUUDjDYXTNO">
                                                <SelectItem value="none" data-spec-id="ttaG6MocH9GIDPTS">Nenhuma</SelectItem>
                                                {pelvicPhysiotherapists.map((physiotherapist)=>(<SelectItem key={physiotherapist.id} value={physiotherapist.id} data-spec-id="PT4a1VakY66zWgif">
                                                        {physiotherapist.full_name}
                                                    </SelectItem>))}
                                            </SelectContent>
                                        </Select>)} data-spec-id="iZ68D6XxmRv8Y9yI"/>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {}
                <CommercialSection formData={{
        commercial_conditions: watchedFields.commercial_conditions,
        payment_records: watchedFields.payment_records,
        weeks_20_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_20_date : undefined,
        weeks_30_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_30_date : undefined,
        weeks_32_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_32_date : undefined,
        weeks_36_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_36_date : undefined
    }} onChange={(field, value)=>setValue(field as any, value)} data-spec-id="edit-patient-commercial-section"/>

                {}
                <MedicalObservationsSection value={watchedFields.gestational_observations || ''} onChange={(value)=>setValue('gestational_observations', value)} data-spec-id="edit-patient-medical-observations"/>

                {}
                <Card data-spec-id="services-section">
                    <CardHeader data-spec-id="services-header">
                        <CardTitle className="flex items-center space-x-2" data-spec-id="services-title">
                            <Heart className="h-5 w-5" data-spec-id="9Km45PDXLQ8pE0PV"/>
                            <span data-spec-id="cY8lpm2uoWvYNnqe">Serviços Contratados</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-spec-id="services-content">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="services-grid">
                            {}
                            <div className="flex items-center space-x-2" data-spec-id="breastfeeding-service">
                                <Controller name="consulta_amamentacao" control={control} render={({ field })=>(<Checkbox id="consulta_amamentacao" checked={field.value} onCheckedChange={field.onChange} data-spec-id="1lZZNtypSxUb9dTM"/>)} data-spec-id="7rAPrEWXgXjhcCxx"/>
                                <Label htmlFor="consulta_amamentacao" data-spec-id="FsfgXrVHqrnoI8qw">Consultoria de Amamentação</Label>
                            </div>

                            {}
                            {consultaAmamentacao && (<div className="space-y-2" data-spec-id="lactation-consultant-field">
                                    <Label htmlFor="consultoraAmamentacao" data-spec-id="R4PQMWJzcV8hTfQY">Consultora de Amamentação</Label>
                                    <Controller name="consultoraAmamentacao" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="1wJOig3bfzpH3XrN">
                                                <SelectTrigger data-spec-id="KfKloOna4ijcoexh">
                                                    <SelectValue placeholder="Selecione a consultora" data-spec-id="BqMawFabVHFCxjIi"/>
                                                </SelectTrigger>
                                                <SelectContent data-spec-id="frexbsIgD7ykEKQN">
                                                    <SelectItem value="none" data-spec-id="BqoHJQu1kOvgU4hO">Nenhuma</SelectItem>
                                                    {lactationConsultants.map((consultant)=>(<SelectItem key={consultant.id} value={consultant.id} data-spec-id="uBEwZvZABvAtgYkf">
                                                            {consultant.full_name}
                                                        </SelectItem>))}
                                                </SelectContent>
                                            </Select>)} data-spec-id="mll7Zrqp9tGvp5xU"/>
                                </div>)}

                            {}
                            <div className="flex items-center space-x-2" data-spec-id="newborn-care-service">
                                <Controller name="curso_cuidados_recem_nascido" control={control} render={({ field })=>(<Checkbox id="curso_cuidados_recem_nascido" checked={field.value} onCheckedChange={field.onChange} data-spec-id="MuAHDHscxRsb1IqT"/>)} data-spec-id="TRVhpziPvQ35Uqld"/>
                                <Label htmlFor="curso_cuidados_recem_nascido" data-spec-id="Z0VyL9cJmQLFO1s1">Curso Cuidados Recém-Nascido</Label>
                            </div>

                            {}
                            <div className="flex items-center space-x-2" data-spec-id="pediatric-service">
                                <Controller name="consulta_pediatrica" control={control} render={({ field })=>(<Checkbox id="consulta_pediatrica" checked={field.value} onCheckedChange={field.onChange} data-spec-id="4oWDfNVOEd2LsGgC"/>)} data-spec-id="yJjUpivkybLf2W27"/>
                                <Label htmlFor="consulta_pediatrica" data-spec-id="NvcFRn7V0Fvzn1oQ">Consulta Pediátrica</Label>
                            </div>

                            {}
                            {consultaPediatrica && (<div className="space-y-2" data-spec-id="pediatrician-field">
                                    <Label htmlFor="pediatraResponsavel" data-spec-id="TKNmKb3tAdFA9beN">Pediatra Responsável</Label>
                                    <Controller name="pediatraResponsavel" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="PxpkRBkSzJDVxMr1">
                                                <SelectTrigger data-spec-id="vsQh9ahNUr0z6dDk">
                                                    <SelectValue placeholder="Selecione o pediatra" data-spec-id="NcXsi2bDc1TSYNZM"/>
                                                </SelectTrigger>
                                                <SelectContent data-spec-id="JXHdRzppWvaixt5a">
                                                    <SelectItem value="none" data-spec-id="pPivd2RfZkwTxn0G">Nenhum</SelectItem>
                                                    {pediatricians.map((pediatrician)=>(<SelectItem key={pediatrician.id} value={pediatrician.id} data-spec-id="l2QOneBvLb8sQcDg">
                                                            {pediatrician.full_name}
                                                        </SelectItem>))}
                                                </SelectContent>
                                            </Select>)} data-spec-id="8e9sLDZydr8EgPrA"/>
                                </div>)}

                            {}
                            <div className="flex items-center space-x-2" data-spec-id="nutritional-service">
                                <Controller name="acompanhamento_nutricional" control={control} render={({ field })=>(<Checkbox id="acompanhamento_nutricional" checked={field.value} onCheckedChange={field.onChange} data-spec-id="SvJnLRh0ZXr9MytE"/>)} data-spec-id="9A6R3BX71iAVi2Qx"/>
                                <Label htmlFor="acompanhamento_nutricional" data-spec-id="6jBpONFjvsiJ3613">Acompanhamento Nutricional</Label>
                            </div>

                            {}
                            <div className="flex items-center space-x-2" data-spec-id="pelvic-physiotherapy-service">
                                <Controller name="fisioterapia_pelvica" control={control} render={({ field })=>(<Checkbox id="fisioterapia_pelvica" checked={field.value} onCheckedChange={field.onChange} data-spec-id="NDG2ld5eAM1hY4xK"/>)} data-spec-id="4M6TALwZ6mttYhOb"/>
                                <Label htmlFor="fisioterapia_pelvica" data-spec-id="AzenXxgB4lRYO9hF">Fisioterapia Pélvica</Label>
                            </div>

                            {}
                            {viaPartoEscolhida === 'normal' && (<div className="flex items-center space-x-2" data-spec-id="birth-preparation-service">
                                    <Controller name="curso_preparo_parto" control={control} render={({ field })=>(<Checkbox id="curso_preparo_parto" checked={field.value} onCheckedChange={field.onChange} data-spec-id="LprwDdXNqw9k5wuu"/>)} data-spec-id="9H95R0O8SEh0Tu5O"/>
                                    <Label htmlFor="curso_preparo_parto" data-spec-id="G8pjWMOduaBTBkG1">Curso Preparo para o Parto</Label>
                                </div>)}
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>);
};
export default EditPatientForm;
