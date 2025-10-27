import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
const ReportsView: React.FC = ()=>{
    return (<div className="space-y-6" data-spec-id="reports-view">
      <div className="flex items-center justify-between" data-spec-id="5Kp2a8ZuZKtI0xVO">
        <div data-spec-id="RrFcKZ8JIU8W8Tch">
          <h1 className="text-2xl font-bold text-gray-900" data-spec-id="QGsztMHr62bHlU1Z">Relatórios e Análises</h1>
          <p className="text-gray-600" data-spec-id="5ZfYklEkrKKAoa19">Visualize estatísticas e relatórios do sistema</p>
        </div>
      </div>

      <Card data-spec-id="nVHsVXw7qw5gSWWr">
        <CardHeader data-spec-id="WiJNdBc7u31H0ENq">
          <CardTitle className="flex items-center" data-spec-id="c11W8QOsV0EEOFAJ">
            <BarChart3 className="mr-2 h-5 w-5" data-spec-id="6cdvLw6dPnmydPuK"/>
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent data-spec-id="gYE58VhhxkriIDj3">
          <p className="text-gray-600" data-spec-id="xEnRtENOQCzyHnci">
            Os relatórios e análises serão implementados em breve.
            Aqui você poderá visualizar estatísticas detalhadas do sistema.
          </p>
        </CardContent>
      </Card>
    </div>);
};
export default ReportsView;
