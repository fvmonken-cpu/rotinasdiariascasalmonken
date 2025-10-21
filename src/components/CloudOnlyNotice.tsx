import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, Database } from 'lucide-react';
interface CloudOnlyNoticeProps {
    isSupabaseConnected: boolean;
}
const CloudOnlyNotice: React.FC<CloudOnlyNoticeProps> = ({ isSupabaseConnected })=>{
    if (isSupabaseConnected) {
        return null;
    }
    return (<Alert className="border-amber-200 bg-amber-50 mb-6" data-spec-id="cloud-only-notice">
      <Cloud className="h-4 w-4 text-amber-600" data-spec-id="PcoPcyxmlI2teiH8"/>
      <AlertDescription className="text-amber-800" data-spec-id="cloud-only-description">
        <div className="flex items-center gap-2 mb-2" data-spec-id="dFb5wbIl32Pk2NRQ">
          <Database className="h-4 w-4" data-spec-id="gj84KuhVzJcCIzkj"/>
          <strong data-spec-id="rsz539RvTzdrHJCU">Sistema em Modo Nuvem Exclusivo</strong>
        </div>
        Este sistema agora funciona exclusivamente com Supabase (nuvem). 
        Conecte-se ao Supabase para acessar todas as funcionalidades.
        <br data-spec-id="tH78VDPFJ4IN810n"/>
        <small className="text-amber-700 mt-1 block" data-spec-id="T7Kkxg0uzsEnPcCw">
          ⚠️ localStorage foi removido para garantir operação 100% na nuvem
        </small>
      </AlertDescription>
    </Alert>);
};
export default CloudOnlyNotice;
