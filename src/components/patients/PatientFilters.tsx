import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { useUsers } from '@/hooks/usePatients';
import { MultiSelect } from '@/components/ui/multi-select';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
interface PatientFiltersProps {
    filters: {
        search?: string;
        status?: 'todas' | 'ativas' | 'nascidos';
        obstetrician?: string[];
        deliveryType?: string[];
        obstetricNurse?: string[];
        doula?: string[];
        dueDateFrom?: string;
        dueDateTo?: string;
    };
    onFiltersChange: (filters: any) => void;
    onClearFilters: () => void;
}
const PatientFilters: React.FC<PatientFiltersProps> = ({ filters, onFiltersChange, onClearFilters })=>{
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const { data: obstetricians } = useUsers('obstetra');
    const { data: obstetricNurses } = useUsers('enfermeira_obstetrica');
    const { data: doulas } = useUsers('doula');
    const setNext30Days = ()=>{
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);
        onFiltersChange({
            ...filters,
            dueDateFrom: today.toISOString().split('T')[0],
            dueDateTo: next30Days.toISOString().split('T')[0]
        });
    };
    const hasActiveFilters = Object.entries(filters).some(([key, value])=>{
        if (key === 'status') return value !== 'todas';
        if (Array.isArray(value)) return value.length > 0;
        return value && value !== '';
    });
    return (<Card data-spec-id="patient-filters-card">
      <CardContent className="p-4" data-spec-id="filters-content">
        <div className="space-y-4" data-spec-id="filters-grid">
          {}
          <div className="grid grid-cols-1" data-spec-id="search-row">
            <div className="relative" data-spec-id="search-input-wrapper">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" data-spec-id="search-icon"/>
              <Input placeholder="Buscar por nome da paciente ou bebê..." value={filters.search || ''} onChange={(e)=>onFiltersChange({
            ...filters,
            search: e.target.value
        })} className="pl-10" data-spec-id="search-input"/>
            </div>
          </div>

          {}
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`} data-spec-id="main-filters-row">
            <div data-spec-id="obstetrician-filter">
              <MultiSelect options={obstetricians?.map((obstetrician)=>({
            value: obstetrician.id,
            label: obstetrician.full_name
        })) || []} value={filters.obstetrician || []} onChange={(values)=>{
        console.log('Filtro obstetra alterado:', values);
        onFiltersChange({
            ...filters,
            obstetrician: values
        });
    }} placeholder="Médico Obstetra" data-spec-id="obstetrician-multi-select"/>
            </div>

            <div data-spec-id="delivery-type-filter">
              <MultiSelect options={(user?.role === 'enfermeira_obstetrica' || user?.role === 'doula') ? [
        {
            value: 'normal',
            label: 'Parto Normal'
        },
        {
            value: 'nao_definido',
            label: 'Não Definido'
        }
    ] : [
        {
            value: 'normal',
            label: 'Parto Normal'
        },
        {
            value: 'cesariana',
            label: 'Cesariana'
        },
        {
            value: 'nao_definido',
            label: 'Não Definido'
        }
    ]} value={filters.deliveryType || []} onChange={(values)=>{
        console.log('Filtro tipo de parto alterado:', values);
        onFiltersChange({
            ...filters,
            deliveryType: values
        });
    }} placeholder="Via de Parto" data-spec-id="delivery-type-multi-select"/>
            </div>

            <div data-spec-id="obstetric-nurse-filter">
              <MultiSelect options={obstetricNurses?.map((nurse)=>({
            value: nurse.id,
            label: nurse.full_name
        })) || []} value={filters.obstetricNurse || []} onChange={(values)=>{
        console.log('Filtro enfermeira obstétrica alterado:', values);
        onFiltersChange({
            ...filters,
            obstetricNurse: values
        });
    }} placeholder="Enfermeira Obstetra" data-spec-id="obstetric-nurse-multi-select"/>
            </div>

            <div data-spec-id="doula-filter">
              <MultiSelect options={doulas?.map((doula)=>({
            value: doula.id,
            label: doula.full_name
        })) || []} value={filters.doula || []} onChange={(values)=>{
        console.log('Filtro doula alterado:', values);
        onFiltersChange({
            ...filters,
            doula: values
        });
    }} placeholder="Doula" data-spec-id="doula-multi-select"/>
            </div>
          </div>

          {}
          <div className={`grid gap-3 items-end ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`} data-spec-id="date-filters-row">
            <div data-spec-id="due-date-from-filter">
              <label className="text-sm font-medium text-gray-700 mb-1 block" data-spec-id="due-date-from-label">DPP - De:</label>
              <Input type="date" value={filters.dueDateFrom || ''} onChange={(e)=>onFiltersChange({
            ...filters,
            dueDateFrom: e.target.value
        })} data-spec-id="due-date-from-input"/>
            </div>

            <div data-spec-id="due-date-to-filter">
              <label className="text-sm font-medium text-gray-700 mb-1 block" data-spec-id="due-date-to-label">DPP - Até:</label>
              <Input type="date" value={filters.dueDateTo || ''} onChange={(e)=>onFiltersChange({
            ...filters,
            dueDateTo: e.target.value
        })} data-spec-id="due-date-to-input"/>
            </div>

            <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`} data-spec-id="date-actions">
              <Button variant="outline" onClick={setNext30Days} className="flex-1" size={isMobile ? "sm" : "default"} data-spec-id="next-30-days-button">
                {isMobile ? "Próx. 30 dias" : "Próximos 30 dias"}
              </Button>
              {hasActiveFilters && (<Button variant="outline" onClick={onClearFilters} size={isMobile ? "sm" : "default"} data-spec-id="clear-filters-button">
                  <X className="h-4 w-4 mr-2" data-spec-id="clear-icon"/>
                  Limpar
                </Button>)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);
};
export default PatientFilters;
