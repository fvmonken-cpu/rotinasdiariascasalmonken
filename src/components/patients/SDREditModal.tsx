import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
interface SDREditModalProps {
    patient: Patient | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (patientId: string, services: any, userId: string) => void;
    isLoading?: boolean;
}
const SDREditModal: React.FC<SDREditModalProps> = ({ patient, isOpen, onClose, onSave, isLoading = false })=>{
    const { user } = useAuth();
    const { canViewCommercialFields, canEditCommercialFields } = useUserPermissions();
    const [services, setServices] = useState({
        birth_preparation_course: patient?.birth_preparation_course || 'nao_contratado',
        newborn_care_course: patient?.newborn_care_course || 'nao_contratado',
        breastfeeding_workshop: patient?.breastfeeding_workshop || 'nao_contratado',
        nutritional_monitoring: patient?.nutritional_monitoring || 'nao_contratado',
        pelvic_physiotherapy: patient?.pelvic_physiotherapy || 'nao_contratado',
        pediatric_consultation: patient?.pediatric_consultation || 'nao_contratado'
    });
    const [commercialData, setCommercialData] = useState({
        commercial_conditions: patient?.commercial_conditions || '',
        payment_records: patient?.payment_records || ''
    });
    React.useEffect(()=>{
        if (patient) {
            setServices({
                birth_preparation_course: patient.birth_preparation_course || 'nao_contratado',
                newborn_care_course: patient.newborn_care_course || 'nao_contratado',
                breastfeeding_workshop: patient.breastfeeding_workshop || 'nao_contratado',
                nutritional_monitoring: patient.nutritional_monitoring || 'nao_contratado',
                pelvic_physiotherapy: patient.pelvic_physiotherapy || 'nao_contratado',
                pediatric_consultation: patient.pediatric_consultation || 'nao_contratado'
            });
            setCommercialData({
                commercial_conditions: patient.commercial_conditions || '',
                payment_records: patient.payment_records || ''
            });
        }
    }, [
        patient
    ]);
    const handleServiceChange = (serviceKey: string, checked: boolean)=>{
        setServices((prev)=>({
                ...prev,
                [serviceKey]: checked ? 'contratado' : 'nao_contratado'
            }));
    };
    const handleCommercialChange = (field: string, value: string)=>{
        setCommercialData((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    const handleSave = ()=>{
        if (patient && user) {
            const dataToSave = {
                ...services,
                ...(canEditCommercialFields ? commercialData : {})
            };
            onSave(patient.id, dataToSave, user.id);
        }
    };
    if (!patient) return null;
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="sdr-edit-modal">
      <DialogContent className="max-w-md" data-spec-id="sdr-edit-content">
        <DialogHeader data-spec-id="sdr-edit-header">
          <DialogTitle data-spec-id="sdr-edit-title">
            Editar Serviços Contratados
          </DialogTitle>
          <p className="text-sm text-gray-600" data-spec-id="patient-name">
            {patient.full_name}
          </p>
        </DialogHeader>

        <div className="space-y-4" data-spec-id="services-form">
          <div className="space-y-3" data-spec-id="services-list">
            <div className="flex items-center space-x-2" data-spec-id="birth-prep-field">
              <Checkbox id="birth_preparation_course" checked={services.birth_preparation_course === 'contratado'} onCheckedChange={(checked)=>handleServiceChange('birth_preparation_course', checked as boolean)} data-spec-id="birth-prep-checkbox"/>
              <Label htmlFor="birth_preparation_course" className="text-sm" data-spec-id="birth-prep-label">
                Preparação para o Parto
              </Label>
            </div>

            <div className="flex items-center space-x-2" data-spec-id="newborn-care-field">
              <Checkbox id="newborn_care_course" checked={services.newborn_care_course === 'contratado'} onCheckedChange={(checked)=>handleServiceChange('newborn_care_course', checked as boolean)} data-spec-id="newborn-care-checkbox"/>
              <Label htmlFor="newborn_care_course" className="text-sm" data-spec-id="newborn-care-label">
                Cuidados com o Recém-nascido
              </Label>
            </div>

            <div className="flex items-center space-x-2" data-spec-id="breastfeeding-field">
              <Checkbox id="breastfeeding_workshop" checked={services.breastfeeding_workshop === 'contratado'} onCheckedChange={(checked)=>handleServiceChange('breastfeeding_workshop', checked as boolean)} data-spec-id="breastfeeding-checkbox"/>
              <Label htmlFor="breastfeeding_workshop" className="text-sm" data-spec-id="breastfeeding-label">
                Consultoria de Amamentação
              </Label>
            </div>

            <div className="flex items-center space-x-2" data-spec-id="nutrition-field">
              <Checkbox id="nutritional_monitoring" checked={services.nutritional_monitoring === 'contratado'} onCheckedChange={(checked)=>handleServiceChange('nutritional_monitoring', checked as boolean)} data-spec-id="nutrition-checkbox"/>
              <Label htmlFor="nutritional_monitoring" className="text-sm" data-spec-id="nutrition-label">
                Acompanhamento Nutricional
              </Label>
            </div>

            <div className="flex items-center space-x-2" data-spec-id="physiotherapy-field">
              <Checkbox id="pelvic_physiotherapy" checked={services.pelvic_physiotherapy === 'contratado'} onCheckedChange={(checked)=>handleServiceChange('pelvic_physiotherapy', checked as boolean)} data-spec-id="physiotherapy-checkbox"/>
              <Label htmlFor="pelvic_physiotherapy" className="text-sm" data-spec-id="physiotherapy-label">
                Fisioterapia Pélvica
              </Label>
            </div>

            <div className="flex items-center space-x-2" data-spec-id="pediatric-field">
              <Checkbox id="pediatric_consultation" checked={services.pediatric_consultation === 'contratado'} onCheckedChange={(checked)=>handleServiceChange('pediatric_consultation', checked as boolean)} data-spec-id="pediatric-checkbox"/>
              <Label htmlFor="pediatric_consultation" className="text-sm" data-spec-id="pediatric-label">
                Consulta Pediátrica
              </Label>
            </div>
          </div>
          
          {}
          {canViewCommercialFields && (<>
              <Separator data-spec-id="fyKMge9EZvCwWdZu"/>
              <div className="space-y-4" data-spec-id="commercial-section">
                <h4 className="text-sm font-medium text-gray-900" data-spec-id="commercial-title">
                  Informações Comerciais
                </h4>
                
                <div className="space-y-3" data-spec-id="commercial-fields">
                  <div className="space-y-2" data-spec-id="commercial-conditions-field">
                    <Label htmlFor="commercial_conditions" className="text-sm" data-spec-id="commercial-conditions-label">
                      Condições Combinadas
                    </Label>
                    <Textarea id="commercial_conditions" placeholder="Descreva as condições comerciais combinadas..." value={commercialData.commercial_conditions} onChange={(e)=>handleCommercialChange('commercial_conditions', e.target.value)} disabled={!canEditCommercialFields} className={!canEditCommercialFields ? "bg-gray-50" : ""} rows={3} data-spec-id="commercial-conditions-textarea"/>
                  </div>
                  
                  <div className="space-y-2" data-spec-id="payment-records-field">
                    <Label htmlFor="payment_records" className="text-sm" data-spec-id="payment-records-label">
                      Registros de Pagamentos
                    </Label>
                    <Textarea id="payment_records" placeholder="Registre os pagamentos realizados..." value={commercialData.payment_records} onChange={(e)=>handleCommercialChange('payment_records', e.target.value)} disabled={!canEditCommercialFields} className={!canEditCommercialFields ? "bg-gray-50" : ""} rows={3} data-spec-id="payment-records-textarea"/>
                  </div>
                  
                  {!canEditCommercialFields && (<p className="text-xs text-gray-500" data-spec-id="commercial-readonly-note">
                      * Campos somente leitura para sua permissão
                    </p>)}
                </div>
              </div>
            </>)}
        </div>

        <div className="flex justify-end space-x-2 pt-4" data-spec-id="modal-actions">
          <Button variant="outline" onClick={onClose} disabled={isLoading} data-spec-id="cancel-button">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} data-spec-id="save-button">
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
};
export default SDREditModal;
