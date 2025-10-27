import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { formatGestationalWeekDate, getGestationalWeekLabel } from "@/utils/gestationalUtils";
import { Shield } from "lucide-react";
interface CommercialSectionProps {
    formData: {
        commercial_conditions?: string;
        payment_records?: string;
        weeks_20_date?: string | Date;
        weeks_30_date?: string | Date;
        weeks_32_date?: string | Date;
        weeks_36_date?: string | Date;
    };
    onChange: (field: string, value: string) => void;
    readOnly?: boolean;
    'data-spec-id'?: string;
}
export default function CommercialSection({ formData, onChange, readOnly = false, 'data-spec-id': specId }: CommercialSectionProps) {
    const { canViewCommercialFields, canEditCommercialFields } = useUserPermissions();
    console.log('CommercialSection - formData recebido:', formData);
    console.log('CommercialSection - weeks_20_date:', formData.weeks_20_date);
    console.log('CommercialSection - weeks_30_date:', formData.weeks_30_date);
    console.log('CommercialSection - weeks_32_date:', formData.weeks_32_date);
    console.log('CommercialSection - weeks_36_date:', formData.weeks_36_date);
    if (!canViewCommercialFields) {
        return null;
    }
    const canEdit = canEditCommercialFields && !readOnly;
    return (<Card className="border-orange-200" data-spec-id={specId || "commercial-section"}>
      <CardHeader className="pb-3" data-spec-id="Hs3uozJ3gqZtqicF">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-700" data-spec-id="gw39pqLwlHByfDTJ">
          <Shield className="h-5 w-5" data-spec-id="SZzrYRQxPF7yi9DL"/>
          Informações Comerciais
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full" data-spec-id="3bXxwH7x8ZiSpHhR">
            Acesso Restrito
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4" data-spec-id="YwF1uKYTCWFNgRZY">
        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-spec-id="Y2htjaxNk69kJaP7">
          <div className="space-y-2" data-spec-id="fGNuaMoIInBnlfLq">
            <Label htmlFor="commercial_conditions" data-spec-id="commercial-conditions-label">
              Condições Combinadas
            </Label>
            <Textarea id="commercial_conditions" placeholder="Descreva as condições comerciais combinadas..." value={formData.commercial_conditions || ''} onChange={(e)=>onChange('commercial_conditions', e.target.value)} readOnly={!canEdit} className={!canEdit ? "bg-gray-50" : ""} rows={4} data-spec-id="commercial-conditions-input"/>
          </div>
          
          <div className="space-y-2" data-spec-id="cRKHpkg0dzCNUrni">
            <Label htmlFor="payment_records" data-spec-id="payment-records-label">
              Registros de Pagamentos
            </Label>
            <Textarea id="payment_records" placeholder="Registre os pagamentos realizados..." value={formData.payment_records || ''} onChange={(e)=>onChange('payment_records', e.target.value)} readOnly={!canEdit} className={!canEdit ? "bg-gray-50" : ""} rows={4} data-spec-id="payment-records-input"/>
          </div>
        </div>

        {}
        <div data-spec-id="vg9cLYKvFeAsrAql">
          <Label className="text-sm font-medium text-gray-700 mb-3 block" data-spec-id="gestational-weeks-label">
            Datas das Semanas Gestacionais
            <span className="text-xs text-gray-500 block font-normal mt-1" data-spec-id="VyJRNEdY085VG4Ij">
              Calculadas automaticamente com base na DPP informada
            </span>
          </Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-spec-id="lXpOa5STHCCICiwx">
            {[
        {
            key: 'weeks_20_date',
            week: 20,
            label: '20 Semanas'
        },
        {
            key: 'weeks_30_date',
            week: 30,
            label: '30 Semanas'
        },
        {
            key: 'weeks_32_date',
            week: 32,
            label: '32 Semanas'
        },
        {
            key: 'weeks_36_date',
            week: 36,
            label: '36 Semanas'
        }
    ].map(({ key, week, label })=>(<div key={key} className="space-y-2" data-spec-id="xBCbcqcVWVnyX2QN">
                <Label htmlFor={key} className="text-sm" data-spec-id={`${key}-label`}>
                  {label}
                </Label>
                <Input id={key} type="text" value={formatGestationalWeekDate(formData[key], week)} readOnly className="bg-gray-50 text-gray-600" data-spec-id={`${key}-display`}/>
              </div>))}
          </div>
          
          <p className="text-xs text-gray-500 mt-2" data-spec-id="gestational-weeks-help">
            * As datas são calculadas automaticamente: DPP menos o número de semanas correspondente.
            "Completou" indica que a data já passou, "Completará" indica data futura.
          </p>
        </div>

        {}
        {!canEdit && (<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4" data-spec-id="permission-notice">
            <p className="text-sm text-blue-700" data-spec-id="tRguGPsy06JITgMt">
              <Shield className="h-4 w-4 inline mr-1" data-spec-id="1W2YlWapBzNnAZo7"/>
              Você tem permissão apenas para visualizar as informações comerciais.
              {readOnly && " Os dados de nascimentos são somente leitura."}
            </p>
          </div>)}
      </CardContent>
    </Card>);
}
