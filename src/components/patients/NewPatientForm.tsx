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
import { UserPlus, Calendar, Phone, MapPin, Heart, Baby, Lock, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCEP } from '@/hooks/useCEP';
import { usePatients, useUsers } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone, isValidPhone } from '@/utils/phoneUtils';
import { formatCEP, isValidCEP } from '@/utils/cepUtils';
import { calculateDPP, formatDate, calculateGestationalAge, formatGestationalAge, normalizeDateForDB } from '@/utils/dateUtils';
import { PartoVia, PARTO_VIA_LABELS, OBSTETRA_LABELS } from '@/types/patient';
import { calculateGestationalWeekDates } from '@/utils/gestationalUtils';
import CommercialSection from './CommercialSection';
import MedicalObservationsSection from './MedicalObservationsSection';
interface NewPatientFormProps {
    onSuccess: () => void;
}
const patientSchema = z.object({
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
type PatientFormData = z.infer<typeof patientSchema>;
const NewPatientForm: React.FC<NewPatientFormProps> = ({ onSuccess })=>{
    const { user } = useAuth();
    const { loading: cepLoading, error: cepError, fetchCEP } = useCEP();
    const [gestationalAge, setGestationalAge] = useState<{
        weeks: number;
        days: number;
    } | null>(null);
    const [patientAge, setPatientAge] = useState<number | null>(null);
    const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting }, clearErrors } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            viaPartoEscolhida: 'nao_definido',
            obstetraResponsavel: '',
            consultoraAmamentacao: '',
            pediatraResponsavel: '',
            consulta_amamentacao: false,
            curso_cuidados_recem_nascido: false,
            consulta_pediatrica: false,
            acompanhamento_nutricional: false,
            fisioterapia_pelvica: false,
            curso_preparo_parto: false,
            commercial_conditions: '',
            payment_records: '',
            gestational_observations: ''
        }
    });
    const watchedFields = watch();
    const viaPartoEscolhida = watch('viaPartoEscolhida');
    const dpp = watch('dpp');
    const dataNascimento = watch('dataNascimento');
    const consultaAmamentacao = watch('consulta_amamentacao');
    const consultaPediatrica = watch('consulta_pediatrica');
    useEffect(()=>{
        if (dpp) {
            console.log('useEffect DPP - Input:', dpp);
            const [year, month, day] = dpp.split('-').map(Number);
            const dppDate = new Date(year, month - 1, day);
            console.log('useEffect DPP - Data criada:', dppDate);
            if (!isNaN(dppDate.getTime())) {
                const age = calculateGestationalAge(dppDate);
                console.log('useEffect DPP - Idade gestacional:', age);
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
            setValue('enfermeiraObstetrica', '');
            setValue('doula', '');
            setValue('curso_preparo_parto', false);
        }
    }, [
        viaPartoEscolhida,
        setValue
    ]);
    useEffect(()=>{
        if (!consultaAmamentacao) {
            setValue('consultoraAmamentacao', '');
        }
    }, [
        consultaAmamentacao,
        setValue
    ]);
    useEffect(()=>{
        if (!consultaPediatrica) {
            setValue('pediatraResponsavel', '');
        }
    }, [
        consultaPediatrica,
        setValue
    ]);
    useEffect(()=>{
        if (dataNascimento) {
            const birthDate = new Date(dataNascimento);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                setPatientAge(age - 1);
            } else {
                setPatientAge(age);
            }
        } else {
            setPatientAge(null);
        }
    }, [
        dataNascimento
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
    const { createPatient, isCreating } = usePatients();
    const { data: professionals = [] } = useUsers();
    const onSubmit = async (data: PatientFormData)=>{
        try {
            console.log('Dados do formulário:', data);
            const { data: users, error: usersError } = await supabase.from('users').select('id, user_type').in('user_type', [
                'obstetra',
                'enfermeira_obstetrica',
                'doula',
                'pediatra',
                'nutricionista',
                'fisioterapeuta_pelvica',
                'consultora_amamentacao'
            ]);
            if (usersError) {
                console.error('Erro ao buscar profissionais:', usersError);
                throw usersError;
            }
            const obstetrician = users?.find((u)=>u.id === data.obstetraResponsavel);
            const nurse = data.enfermeiraObstetrica ? users?.find((u)=>u.id === data.enfermeiraObstetrica) : null;
            const doula = data.doula ? users?.find((u)=>u.id === data.doula) : null;
            const lactationConsultant = data.consultoraAmamentacao ? users?.find((u)=>u.id === data.consultoraAmamentacao) : null;
            const pediatrician = data.pediatraResponsavel ? users?.find((u)=>u.id === data.pediatraResponsavel) : null;
            const nutritionist = users?.find((u)=>u.user_type === 'nutricionista');
            const physiotherapist = users?.find((u)=>u.user_type === 'fisioterapeuta_pelvica');
            console.log('onSubmit - DPP original:', data.dpp);
            const [year, month, day] = data.dpp.split('-').map(Number);
            const dppDate = new Date(year, month - 1, day);
            console.log('onSubmit - Data DPP criada:', dppDate);
            const gestAge = calculateGestationalAge(dppDate);
            console.log('onSubmit - Idade gestacional calculada:', gestAge);
            const gestationalWeekDates = calculateGestationalWeekDates(dppDate);
            console.log('onSubmit - Datas das semanas gestacionais:', gestationalWeekDates);
            const patientData = {
                full_name: data.nomeCompleto,
                birth_date: normalizeDateForDB(data.dataNascimento),
                phone: data.telefone,
                zip_code: data.cep.replace(/\D/g, ''),
                street: data.logradouro,
                number: data.numero || null,
                complement: data.complemento || null,
                neighborhood: data.bairro,
                city: data.cidade,
                state: data.estado,
                partner_name: data.nomeCompanheiro || null,
                baby_name: data.nomeBebe || null,
                estimated_due_date: normalizeDateForDB(data.dpp),
                current_gestational_age_weeks: gestAge.weeks,
                current_gestational_age_days: gestAge.days,
                registration_date: new Date().toISOString().split('T')[0],
                registration_gestational_age_weeks: gestAge.weeks,
                registration_gestational_age_days: gestAge.days,
                preferred_delivery_type: data.viaPartoEscolhida,
                obstetrician_id: obstetrician?.id || null,
                obstetric_nurse_id: nurse?.id || null,
                doula_id: doula?.id || null,
                pediatrician_id: pediatrician?.id || null,
                nutritionist_id: nutritionist?.id || null,
                lactation_consultant_id: lactationConsultant?.id || null,
                pelvic_physiotherapist_id: physiotherapist?.id || null,
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
                is_born: false
            };
            console.log('Dados preparados para inserção:', patientData);
            if (!user?.id) {
                throw new Error('Usuário não está autenticado');
            }
            createPatient({
                patientData,
                userId: user.id
            });
            onSuccess();
        } catch (error) {
            console.error('Erro ao cadastrar paciente:', error);
            toast.error('Erro ao cadastrar paciente. Tente novamente.');
        }
    };
    const isFieldDisabled = (field: 'enfermeiraObstetrica' | 'doula' | 'curso_preparo_parto')=>{
        return viaPartoEscolhida === 'cesariana';
    };
    return (<div className="space-y-6" data-spec-id="new-patient-form">
      <div className="flex items-center justify-between" data-spec-id="M1H3aqGEPNVks6Sa">
        <div data-spec-id="7I5R6it2U09I80kk">
          <h1 className="text-2xl font-bold text-gray-900" data-spec-id="lxZw9LCuFbWsol4k">Cadastrar Nova Paciente</h1>
          <p className="text-gray-600" data-spec-id="Qq4wcyKfoE2k4ZOA">Adicione uma nova paciente ao sistema</p>
        </div>
      </div>

      <Card data-spec-id="0xTdT5uZ3yO1pcGS">
        <CardHeader data-spec-id="dl5P85zj1MYj6GrW">
          <CardTitle className="flex items-center" data-spec-id="gDBX2MUs3qfCCw2J">
            <UserPlus className="mr-2 h-5 w-5 text-[#D2AE6D]" data-spec-id="xXGKoychsY8hORZU"/>
            Dados da Paciente
          </CardTitle>
        </CardHeader>
        <CardContent data-spec-id="PHuQEA4jG2eJAmCQ">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-spec-id="patient-form">
            {}
            <div className="space-y-4" data-spec-id="G9hVmxjItzjVoCCr">
              <h3 className="text-lg font-medium text-gray-900" data-spec-id="p7WjSFXJydwLROaJ">Dados Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="mSWT7kVbrO7I86zK">
                <div className="space-y-2" data-spec-id="rs0uBPi3YuVKEc7r">
                  <Label htmlFor="nomeCompleto" data-spec-id="tY5hTDMODxQh46L7">
                    Nome Completo <span className="text-red-500" data-spec-id="OEC3xPKuBNpmKlZK">*</span>
                  </Label>
                  <Input id="nomeCompleto" {...register('nomeCompleto')} placeholder="Nome completo da paciente" data-spec-id="nome-completo-input"/>
                  {errors.nomeCompleto && (<p className="text-sm text-red-500" data-spec-id="vdTamvsYbNiI11Oo">{errors.nomeCompleto.message}</p>)}
                </div>

                <div className="space-y-2" data-spec-id="ts5fIrGWpx2Vno1A">
                  <Label htmlFor="dataNascimento" data-spec-id="H0gv2SCuMiJkueZp">
                    Data de Nascimento <span className="text-red-500" data-spec-id="p2tU6qBsch6d9std">*</span>
                  </Label>
                  <div className="flex items-center gap-2" data-spec-id="sRLvHPg4j0S55haI">
                    <Input id="dataNascimento" type="date" {...register('dataNascimento')} className="flex-1" data-spec-id="data-nascimento-input"/>
                    {patientAge !== null && (<Badge variant="outline" className="whitespace-nowrap" data-spec-id="8Z21Jci8SYMiL8wv">
                        {patientAge} ano{patientAge !== 1 ? 's' : ''}
                      </Badge>)}
                  </div>
                  {errors.dataNascimento && (<p className="text-sm text-red-500" data-spec-id="MEDEqSgjtlDiVpEz">{errors.dataNascimento.message}</p>)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="4vzNS7ZpdhzmueZ3">
                <div className="space-y-2" data-spec-id="xp51f2YrEii91wuI">
                  <Label htmlFor="dpp" className="flex items-center gap-2" data-spec-id="EWp6AoxWbpi5cl89">
                    Data Provável do Parto (DPP) <span className="text-red-500" data-spec-id="rqsyPvMWswlEwZIG">*</span>
                    <Tooltip data-spec-id="QVrNoKJtt3RwxDbo">
                      <TooltipTrigger asChild data-spec-id="Qes0nQpo55SLw7kG">
                        <Info className="h-4 w-4 text-gray-400" data-spec-id="XLmK7NxE5NCAyKd9"/>
                      </TooltipTrigger>
                      <TooltipContent data-spec-id="1S2ikXgOJjoeH6Vk">
                        <p data-spec-id="aSwdwy8BBwGBTrds">A idade gestacional será calculada automaticamente</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex items-center gap-2" data-spec-id="sRLvHPg4j0S55haI">
                    <Input id="dpp" type="date" {...register('dpp')} className="flex-1" data-spec-id="dpp-input"/>
                    {gestationalAge && (<Badge variant="outline" className="whitespace-nowrap" data-spec-id="8Z21Jci8SYMiL8wv">
                        {formatGestationalAge(gestationalAge.weeks, gestationalAge.days)}
                      </Badge>)}
                  </div>
                  {errors.dpp && (<p className="text-sm text-red-500" data-spec-id="Xk1jsas9qmyQHirF">{errors.dpp.message}</p>)}
                </div>

                <div className="space-y-2" data-spec-id="aQ9oSotAIEBWEW5S">
                  <Label htmlFor="telefone" data-spec-id="8gP1ohap1SAaL9a2">
                    Telefone <span className="text-red-500" data-spec-id="3kN0hlLHnQ0J8C2A">*</span>
                  </Label>
                  <Controller name="telefone" control={control} render={({ field })=>(<Input id="telefone" placeholder="(11) 99999-9999" value={field.value} onChange={(e)=>{
            field.onChange(e.target.value);
            handlePhoneChange(e.target.value);
        }} data-spec-id="telefone-input"/>)} data-spec-id="nPO8SeroKn0svL1X"/>
                  {errors.telefone && (<p className="text-sm text-red-500" data-spec-id="wzY8NDLhHPQnFHe9">{errors.telefone.message}</p>)}
                </div>
              </div>
            </div>

            <Separator data-spec-id="N7TmsrlrBLjC65E8"/>

            {}
            <div className="space-y-4" data-spec-id="d1dg6e9dXopyBXui">
              <h3 className="text-lg font-medium text-gray-900 flex items-center" data-spec-id="Fvk1bdjJiZ99X1bf">
                <MapPin className="mr-2 h-5 w-5" data-spec-id="sbhjR6zqA5gWVZ9i"/>
                Endereço Residencial
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-spec-id="Q0EPWrKZneys8JW2">
                <div className="space-y-2" data-spec-id="8xxRMeHbfN1BYM4n">
                  <Label htmlFor="cep" data-spec-id="yW19kA6kDpragr7o">
                    CEP <span className="text-red-500" data-spec-id="6TbsEajuLltGBlNU">*</span>
                  </Label>
                  <Controller name="cep" control={control} render={({ field })=>(<div className="relative" data-spec-id="3FqB0CqF9tsAefvg">
                        <Input id="cep" placeholder="00000-000" value={field.value} onChange={(e)=>{
            field.onChange(e.target.value);
            handleCEPChange(e.target.value);
        }} disabled={cepLoading} data-spec-id="cep-input"/>
                        {cepLoading && (<Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" data-spec-id="5A67n1VaYPVnx36k"/>)}
                      </div>)} data-spec-id="veGeckmMdURfMxhe"/>
                  {errors.cep && (<p className="text-sm text-red-500" data-spec-id="yDbBo6cA8Rx8peQz">{errors.cep.message}</p>)}
                  {cepError && (<p className="text-sm text-red-500" data-spec-id="AJZuhecVYN2ff3aU">{cepError}</p>)}
                </div>

                <div className="space-y-2 md:col-span-2" data-spec-id="khQf5ykhJx8OFBBg">
                  <Label htmlFor="logradouro" data-spec-id="MzgwyG8KelGBoEeV">
                    Logradouro <span className="text-red-500" data-spec-id="z0G3gcUOpSWA6UAQ">*</span>
                  </Label>
                  <Input id="logradouro" {...register('logradouro')} placeholder="Nome da rua, avenida, etc." data-spec-id="logradouro-input"/>
                  {errors.logradouro && (<p className="text-sm text-red-500" data-spec-id="3ikWnPBVsEwUW0IG">{errors.logradouro.message}</p>)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-spec-id="66IAVVg6M0NLmvZk">
                <div className="space-y-2" data-spec-id="twXEzsdlHJrF0cAq">
                  <Label htmlFor="numero" data-spec-id="gA5xVAPkO9cKT3bG">Número</Label>
                  <Input id="numero" {...register('numero')} placeholder="123" data-spec-id="numero-input"/>
                </div>

                <div className="space-y-2" data-spec-id="ZJvQWvnQEQNoaXjX">
                  <Label htmlFor="complemento" data-spec-id="1fD4eFAqK4xZLgd5">Complemento</Label>
                  <Input id="complemento" {...register('complemento')} placeholder="Apto 45" data-spec-id="complemento-input"/>
                </div>

                <div className="space-y-2" data-spec-id="wXDcCn3enq45EQcD">
                  <Label htmlFor="bairro" data-spec-id="HlwZcBNOqVVvze0L">
                    Bairro <span className="text-red-500" data-spec-id="6na5BDdI92gHzD2e">*</span>
                  </Label>
                  <Input id="bairro" {...register('bairro')} placeholder="Nome do bairro" data-spec-id="bairro-input"/>
                  {errors.bairro && (<p className="text-sm text-red-500" data-spec-id="2as1WTRdrZmuDlSD">{errors.bairro.message}</p>)}
                </div>

                <div className="space-y-2" data-spec-id="DJe5q5amzYjWATg8">
                  <Label htmlFor="cidade" data-spec-id="bZGDWIeEzfmWuj0s">
                    Cidade <span className="text-red-500" data-spec-id="88Pl0a6b1PLmMJbs">*</span>
                  </Label>
                  <Input id="cidade" {...register('cidade')} placeholder="Nome da cidade" data-spec-id="cidade-input"/>
                  {errors.cidade && (<p className="text-sm text-red-500" data-spec-id="cxFXDEuKBihWwRU6">{errors.cidade.message}</p>)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="N7vDQkN32DQCAbVs">
                <div className="space-y-2" data-spec-id="FSNjlquQEG9Qd9nq">
                  <Label htmlFor="estado" data-spec-id="Rr5BfN1BXdwly5Bx">
                    Estado <span className="text-red-500" data-spec-id="DiPx7oU1fFAXa7NZ">*</span>
                  </Label>
                  <Input id="estado" {...register('estado')} placeholder="SP" maxLength={2} data-spec-id="estado-input"/>
                  {errors.estado && (<p className="text-sm text-red-500" data-spec-id="uiengjBi7fLijn0i">{errors.estado.message}</p>)}
                </div>
              </div>
            </div>

            <Separator data-spec-id="uf5faMVj9UmYGryk"/>

            {}
            <div className="space-y-4" data-spec-id="f9Va454pXGRNr0eC">
              <h3 className="text-lg font-medium text-gray-900" data-spec-id="dPk5WSNQ6isQsIId">Dados Adicionais (Opcionais)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="iqOSkCpdQK0RKqNB">
                <div className="space-y-2" data-spec-id="R1xMWIrtEopI6ji1">
                  <Label htmlFor="nomeCompanheiro" data-spec-id="MlCtIpsXermPAzOK">Nome do(a) Companheiro(a)</Label>
                  <Input id="nomeCompanheiro" {...register('nomeCompanheiro')} placeholder="Nome do companheiro" data-spec-id="nome-companheiro-input"/>
                </div>

                <div className="space-y-2" data-spec-id="BAFnSbRSwep64TSL">
                  <Label htmlFor="nomeBebe" data-spec-id="NXIMTP6g2Iex4kFW">Nome do Bebê</Label>
                  <Input id="nomeBebe" {...register('nomeBebe')} placeholder="Nome escolhido para o bebê" data-spec-id="nome-bebe-input"/>
                </div>
              </div>
            </div>

            <Separator data-spec-id="qKyC8tbXEhjDdlEw"/>

            {}
            <CommercialSection formData={{
        commercial_conditions: watchedFields.commercial_conditions,
        payment_records: watchedFields.payment_records,
        weeks_20_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_20_date : undefined,
        weeks_30_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_30_date : undefined,
        weeks_32_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_32_date : undefined,
        weeks_36_date: dpp ? calculateGestationalWeekDates(new Date(dpp)).weeks_36_date : undefined
    }} onChange={(field, value)=>setValue(field as any, value)} data-spec-id="new-patient-commercial-section"/>

            <Separator data-spec-id="0v5BovGvAZa4s9V9"/>

            {}
            <MedicalObservationsSection value={watchedFields.gestational_observations || ''} onChange={(value)=>setValue('gestational_observations', value)} data-spec-id="new-patient-medical-observations"/>

            <Separator data-spec-id="medical-observations-separator"/>

            {}
            <div className="space-y-4" data-spec-id="8eZMZmj1XAUjqbRd">
              <h3 className="text-lg font-medium text-gray-900 flex items-center" data-spec-id="va9x8daAsdb4hfdM">
                <Heart className="mr-2 h-5 w-5" data-spec-id="u1nwjteagFx930yV"/>
                Dados Obstétricos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="07olm2O1Sy0IkVHD">
                <div className="space-y-2" data-spec-id="90g8Mtp6nt4bG6hG">
                  <Label data-spec-id="6Lu2ALlftsUP3yJb">Via de Parto Pretendida <span className="text-red-500" data-spec-id="t3grmii4TkeWTgHd">*</span></Label>
                  <Controller name="viaPartoEscolhida" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="via-parto-select">
                        <SelectTrigger data-spec-id="y1OJ1Lr0dchdO26b">
                          <SelectValue data-spec-id="Wu9zK8E50sI4S6p2"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="CKSRb1f1gW46X0YD">
                          <SelectItem value="normal" data-spec-id="BV7GeIiVzkDAea7A">Parto Normal</SelectItem>
                          <SelectItem value="cesariana" data-spec-id="BV7GeIiVzkDAea7A">Cesariana</SelectItem>
                          <SelectItem value="nao_definido" data-spec-id="BV7GeIiVzkDAea7A">Não Definido</SelectItem>
                        </SelectContent>
                      </Select>)} data-spec-id="MjJcQVS2CrKfpZdu"/>
                </div>

                <div className="space-y-2" data-spec-id="HOoj5pEOXTbrhS9v">
                  <Label data-spec-id="eECaVKUgBCoLCeqy">Obstetra Responsável <span className="text-red-500" data-spec-id="gzkcNqSOeWKRyfUk">*</span></Label>
                  <Controller name="obstetraResponsavel" control={control} render={({ field })=>(<Select value={field.value} onValueChange={field.onChange} data-spec-id="obstetra-select">
                        <SelectTrigger data-spec-id="t0dbMUthS5WorTWR">
                          <SelectValue placeholder="Selecione um obstetra" data-spec-id="dNw2Mg47ifCOr5JP"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="Bz5YuIjvPeckQr3R">
                          {professionals.filter((p)=>p.user_type === 'obstetra').map((obstetra)=>(<SelectItem key={obstetra.id} value={obstetra.id} data-spec-id="OXYIrTxk0RjHKo3F">
                              {obstetra.full_name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>)} data-spec-id="0CuoTqHYE4C6CaHF"/>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="qHDqIfFmfPXdnqxi">
                <div className="space-y-2" data-spec-id="9Ohhe2MAglmZ9Bxr">
                  <Label className="flex items-center gap-2" data-spec-id="mjLibV5f5ZfUSHIc">
                    Enfermeira Obstétrica
                    {isFieldDisabled('enfermeiraObstetrica') && (<Tooltip data-spec-id="RGGP25PimtevVUFJ">
                        <TooltipTrigger asChild data-spec-id="98ENt2aNt59uOHtE">
                          <Lock className="h-4 w-4 text-gray-400" data-spec-id="WCuZyxgjiymCXmbS"/>
                        </TooltipTrigger>
                        <TooltipContent data-spec-id="jDR0yxeookbXLqVI">
                          <p data-spec-id="h6Zfwwh35QUezBrF">Desabilitado para cesariana</p>
                        </TooltipContent>
                      </Tooltip>)}
                  </Label>
                  <Controller name="enfermeiraObstetrica" control={control} render={({ field })=>(<Select value={field.value || 'none'} onValueChange={(value)=>field.onChange(value === 'none' ? '' : value)} disabled={isFieldDisabled('enfermeiraObstetrica')} data-spec-id="enfermeira-select">
                        <SelectTrigger className={isFieldDisabled('enfermeiraObstetrica') ? 'bg-gray-100 text-gray-400' : ''} data-spec-id="4oRqB0nFeMZ9vzcK">
                          <SelectValue placeholder="Selecione uma enfermeira" data-spec-id="IN3YfXCegAydb5H7"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="Kf8paGTD6gJ8voLD">
                          <SelectItem value="none" data-spec-id="XLg8IgMlI5LT2Izr">Nenhuma selecionada</SelectItem>
                          {professionals.filter((p)=>p.user_type === 'enfermeira_obstetrica').map((enfermeira)=>(<SelectItem key={enfermeira.id} value={enfermeira.id} data-spec-id="GEfL2Oe7OrYgx1Gu">
                              {enfermeira.full_name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>)} data-spec-id="84jzY9F2Cda7FvnS"/>
                </div>

                <div className="space-y-2" data-spec-id="vPRRtkbMaqDWgtqb">
                  <Label className="flex items-center gap-2" data-spec-id="XtasqbFXEwTMyhoB">
                    Doula
                    {isFieldDisabled('doula') && (<Tooltip data-spec-id="86YdbSmMphWKk9tT">
                        <TooltipTrigger asChild data-spec-id="y2vNhuQSS4zNJ1OW">
                          <Lock className="h-4 w-4 text-gray-400" data-spec-id="b97bCBKUcwEj0KQ7"/>
                        </TooltipTrigger>
                        <TooltipContent data-spec-id="nXrh96S89ZF3rvNj">
                          <p data-spec-id="zWZI0GSo4vtIml7d">Desabilitado para cesariana</p>
                        </TooltipContent>
                      </Tooltip>)}
                  </Label>
                  <Controller name="doula" control={control} render={({ field })=>(<Select value={field.value || 'none'} onValueChange={(value)=>field.onChange(value === 'none' ? '' : value)} disabled={isFieldDisabled('doula')} data-spec-id="doula-select">
                        <SelectTrigger className={isFieldDisabled('doula') ? 'bg-gray-100 text-gray-400' : ''} data-spec-id="bjQHf151KQXsYsGR">
                          <SelectValue placeholder="Selecione uma doula" data-spec-id="d8r6N67MiVLry9Vf"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="RTOUy4EKMBrtoqcn">
                          <SelectItem value="none" data-spec-id="TRvZaTXdXz1zIlcb">Nenhuma selecionada</SelectItem>
                          {professionals.filter((p)=>p.user_type === 'doula').map((doula)=>(<SelectItem key={doula.id} value={doula.id} data-spec-id="wpA9FU7AWQ9jZTwX">
                              {doula.full_name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>)} data-spec-id="KTev1tpukbeoSR41"/>
                </div>
              </div>

              {}
              {consultaAmamentacao && (<div className="space-y-2" data-spec-id="consultora-amamentacao-field">
                  <Label data-spec-id="consultora-amamentacao-label">
                    Consultora de Amamentação <span className="text-red-500" data-spec-id="oNAj9awITHUmkjtB">*</span>
                  </Label>
                  <Controller name="consultoraAmamentacao" control={control} render={({ field })=>(<Select value={field.value || 'none'} onValueChange={(value)=>field.onChange(value === 'none' ? '' : value)} data-spec-id="consultora-amamentacao-select">
                        <SelectTrigger data-spec-id="consultora-amamentacao-trigger">
                          <SelectValue placeholder="Selecione uma consultora" data-spec-id="consultora-amamentacao-value"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="consultora-amamentacao-content">
                          <SelectItem value="none" data-spec-id="consultora-amamentacao-none">Nenhuma selecionada</SelectItem>
                          {professionals.filter((p)=>p.user_type === 'consultora_amamentacao').map((consultora)=>(<SelectItem key={consultora.id} value={consultora.id} data-spec-id="consultora-amamentacao-item">
                              {consultora.full_name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>)} data-spec-id="consultora-amamentacao-controller"/>
                </div>)}

              {}
              {consultaPediatrica && (<div className="space-y-2" data-spec-id="pediatra-field">
                  <Label data-spec-id="pediatra-label">
                    Pediatra <span className="text-red-500" data-spec-id="pediatra-required">*</span>
                  </Label>
                  <Controller name="pediatraResponsavel" control={control} render={({ field })=>(<Select value={field.value || 'none'} onValueChange={(value)=>field.onChange(value === 'none' ? '' : value)} data-spec-id="pediatra-select">
                        <SelectTrigger data-spec-id="pediatra-trigger">
                          <SelectValue placeholder="Selecione um pediatra" data-spec-id="pediatra-value"/>
                        </SelectTrigger>
                        <SelectContent data-spec-id="pediatra-content">
                          <SelectItem value="none" data-spec-id="pediatra-none">Nenhum selecionado</SelectItem>
                          {professionals.filter((p)=>p.user_type === 'pediatra').map((pediatra)=>(<SelectItem key={pediatra.id} value={pediatra.id} data-spec-id="pediatra-item">
                              {pediatra.full_name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>)} data-spec-id="pediatra-controller"/>
                </div>)}
            </div>

            <Separator data-spec-id="yoxkpBDiftBiteh7"/>

            {}
            <div className="space-y-4" data-spec-id="pqhybmys0NDhgbN7">
              <h3 className="text-lg font-medium text-gray-900 flex items-center" data-spec-id="NbZLdlOUdRztWXyg">
                <Baby className="mr-2 h-5 w-5" data-spec-id="7N3vDDnyWUJFirW3"/>
                Serviços Contratados
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="4nYDygsmBDMFbgTT">
                <div className="space-y-3" data-spec-id="cuW1bqOx37pybtPu">
                  <div className="flex items-center space-x-2" data-spec-id="JIdp0cHwyEat1oVN">
                    <Controller name="consulta_amamentacao" control={control} render={({ field })=>(<Checkbox id="consulta_amamentacao" checked={field.value} onCheckedChange={field.onChange} data-spec-id="consulta-amamentacao-checkbox"/>)} data-spec-id="4tJPyugSKozwXHWh"/>
                    <Label htmlFor="consulta_amamentacao" data-spec-id="5QswIrRXo89tjBYP">Consultoria de amamentação</Label>
                  </div>

                  <div className="flex items-center space-x-2" data-spec-id="UhgVZxc1cvnO488t">
                    <Controller name="curso_cuidados_recem_nascido" control={control} render={({ field })=>(<Checkbox id="curso_cuidados_recem_nascido" checked={field.value} onCheckedChange={field.onChange} data-spec-id="curso-cuidados-checkbox"/>)} data-spec-id="ZsIwLCfkFlCeXqUb"/>
                    <Label htmlFor="curso_cuidados_recem_nascido" data-spec-id="QbClaPShmZ6zCiJy">Curso de cuidados com recém-nascido</Label>
                  </div>

                  <div className="flex items-center space-x-2" data-spec-id="RwS6Gyd25KixyykQ">
                    <Controller name="consulta_pediatrica" control={control} render={({ field })=>(<Checkbox id="consulta_pediatrica" checked={field.value} onCheckedChange={field.onChange} data-spec-id="consulta-pediatrica-checkbox"/>)} data-spec-id="7Nu1MS4nwXL00qFv"/>
                    <Label htmlFor="consulta_pediatrica" data-spec-id="ixfaBzoblOAexRo8">Consulta pediátrica</Label>
                  </div>
                </div>

                <div className="space-y-3" data-spec-id="aVANav5BgR5Mr64j">
                  <div className="flex items-center space-x-2" data-spec-id="GfFrqXRWak3ih2Rh">
                    <Controller name="acompanhamento_nutricional" control={control} render={({ field })=>(<Checkbox id="acompanhamento_nutricional" checked={field.value} onCheckedChange={field.onChange} data-spec-id="acompanhamento-nutricional-checkbox"/>)} data-spec-id="a8ijmM47ujRKLvpR"/>
                    <Label htmlFor="acompanhamento_nutricional" data-spec-id="Px2B8RyTBhK6UTWE">Acompanhamento nutricional</Label>
                  </div>

                  <div className="flex items-center space-x-2" data-spec-id="SzZJg8NykfKiltaK">
                    <Controller name="fisioterapia_pelvica" control={control} render={({ field })=>(<Checkbox id="fisioterapia_pelvica" checked={field.value} onCheckedChange={field.onChange} data-spec-id="fisioterapia-pelvica-checkbox"/>)} data-spec-id="RQassDJORoBouK3E"/>
                    <Label htmlFor="fisioterapia_pelvica" data-spec-id="I7RASsDFq7TQXuQT">Fisioterapia pélvica</Label>
                  </div>

                  {}
                  <div className="flex items-center space-x-2" data-spec-id="HF1pNein1a3qAO1m">
                    <Controller name="curso_preparo_parto" control={control} render={({ field })=>(<Checkbox id="curso_preparo_parto" checked={field.value} onCheckedChange={field.onChange} disabled={isFieldDisabled('curso_preparo_parto')} data-spec-id="curso-preparo-parto-checkbox"/>)} data-spec-id="ZIPDZgLSnn3lsN5f"/>
                    <Label htmlFor="curso_preparo_parto" className={`flex items-center gap-2 ${isFieldDisabled('curso_preparo_parto') ? 'text-gray-400' : ''}`} data-spec-id="j8pIufd0fSUNzWBb">
                      Curso de preparo para o parto
                      {isFieldDisabled('curso_preparo_parto') && (<Tooltip data-spec-id="DUto3Q0tBSQcsOfp">
                          <TooltipTrigger asChild data-spec-id="qEq43B9LV9e1cDyH">
                            <Lock className="h-4 w-4 text-gray-400" data-spec-id="OAWnEIO3cwKkHEAG"/>
                          </TooltipTrigger>
                          <TooltipContent data-spec-id="h9poWRHBPXTJ3JKN">
                            <p data-spec-id="xE0aeFYg0gSJApJR">Desabilitado para cesariana</p>
                          </TooltipContent>
                        </Tooltip>)}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {}
            {viaPartoEscolhida === 'cesariana' && (<Alert data-spec-id="PsAqdTDEQLP2CxEW">
                <Info className="h-4 w-4" data-spec-id="1WPBxoPfccE7Ggu6"/>
                <AlertDescription data-spec-id="mzEF3NzFXPFLVHP1">
                  <strong data-spec-id="0LmdoijFza2jYkoJ">Cesariana selecionada:</strong> Os campos Enfermeira Obstétrica, Doula e Curso de Preparo para o Parto foram desabilitados automaticamente.
                </AlertDescription>
              </Alert>)}

            <div className="flex items-center justify-end space-x-4 pt-6" data-spec-id="bMJUkmHVy1d2qk7t">
              <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting} data-spec-id="cancel-button">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#D2AE6D] hover:bg-[#B8965A]" data-spec-id="submit-button">
                {isSubmitting ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-spec-id="U0xQHc0fEIKjFrRz"/>
                    Cadastrando...
                  </>) : ('Cadastrar Paciente')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>);
};
export default NewPatientForm;
