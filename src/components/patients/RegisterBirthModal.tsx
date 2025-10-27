import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { usePatients } from '@/hooks/usePatients';
import { useMaternities } from '@/hooks/useMaternities';
import { useUsers } from '@/hooks/usePatients';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Baby, Calendar, MapPin, User, FileText } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { formatPhone } from '@/utils/phoneUtils';
import { toast } from 'sonner';
interface BirthData {
    birth_date: string;
    delivery_type: 'normal' | 'cesariana';
    baby_gender: 'masculino' | 'feminino';
    baby_name?: string;
    maternity_id: string;
    maternity_name?: string;
    obstetric_nurse_present_id?: string;
    doula_present_id?: string;
    birth_observations?: string;
}
interface RegisterBirthModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient?: any;
}
const RegisterBirthModal: React.FC<RegisterBirthModalProps> = ({ isOpen, onClose, patient })=>{
    const { user } = useAuth();
    const { registerBirth, isRegisteringBirth } = usePatients();
    const { maternities } = useMaternities();
    const { data: obstetricNurses } = useUsers('enfermeira_obstetrica');
    const { data: doulas } = useUsers('doula');
    const [selectedMaternity, setSelectedMaternity] = useState<any>(null);
    const { register, handleSubmit, reset, watch, setValue, control, formState: { errors }, trigger } = useForm<BirthData>({
        defaultValues: {
            birth_date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000) - (3 * 60 * 60 * 1000)).toISOString().split('T')[0],
            delivery_type: undefined,
            baby_gender: undefined,
            baby_name: patient?.baby_name || '',
            maternity_id: '',
            obstetric_nurse_present_id: undefined,
            doula_present_id: undefined,
            birth_observations: ''
        }
    });
    useEffect(()=>{
        if (patient && isOpen) {
            reset({
                birth_date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000) - (3 * 60 * 60 * 1000)).toISOString().split('T')[0],
                delivery_type: undefined,
                baby_gender: undefined,
                baby_name: patient.baby_name || '',
                maternity_id: '',
                obstetric_nurse_present_id: undefined,
                doula_present_id: undefined,
                birth_observations: ''
            });
        }
    }, [
        patient,
        isOpen,
        reset
    ]);
    const calculateBirthGA = (birthDate: string)=>{
        if (!patient || !birthDate) return null;
        const birth = new Date(birthDate);
        const [year, month, day] = patient.estimated_due_date.split('-').map(Number);
        const dpp = new Date(year, month - 1, day);
        const diffTime = dpp.getTime() - birth.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const totalDaysAtBirth = 280 - diffDays;
        const weeksAtBirth = Math.floor(totalDaysAtBirth / 7);
        const daysAtBirth = totalDaysAtBirth % 7;
        return {
            weeks: weeksAtBirth,
            days: daysAtBirth
        };
    };
    const onSubmit = (data: BirthData)=>{
        if (!patient || !user) return;
        console.log('Dados do formulário de nascimento:', data);
        const maternity = maternities.find((m)=>m.id === data.maternity_id);
        console.log('Maternidade encontrada:', maternity);
        const birthData = {
            ...data,
            maternity_name: maternity?.name || ''
        };
        console.log('Dados finais do nascimento:', birthData);
        registerBirth({
            patientId: patient.id,
            birthData,
            userId: user.id
        });
        onClose();
    };
    const handleClose = ()=>{
        reset();
        setSelectedMaternity(null);
        onClose();
    };
    const birthDate = watch('birth_date');
    const birthGA = calculateBirthGA(birthDate);
    if (!patient) return null;
    return (<Dialog open={isOpen} onOpenChange={handleClose} data-spec-id="DPkngVmuWiyNka3M">
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-spec-id="register-birth-modal">
        <DialogHeader data-spec-id="modal-header">
          <DialogTitle className="flex items-center" data-spec-id="modal-title">
            <Baby className="h-5 w-5 mr-2" data-spec-id="baby-icon"/>
            Registrar Nascimento
          </DialogTitle>
          <DialogDescription data-spec-id="modal-description">
            Registre os dados do nascimento da paciente {patient.full_name}
          </DialogDescription>
        </DialogHeader>

        {}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3" data-spec-id="patient-info-section">
          <h3 className="font-semibold text-gray-900 flex items-center" data-spec-id="patient-info-title">
            <User className="h-4 w-4 mr-2" data-spec-id="user-icon"/>
            Dados da Paciente
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm" data-spec-id="patient-info-grid">
            <div data-spec-id="patient-name-field">
              <Label className="text-gray-600" data-spec-id="patient-name-label">Nome Completo</Label>
              <p className="font-medium" data-spec-id="patient-name-value">{patient.full_name}</p>
            </div>
            
            <div data-spec-id="patient-phone-field">
              <Label className="text-gray-600" data-spec-id="patient-phone-label">Telefone</Label>
              <p className="font-medium" data-spec-id="patient-phone-value">{formatPhone(patient.phone)}</p>
            </div>
            
            <div data-spec-id="patient-dpp-field">
              <Label className="text-gray-600" data-spec-id="patient-dpp-label">Data Provável do Parto</Label>
              <p className="font-medium" data-spec-id="patient-dpp-value">
                {(()=>{
        const [year, month, day] = patient.estimated_due_date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return formatDate(date);
    })()}
              </p>
            </div>
            

            
            <div data-spec-id="patient-preferred-delivery-field">
              <Label className="text-gray-600" data-spec-id="patient-preferred-delivery-label">Via de Parto Pretendida</Label>
              <Badge variant="outline" data-spec-id="patient-preferred-delivery-badge">
                {patient.preferred_delivery_type === 'normal' ? 'Normal' : patient.preferred_delivery_type === 'cesariana' ? 'Cesariana' : 'Não Definido'}
              </Badge>
            </div>
            
            <div data-spec-id="patient-obstetrician-field">
              <Label className="text-gray-600" data-spec-id="patient-obstetrician-label">Obstetra Responsável</Label>
              <p className="font-medium" data-spec-id="patient-obstetrician-value">
                {patient.obstetrician?.full_name || 'Não informado'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-spec-id="birth-form">
          <div className="grid grid-cols-2 gap-4" data-spec-id="birth-date-delivery-row">
            <div className="space-y-2" data-spec-id="birth-date-field">
              <Label htmlFor="birth_date" data-spec-id="birth-date-label">
                Data do Parto *
              </Label>
              <Input id="birth_date" type="date" {...register('birth_date', {
        required: 'Data do parto é obrigatória'
    })} data-spec-id="birth-date-input"/>
              {errors.birth_date && (<p className="text-sm text-red-600" data-spec-id="birth-date-error">
                  {errors.birth_date.message}
                </p>)}
              {birthGA && (<div className="mt-2 p-2 bg-blue-50 rounded text-sm" data-spec-id="calculated-ga">
                  <span className="text-blue-700 font-medium" data-spec-id="SrTMzeabGDvgVCtt">IG no nascimento: {birthGA.weeks}s{birthGA.days}d</span>
                </div>)}
            </div>

            <div className="space-y-2" data-spec-id="delivery-type-field">
              <Label htmlFor="delivery_type" data-spec-id="delivery-type-label">
                Via de Parto Real *
              </Label>
              <Controller name="delivery_type" control={control} rules={{
        required: 'Via de parto é obrigatória'
    }} render={({ field })=>(<Select onValueChange={field.onChange} value={field.value} data-spec-id="DEY29Ww5o43M9mZ3">
                    <SelectTrigger data-spec-id="delivery-type-trigger">
                      <SelectValue placeholder="Selecione a via de parto" data-spec-id="delivery-type-placeholder"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="delivery-type-content">
                      <SelectItem value="normal" data-spec-id="delivery-type-normal">Normal</SelectItem>
                      <SelectItem value="cesariana" data-spec-id="delivery-type-cesariana">Cesariana</SelectItem>
                    </SelectContent>
                  </Select>)} data-spec-id="2pa9lEsWWYVslV0c"/>
              {errors.delivery_type && (<p className="text-sm text-red-600" data-spec-id="delivery-type-error">
                  {errors.delivery_type.message}
                </p>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" data-spec-id="baby-info-row">
            <div className="space-y-2" data-spec-id="baby-gender-field">
              <Label htmlFor="baby_gender" data-spec-id="baby-gender-label">
                Sexo do Bebê *
              </Label>
              <Controller name="baby_gender" control={control} rules={{
        required: 'Sexo do bebê é obrigatório'
    }} render={({ field })=>(<Select onValueChange={field.onChange} value={field.value} data-spec-id="H92aDcheQV1tlL6n">
                    <SelectTrigger data-spec-id="baby-gender-trigger">
                      <SelectValue placeholder="Selecione o sexo" data-spec-id="baby-gender-placeholder"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="baby-gender-content">
                      <SelectItem value="masculino" data-spec-id="baby-gender-male">Masculino</SelectItem>
                      <SelectItem value="feminino" data-spec-id="baby-gender-female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>)} data-spec-id="QVtStqqXmutyT6pv"/>
              {errors.baby_gender && (<p className="text-sm text-red-600" data-spec-id="baby-gender-error">
                  {errors.baby_gender.message}
                </p>)}
            </div>

            <div className="space-y-2" data-spec-id="baby-name-field">
              <Label htmlFor="baby_name" data-spec-id="baby-name-label">
                Nome do Bebê
              </Label>
              <Input id="baby_name" {...register('baby_name')} placeholder="Nome do bebê (opcional)" data-spec-id="baby-name-input"/>
            </div>
          </div>

          <div className="space-y-2" data-spec-id="maternity-field">
            <Label htmlFor="maternity_id" data-spec-id="maternity-label">
              Maternidade *
            </Label>
            <Controller name="maternity_id" control={control} rules={{
        required: 'Maternidade é obrigatória'
    }} render={({ field })=>(<Select onValueChange={(value)=>{
            field.onChange(value);
            const maternity = maternities.find((m)=>m.id === value);
            setSelectedMaternity(maternity);
        }} value={field.value} data-spec-id="O4bnVxJNlIWNyhHx">
                  <SelectTrigger data-spec-id="maternity-trigger">
                    <SelectValue placeholder="Selecione a maternidade" data-spec-id="maternity-placeholder"/>
                  </SelectTrigger>
                  <SelectContent data-spec-id="maternity-content">
                    {maternities.map((maternity)=>(<SelectItem key={maternity.id} value={maternity.id} data-spec-id={`maternity-option-${maternity.id}`}>
                        {maternity.name}
                      </SelectItem>))}
                  </SelectContent>
                </Select>)} data-spec-id="A1wJqsBXeGZEKEe1"/>
            {errors.maternity_id && (<p className="text-sm text-red-600" data-spec-id="maternity-error">
                {errors.maternity_id.message}
              </p>)}
          </div>

          <div className="grid grid-cols-2 gap-4" data-spec-id="professionals-row">
            <div className="space-y-2" data-spec-id="obstetric-nurse-field">
              <Label htmlFor="obstetric_nurse_present_id" data-spec-id="obstetric-nurse-label">
                Enfermeira Obstétrica Presente
              </Label>
              <Controller name="obstetric_nurse_present_id" control={control} render={({ field })=>(<Select onValueChange={(value)=>field.onChange(value === 'none' ? undefined : value)} value={field.value} data-spec-id="1XdZsiZbgymHC4Bm">
                    <SelectTrigger data-spec-id="obstetric-nurse-trigger">
                      <SelectValue placeholder="Selecione (opcional)" data-spec-id="obstetric-nurse-placeholder"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="obstetric-nurse-content">
                      <SelectItem value="none" data-spec-id="nurse-option-none">
                        Nenhum
                      </SelectItem>
                      {obstetricNurses?.map((nurse)=>(<SelectItem key={nurse.id} value={nurse.id} data-spec-id={`nurse-option-${nurse.id}`}>
                          {nurse.full_name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>)} data-spec-id="lIqzrOY2qSNImyNg"/>
            </div>

            <div className="space-y-2" data-spec-id="doula-field">
              <Label htmlFor="doula_present_id" data-spec-id="doula-label">
                Doula Presente
              </Label>
              <Controller name="doula_present_id" control={control} render={({ field })=>(<Select onValueChange={(value)=>field.onChange(value === 'none' ? undefined : value)} value={field.value} data-spec-id="NK0jYJXhhgnWsDyY">
                    <SelectTrigger data-spec-id="doula-trigger">
                      <SelectValue placeholder="Selecione (opcional)" data-spec-id="doula-placeholder"/>
                    </SelectTrigger>
                    <SelectContent data-spec-id="doula-content">
                      <SelectItem value="none" data-spec-id="doula-option-none">
                        Nenhum
                      </SelectItem>
                      {doulas?.map((doula)=>(<SelectItem key={doula.id} value={doula.id} data-spec-id={`doula-option-${doula.id}`}>
                          {doula.full_name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>)} data-spec-id="bcXKovD3TV8J0C0m"/>
            </div>
          </div>

          <div className="space-y-2" data-spec-id="observations-field">
            <Label htmlFor="birth_observations" data-spec-id="observations-label">
              Observações sobre o Parto
            </Label>
            <Textarea id="birth_observations" {...register('birth_observations')} placeholder="Observações, intercorrências ou informações relevantes sobre o parto..." rows={3} data-spec-id="observations-input"/>
          </div>

          <DialogFooter data-spec-id="modal-footer">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isRegisteringBirth} data-spec-id="cancel-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isRegisteringBirth} data-spec-id="register-button">
              {isRegisteringBirth ? 'Registrando...' : 'Registrar Nascimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
};
export default RegisterBirthModal;
