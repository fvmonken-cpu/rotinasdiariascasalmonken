import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
interface Option {
    value: string;
    label: string;
}
interface MultiSelectProps {
    options: Option[];
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    className?: string;
    maxSelectedItems?: number;
}
const MultiSelect: React.FC<MultiSelectProps> = ({ options, value = [], onChange, placeholder = "Selecionar...", className, maxSelectedItems = 3 })=>{
    const [isOpen, setIsOpen] = useState(false);
    console.log('MultiSelect renderizado:', {
        placeholder,
        optionsCount: options.length,
        value
    });
    const handleSelect = (optionValue: string)=>{
        console.log('MultiSelect - handleSelect chamado:', optionValue, 'valor atual:', value);
        const newValue = value.includes(optionValue) ? value.filter((v)=>v !== optionValue) : [
            ...value,
            optionValue
        ];
        console.log('MultiSelect - novo valor:', newValue);
        onChange(newValue);
    };
    const handleRemove = (optionValue: string, e: React.MouseEvent)=>{
        e.stopPropagation();
        onChange(value.filter((v)=>v !== optionValue));
    };
    const selectedOptions = options.filter((option)=>value.includes(option.value));
    const displayText = selectedOptions.length === 0 ? placeholder : selectedOptions.length <= maxSelectedItems ? selectedOptions.map((opt)=>opt.label).join(', ') : `${selectedOptions.length} selecionados`;
    return (<Popover open={isOpen} onOpenChange={(open)=>{
        console.log('Popover estado mudou:', open);
        setIsOpen(open);
    }} data-spec-id="ErGLH2B7zbGcKBNK">
      <PopoverTrigger onClick={()=>console.log('Popover trigger clicado:', placeholder)} className={cn("flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} data-spec-id="multi-select-trigger">
        <span className="truncate" data-spec-id="multi-select-value">
          {displayText}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" data-spec-id="multi-select-chevron"/>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[300px] p-0 z-50" align="start" data-spec-id="multi-select-content">
        <div className="max-h-60 overflow-auto" data-spec-id="multi-select-options">
          {options.map((option)=>(<div key={option.value} className={cn("flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-accent", value.includes(option.value) && "bg-accent")} onClick={()=>handleSelect(option.value)} data-spec-id={`multi-select-option-${option.value}`}>
              <div className={cn("h-4 w-4 border border-primary rounded-sm flex items-center justify-center", value.includes(option.value) && "bg-primary text-primary-foreground")} data-spec-id="multi-select-checkbox">
                {value.includes(option.value) && <Check className="h-3 w-3" data-spec-id="multi-select-check"/>}
              </div>
              <span className="text-sm" data-spec-id="multi-select-label">
                {option.label}
              </span>
            </div>))}
        </div>
        
        {value.length > 0 && (<div className="border-t p-2" data-spec-id="multi-select-selected">
            <div className="flex flex-wrap gap-1" data-spec-id="multi-select-badges">
              {selectedOptions.map((option)=>(<Badge key={option.value} variant="secondary" className="text-xs" data-spec-id={`multi-select-badge-${option.value}`}>
                  {option.label}
                  <X className="ml-1 h-3 w-3 cursor-pointer" onClick={(e)=>handleRemove(option.value, e)} data-spec-id="multi-select-remove"/>
                </Badge>))}
            </div>
          </div>)}
      </PopoverContent>
    </Popover>);
};
export { MultiSelect };
