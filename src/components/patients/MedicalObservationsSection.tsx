import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
interface MedicalObservationsSectionProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    'data-spec-id'?: string;
}
const MedicalObservationsSection: React.FC<MedicalObservationsSectionProps> = ({ value, onChange, readOnly = false, 'data-spec-id': dataSpecId })=>{
    const { user } = useAuth();
    const isObstetrician = user?.role === 'obstetra';
    const isEditable = isObstetrician && !readOnly;
    return (<Card data-spec-id={dataSpecId}>
      <CardHeader className="pb-3" data-spec-id="medical-observations-header">
        <CardTitle className="flex items-center text-lg" data-spec-id="medical-observations-title">
          <Stethoscope className="h-5 w-5 mr-2 text-red-500" data-spec-id="stethoscope-icon"/>
          Observações Médicas da Gestação
        </CardTitle>
        {!isObstetrician && (<p className="text-sm text-gray-600" data-spec-id="readonly-notice">
            Estas observações são editáveis apenas por médicos obstetras
          </p>)}
      </CardHeader>
      <CardContent data-spec-id="medical-observations-content">
        <div className="space-y-2" data-spec-id="observations-field-container">
          <Label htmlFor="gestational_observations" data-spec-id="observations-label">
            Observações da Gestação
          </Label>
          <Textarea id="gestational_observations" placeholder={isEditable ? "Digite observações sobre a gestação..." : "Nenhuma observação registrada"} value={value || ''} onChange={(e)=>isEditable && onChange(e.target.value)} readOnly={!isEditable} className={`min-h-[100px] ${!isEditable ? 'bg-gray-50 cursor-not-allowed' : ''}`} data-spec-id="observations-textarea"/>
          {!isEditable && value && (<p className="text-sm text-gray-600 mt-2" data-spec-id="readonly-content">
              {value || 'Nenhuma observação registrada'}
            </p>)}
        </div>
      </CardContent>
    </Card>);
};
export default MedicalObservationsSection;
