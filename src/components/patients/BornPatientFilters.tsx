import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMaternities } from '@/hooks/useMaternities';
import { useUsers } from '@/hooks/usePatients';
interface BornPatientFiltersProps {
    filters: {
        search: string;
        baby_gender: string[];
        maternity: string[];
        obstetrician: string[];
        obstetricNursePresent: string[];
        doulaPresent: string[];
        deliveryType: string[];
        birthDateFrom: string;
        birthDateTo: string;
    };
    onFiltersChange: (filters: any) => void;
    onClearFilters: () => void;
    isDoula?: boolean;
    isLactationConsultant?: boolean;
}
const BornPatientFilters: React.FC<BornPatientFiltersProps> = ({ filters, onFiltersChange, onClearFilters, isDoula = false, isLactationConsultant = false })=>{
    const [isOpen, setIsOpen] = useState(true);
    const toggleFilters = ()=>{
        setIsOpen(!isOpen);
    };
    const { maternities } = useMaternities();
    const { data: obstetricians } = useUsers('obstetra');
    const { data: obstetricNurses } = useUsers('enfermeira_obstetrica');
    const { data: doulas } = useUsers('doula');
    const hasActiveFilters = Object.values(filters).some((value)=>Array.isArray(value) ? value.length > 0 : value !== '');
    const maternitiesOptions = maternities?.map((maternity)=>({
            label: maternity.name,
            value: maternity.name
        })) || [];
    const obstetriciansOptions = obstetricians?.map((obstetrician)=>({
            label: obstetrician.full_name,
            value: obstetrician.id
        })) || [];
    const obstetricNursesOptions = obstetricNurses?.map((nurse)=>({
            label: nurse.full_name,
            value: nurse.id
        })) || [];
    const doulasOptions = doulas?.map((doula)=>({
            label: doula.full_name,
            value: doula.id
        })) || [];
    const deliveryTypeOptions = [
        {
            label: 'Normal',
            value: 'normal'
        },
        {
            label: 'Cesariana',
            value: 'cesariana'
        }
    ];
    const babyGenderOptions = [
        {
            label: 'Masculino',
            value: 'masculino'
        },
        {
            label: 'Feminino',
            value: 'feminino'
        }
    ];
    return (<Card data-spec-id="born-patient-filters">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} data-spec-id="muxltqAfNYLMgz6f">
        <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={toggleFilters} data-spec-id="filters-header">
          <div className="flex items-center justify-between" data-spec-id="filters-title-row">
            <CardTitle className="flex items-center" data-spec-id="filters-title">
              <Filter className="h-4 w-4 mr-2" data-spec-id="filter-icon"/>
              Filtros
              {hasActiveFilters && (<span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full" data-spec-id="active-filters-indicator">
                  {Object.values(filters).filter((v)=>Array.isArray(v) ? v.length > 0 : v !== '').length}
                </span>)}
            </CardTitle>
            <div className="flex items-center gap-2" data-spec-id="filters-actions">
              {hasActiveFilters && (<Button variant="outline" size="sm" onClick={(e)=>{
        e.stopPropagation();
        onClearFilters();
    }} data-spec-id="clear-filters-button">
                  <X className="h-4 w-4 mr-1" data-spec-id="clear-icon"/>
                  Limpar
                </Button>)}
              {isOpen ? (<ChevronUp className="h-4 w-4" data-spec-id="collapse-icon"/>) : (<ChevronDown className="h-4 w-4" data-spec-id="expand-icon"/>)}
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent data-spec-id="RXXIsI7nfJnkrRhV">
          <CardContent className="space-y-4" data-spec-id="filters-content">
        {}
        <div className="space-y-2" data-spec-id="search-field">
          <Label htmlFor="search" data-spec-id="search-label">Buscar</Label>
          <div className="relative" data-spec-id="search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" data-spec-id="search-icon"/>
            <Input id="search" placeholder="Nome da mãe ou bebê..." value={filters.search} onChange={(e)=>onFiltersChange({
            ...filters,
            search: e.target.value
        })} className="pl-10" data-spec-id="search-input"/>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 gap-4" data-spec-id="date-fields">
          <div className="space-y-2" data-spec-id="birth-date-from-field">
            <Label htmlFor="birthDateFrom" data-spec-id="birth-date-from-label">Data Nascimento (De)</Label>
            <Input id="birthDateFrom" type="date" value={filters.birthDateFrom} onChange={(e)=>onFiltersChange({
            ...filters,
            birthDateFrom: e.target.value
        })} data-spec-id="birth-date-from-input"/>
          </div>
          
          <div className="space-y-2" data-spec-id="birth-date-to-field">
            <Label htmlFor="birthDateTo" data-spec-id="birth-date-to-label">Data Nascimento (Até)</Label>
            <Input id="birthDateTo" type="date" value={filters.birthDateTo} onChange={(e)=>onFiltersChange({
            ...filters,
            birthDateTo: e.target.value
        })} data-spec-id="birth-date-to-input"/>
          </div>
        </div>

        {}
        {!isDoula && !isLactationConsultant && (<>
          <div className="grid grid-cols-2 gap-4" data-spec-id="multi-select-row-1">
            <div className="space-y-2" data-spec-id="baby-gender-field">
              <Label data-spec-id="baby-gender-label">Sexo do Bebê</Label>
              <MultiSelect options={babyGenderOptions} value={filters.baby_gender} onChange={(value)=>onFiltersChange({
            ...filters,
            baby_gender: value
        })} placeholder="Sexo do Bebê" data-spec-id="baby-gender-select"/>
            </div>

            <div className="space-y-2" data-spec-id="delivery-type-field">
              <Label data-spec-id="delivery-type-label">Via de Parto</Label>
              <MultiSelect options={deliveryTypeOptions} value={filters.deliveryType} onChange={(value)=>onFiltersChange({
            ...filters,
            deliveryType: value
        })} placeholder="Via de Parto" data-spec-id="delivery-type-select"/>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4" data-spec-id="multi-select-row-2">
            <div className="space-y-2" data-spec-id="maternity-field">
              <Label data-spec-id="maternity-label">Maternidade</Label>
              <MultiSelect options={maternitiesOptions} value={filters.maternity} onChange={(value)=>onFiltersChange({
            ...filters,
            maternity: value
        })} placeholder="Maternidade" data-spec-id="maternity-select"/>
            </div>

            <div className="space-y-2" data-spec-id="obstetrician-field">
              <Label data-spec-id="obstetrician-label">Médico Obstetra</Label>
              <MultiSelect options={obstetriciansOptions} value={filters.obstetrician} onChange={(value)=>onFiltersChange({
            ...filters,
            obstetrician: value
        })} placeholder="Médico Obstetra" data-spec-id="obstetrician-select"/>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4" data-spec-id="multi-select-row-3">
            <div className="space-y-2" data-spec-id="obstetric-nurse-present-field">
              <Label data-spec-id="obstetric-nurse-present-label">Enfermeira Obstétrica Presente</Label>
              <MultiSelect options={obstetricNursesOptions} value={filters.obstetricNursePresent} onChange={(value)=>onFiltersChange({
            ...filters,
            obstetricNursePresent: value
        })} placeholder="Enfermeira Presente" data-spec-id="obstetric-nurse-present-select"/>
            </div>

            <div className="space-y-2" data-spec-id="doula-present-field">
              <Label data-spec-id="doula-present-label">Doula Presente</Label>
              <MultiSelect options={doulasOptions} value={filters.doulaPresent} onChange={(value)=>onFiltersChange({
            ...filters,
            doulaPresent: value
        })} placeholder="Doula Presente" data-spec-id="doula-present-select"/>
            </div>
          </div>
        </>)}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>);
};
export default BornPatientFilters;
