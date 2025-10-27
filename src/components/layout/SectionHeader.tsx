import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, children })=>{
    const isMobile = useIsMobile();
    return (<div className="flex flex-col space-y-4 mb-6" data-spec-id="section-header">
      {isMobile ? (<>
          <div className="flex justify-center" data-spec-id="mobile-logo-container">
            <img src="https://cdn-pinspec-public.pinspec.ai/assets/Z8gZalhVAKjQV45OvNsVM.png" alt="Casal Monken" className="h-12 w-auto object-contain" data-spec-id="mobile-section-logo"/>
          </div>
          <div className="text-center" data-spec-id="mobile-title-container">
            <h1 className="text-2xl font-bold text-gray-900" data-spec-id="section-title">{title}</h1>
            {subtitle && (<p className="text-gray-600 mt-1" data-spec-id="section-subtitle">{subtitle}</p>)}
          </div>
        </>) : (<div className="flex items-center space-x-4" data-spec-id="desktop-header-container">
          <div className="flex-shrink-0" data-spec-id="desktop-logo-container">
            <img src="https://cdn-pinspec-public.pinspec.ai/assets/Z8gZalhVAKjQV45OvNsVM.png" alt="Casal Monken" className="h-16 w-auto object-contain" data-spec-id="desktop-section-logo"/>
          </div>
          <div className="flex-1" data-spec-id="desktop-title-container">
            <h1 className="text-3xl font-bold text-gray-900" data-spec-id="section-title">{title}</h1>
            {subtitle && (<p className="text-gray-600 mt-1" data-spec-id="section-subtitle">{subtitle}</p>)}
          </div>
        </div>)}
      {children && (<div data-spec-id="section-header-children">
          {children}
        </div>)}
    </div>);
};
export default SectionHeader;
