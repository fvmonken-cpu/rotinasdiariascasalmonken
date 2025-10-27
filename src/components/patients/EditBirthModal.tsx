import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEditBirth } from '@/hooks/usePatients';
import { useMaternities } from '@/hooks/useMaternities';
import { useUsers } from '@/hooks/usePatients';
import { Loader2 } from 'lucide-react';
import CommercialSection from './CommercialSection';
interface EditBirthModalProps {
    isOpen: boolean;
    onClose: () => void;
    birthData: any;
}
const EditBirthModal: React.FC<EditBirthModalProps> = ({ isOpen, onClose, birthData })=>{
    const [formData, setFormData] = useState({
        birth_date: '',
        birth_gestational_age_weeks: 0,
        birth_gestational_age_days: 0,
        delivery_type: '',
        baby_name: '',
        baby_gender: '',
        maternity_id: '',
        obstetrician_id: '',
        obstetric_nurse_present_id: '',
        doula_present_id: '',
        birth_observations: ''
    });
    const calculateGestationalAge = (birthDate: string, estimatedDueDate: string)=>{
        console.log('Calculando IG - Data nascimento:', birthDate, 'DPP:', estimatedDueDate);
        if (!birthDate || !estimatedDueDate) {
            return {
                weeks: 0,
                days: 0
            };
        }
        const birth = new Date(birthDate + 'T00:00:00-03:00');
        const dueDate = new Date(estimatedDueDate + 'T00:00:00-03:00');
        const timeDiff = dueDate.getTime() - birth.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const totalGADays = 280 - daysDiff;
        const weeks = Math.floor(totalGADays / 7);
        const days = totalGADays % 7;
        console.log('IG calculada:', {
            weeks,
            days,
            totalGADays
        });
        return {
            weeks: Math.max(0, weeks),
            days: Math.max(0, days)
        };
    };
    const editBirthMutation = useEditBirth();
    const { maternities } = useMaternities();
    const { data: obstetricians } = useUsers('obstetra');
    const { data: obstetricNurses } = useUsers('enfermeira_obstetrica');
    const { data: doulas } = useUsers('doula');
    useEffect(()=>{
        if (birthData && isOpen) {
            const currentGA = birthData.birth_date && birthData.estimated_due_date ? calculateGestationalAge(birthData.birth_date, birthData.estimated_due_date) : {
                weeks: birthData.birth_gestational_age_weeks || 0,
                days: birthData.birth_gestational_age_days || 0
            };
            let maternityId = '';
            if (birthData.maternity && maternities) {
                const maternity = maternities.find((m)=>m.name === birthData.maternity);
                maternityId = maternity ? maternity.id : '';
            }
            setFormData({
                birth_date: birthData.birth_date || '',
                birth_gestational_age_weeks: currentGA.weeks,
                birth_gestational_age_days: currentGA.days,
                delivery_type: birthData.delivery_type || '',
                baby_name: birthData.baby_name || '',
                baby_gender: birthData.baby_gender || '',
                maternity_id: maternityId,
                obstetrician_id: birthData.obstetrician_id || '',
                obstetric_nurse_present_id: birthData.obstetric_nurse_present_id || '',
                doula_present_id: birthData.doula_present_id || '',
                birth_observations: birthData.birth_observations || ''
            });
        }
    }, [
        birthData,
        isOpen,
        maternities
    ]);
    const handleSubmit = async (e: React.FormEvent)=>{
        e.preventDefault();
        try {
            await editBirthMutation.mutateAsync({
                id: birthData.id,
                ...formData
            });
            onClose();
        } catch (error) {
            console.error('Erro ao editar nascimento:', error);
        }
    };
    const handleChange = (field: string, value: any)=>{
        if (value === 'none' && [
            'obstetrician_id',
            'obstetric_nurse_present_id',
            'doula_present_id'
        ].includes(field)) {
            value = '';
        }
        setFormData((prev)=>{
            const newData = {
                ...prev,
                [field]: value
            };
            if (field === 'birth_date' && value && birthData?.estimated_due_date) {
                const newGA = calculateGestationalAge(value, birthData.estimated_due_date);
                newData.birth_gestational_age_weeks = newGA.weeks;
                newData.birth_gestational_age_days = newGA.days;
                console.log('IG recalculada automaticamente:', newGA);
            }
            return newData;
        });
    };
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="edit-birth-modal">
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-spec-id="edit-birth-content">
        <DialogHeader data-spec-id="edit-birth-header">
          <DialogTitle data-spec-id="edit-birth-title">
            Editar Registro de Nascimento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-spec-id="edit-birth-form">
          {}
          <div className="grid grid-cols-2 gap-4" data-spec-id="basic-birth-info">
            <div className="space-y-2" data-spec-id="birth-date-field">
              <Label htmlFor="birth_date" data-spec-id="birth-date-label">Data do Nascimento *</Label>
              <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e)=>handleChange('birth_date', e.target.value)} required data-spec-id="birth-date-input"/>
            </div>

            <div className="space-y-2" data-spec-id="delivery-type-field">
              <Label data-spec-id="delivery-type-label">Via de Parto *</Label>
              <Select value={formData.delivery_type} onValueChange={(value)=>handleChange('delivery_type', value)} data-spec-id="delivery-type-select">
                <SelectTrigger data-spec-id="delivery-type-trigger">
                  <SelectValue placeholder="Selecione a via de parto" data-spec-id="delivery-type-value"/>
                </SelectTrigger>
                <SelectContent data-spec-id="delivery-type-content">
                  <SelectItem value="normal" data-spec-id="delivery-normal">Normal</SelectItem>
                  <SelectItem value="cesariana" data-spec-id="delivery-cesariana">Cesariana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4" data-spec-id="gestational-age-fields">
            <div className="space-y-2" data-spec-id="ga-weeks-field">
              <Label htmlFor="ga_weeks" data-spec-id="ga-weeks-label">Semanas de IG (calculado automaticamente)</Label>
              <Input id="ga_weeks" type="number" value={formData.birth_gestational_age_weeks} readOnly className="bg-gray-50 cursor-not-allowed" data-spec-id="ga-weeks-display"/>
            </div>

            <div className="space-y-2" data-spec-id="ga-days-field">
              <Label htmlFor="ga_days" data-spec-id="ga-days-label">Dias de IG (calculado automaticamente)</Label>
              <Input id="ga_days" type="number" value={formData.birth_gestational_age_days} readOnly className="bg-gray-50 cursor-not-allowed" data-spec-id="ga-days-display"/>
            </div>
          </div>
          
          {}
          <div className="text-sm text-gray-600 italic" data-spec-id="ga-calculation-info">
            * A idade gestacional é calculada automaticamente baseada na Data Provável do Parto (DPP) original da paciente.
          </div>

          {}
          <div className="grid grid-cols-2 gap-4" data-spec-id="baby-info-fields">
            <div className="space-y-2" data-spec-id="baby-name-field">
              <Label htmlFor="baby_name" data-spec-id="baby-name-label">Nome do Bebê *</Label>
              <Input id="baby_name" value={formData.baby_name} onChange={(e)=>handleChange('baby_name', e.target.value)} placeholder="Nome do bebê" required data-spec-id="baby-name-input"/>
            </div>

            <div className="space-y-2" data-spec-id="baby-gender-field">
              <Label data-spec-id="baby-gender-label">Sexo do Bebê *</Label>
              <Select value={formData.baby_gender} onValueChange={(value)=>handleChange('baby_gender', value)} data-spec-id="baby-gender-select">
                <SelectTrigger data-spec-id="baby-gender-trigger">
                  <SelectValue placeholder="Selecione o sexo" data-spec-id="baby-gender-value"/>
                </SelectTrigger>
                <SelectContent data-spec-id="baby-gender-content">
                  <SelectItem value="masculino" data-spec-id="gender-masculino">Masculino</SelectItem>
                  <SelectItem value="feminino" data-spec-id="gender-feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {}
          <div className="space-y-2" data-spec-id="maternity-field">
            <Label data-spec-id="maternity-label">Maternidade *</Label>
            <Select value={formData.maternity_id} onValueChange={(value)=>handleChange('maternity_id', value)} data-spec-id="maternity-select">
              <SelectTrigger data-spec-id="maternity-trigger">
                <SelectValue placeholder="Selecione a maternidade" data-spec-id="maternity-value"/>
              </SelectTrigger>
              <SelectContent data-spec-id="maternity-content">
                {maternities?.map((maternity)=>(<SelectItem key={maternity.id} value={maternity.id} data-spec-id={`maternity-${maternity.id}`}>
                    {maternity.name}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4" data-spec-id="professionals-fields">
            <div className="space-y-2" data-spec-id="obstetrician-field">
              <Label data-spec-id="obstetrician-label">Obstetra Presente</Label>
              <Select value={formData.obstetrician_id || 'none'} onValueChange={(value)=>handleChange('obstetrician_id', value)} data-spec-id="obstetrician-select">
                <SelectTrigger data-spec-id="obstetrician-trigger">
                  <SelectValue placeholder="Selecione o obstetra" data-spec-id="obstetrician-value"/>
                </SelectTrigger>
                <SelectContent data-spec-id="obstetrician-content">
                  <SelectItem value="none" data-spec-id="obstetrician-none">Nenhum</SelectItem>
                  {obstetricians?.map((obstetrician)=>(<SelectItem key={obstetrician.id} value={obstetrician.id} data-spec-id={`obstetrician-${obstetrician.id}`}>
                      {obstetrician.full_name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-spec-id="obstetric-nurse-field">
              <Label data-spec-id="obstetric-nurse-label">Enfermeira Obstétrica Presente</Label>
              <Select value={formData.obstetric_nurse_present_id || 'none'} onValueChange={(value)=>handleChange('obstetric_nurse_present_id', value)} data-spec-id="obstetric-nurse-select">
                <SelectTrigger data-spec-id="obstetric-nurse-trigger">
                  <SelectValue placeholder="Selecione a enfermeira" data-spec-id="obstetric-nurse-value"/>
                </SelectTrigger>
                <SelectContent data-spec-id="obstetric-nurse-content">
                  <SelectItem value="none" data-spec-id="obstetric-nurse-none">Nenhuma</SelectItem>
                  {obstetricNurses?.map((nurse)=>(<SelectItem key={nurse.id} value={nurse.id} data-spec-id={`obstetric-nurse-${nurse.id}`}>
                      {nurse.full_name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2" data-spec-id="doula-field">
            <Label data-spec-id="doula-label">Doula Presente</Label>
            <Select value={formData.doula_present_id || 'none'} onValueChange={(value)=>handleChange('doula_present_id', value)} data-spec-id="doula-select">
              <SelectTrigger data-spec-id="doula-trigger">
                <SelectValue placeholder="Selecione a doula" data-spec-id="doula-value"/>
              </SelectTrigger>
              <SelectContent data-spec-id="doula-content">
                <SelectItem value="none" data-spec-id="doula-none">Nenhuma</SelectItem>
                {doulas?.map((doula)=>(<SelectItem key={doula.id} value={doula.id} data-spec-id={`doula-${doula.id}`}>
                    {doula.full_name}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="space-y-2" data-spec-id="observations-field">
            <Label htmlFor="birth_observations" data-spec-id="observations-label">Observações sobre o Parto</Label>
            <Textarea id="birth_observations" value={formData.birth_observations} onChange={(e)=>handleChange('birth_observations', e.target.value)} placeholder="Observações sobre o parto (opcional)" rows={3} data-spec-id="observations-textarea"/>
          </div>

          {}
          <CommercialSection formData={{
        commercial_conditions: birthData?.commercial_conditions,
        payment_records: birthData?.payment_records,
        weeks_20_date: birthData?.weeks_20_date,
        weeks_30_date: birthData?.weeks_30_date,
        weeks_32_date: birthData?.weeks_32_date,
        weeks_36_date: birthData?.weeks_36_date
    }} onChange={()=>{}} readOnly={true} data-spec-id="edit-birth-commercial-section"/>

          {}
          <div className="flex gap-2 justify-end pt-4" data-spec-id="action-buttons">
            <Button type="button" variant="outline" onClick={onClose} disabled={editBirthMutation.isPending} data-spec-id="cancel-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={editBirthMutation.isPending} data-spec-id="save-button">
              {editBirthMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" data-spec-id="loading-icon"/>}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
};
export default EditBirthModal;
