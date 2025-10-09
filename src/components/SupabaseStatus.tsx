import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Wifi, WifiOff, RefreshCw, CheckCircle, Info, Search } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
const SupabaseStatus = ()=>{
    const { isSupabaseConnected, initializeSupabase } = useSupabaseAuth();
    const [isInitializing, setIsInitializing] = useState(false);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
    const handleInitializeSupabase = async ()=>{
        setIsInitializing(true);
        setDiagnosticResults(null);
        try {
            console.log('🔄 Manual Supabase initialization requested...');
            await handleDiagnoseConnection();
            const success = await initializeSupabase();
            if (success) {
                toast.success('🎉 Supabase database connected successfully!');
                setTimeout(()=>handleDiagnoseConnection(), 1000);
            } else {
                toast.error('Failed to connect to Supabase. Running diagnosis...');
                setTimeout(()=>handleDiagnoseConnection(), 500);
            }
        } catch (error) {
            console.error('Initialization error:', error);
            toast.error('Failed to initialize Supabase connection.');
            setTimeout(()=>handleDiagnoseConnection(), 500);
        } finally{
            setIsInitializing(false);
        }
    };
    const handleDiagnoseConnection = async ()=>{
        setIsDiagnosing(true);
        setDiagnosticResults(null);
        try {
            console.log('🔍 Starting Supabase connection diagnosis...');
            const results: any = {
                environment: {},
                connection: {},
                tables: {},
                data: {}
            };
            const actualUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wzlfjrzxzsbsideglexo.supabase.co';
            const actualKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bGZqcnp4enNic2lkZWdsZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDE4MTAsImV4cCI6MjA3MzgxNzgxMH0.lmLgmKjCuPkW2EBSQYzx2PkM5Qj42dDXi6ELfahL-Yk';
            results.environment.url = actualUrl;
            results.environment.key = actualKey ? 'Set (hardcoded)' : 'Not set';
            results.environment.configured = !!(actualUrl && actualKey && actualUrl !== 'https://your-project.supabase.co' && actualKey !== 'your-anon-key');
            if (!results.environment.configured) {
                results.connection.status = 'Environment variables not configured';
                setDiagnosticResults(results);
                return;
            }
            try {
                const { data, error } = await supabase.from('users').select('count').limit(1);
                if (error) {
                    results.connection.status = 'Failed';
                    results.connection.error = error.message;
                    results.tables.users = 'Missing or inaccessible';
                } else {
                    results.connection.status = 'Success';
                    results.tables.users = 'Accessible';
                    const { count } = await supabase.from('users').select('*', {
                        count: 'exact',
                        head: true
                    });
                    results.data.users = count || 0;
                }
            } catch (err: any) {
                results.connection.status = 'Failed';
                results.connection.error = err.message;
            }
            const tables = [
                'daily_checklists',
                'task_progress',
                'professional_categories'
            ];
            for (const table of tables){
                try {
                    const { error } = await supabase.from(table).select('count').limit(1);
                    results.tables[table] = error ? 'Missing' : 'Accessible';
                } catch  {
                    results.tables[table] = 'Missing';
                }
            }
            setDiagnosticResults(results);
            console.log('🔍 Diagnosis complete:', results);
        } catch (error) {
            console.error('Diagnosis failed:', error);
            toast.error('Failed to diagnose connection');
        } finally{
            setIsDiagnosing(false);
        }
    };
    return (<Card className="mb-6" data-spec-id="supabase-status-card">
      <CardHeader data-spec-id="supabase-status-header">
        <CardTitle className="flex items-center gap-2" data-spec-id="supabase-status-title">
          <Database className="w-5 h-5" data-spec-id="database-icon"/>
          Database Status
        </CardTitle>
        <CardDescription data-spec-id="supabase-status-description">
          Current database connection and configuration status
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4" data-spec-id="supabase-status-content">
        <div className="flex items-center justify-between" data-spec-id="connection-status">
          <div className="flex items-center gap-2" data-spec-id="status-indicator">
            {isSupabaseConnected ? (<>
                <Wifi className="w-4 h-4 text-green-600" data-spec-id="wifi-connected-icon"/>
                <Badge variant="default" className="bg-green-600" data-spec-id="connected-badge">
                  Supabase Connected
                </Badge>
              </>) : (<>
                <WifiOff className="w-4 h-4 text-orange-600" data-spec-id="wifi-disconnected-icon"/>
                <Badge variant="outline" className="text-orange-600 border-orange-200" data-spec-id="localStorage-badge">
                  localStorage Mode
                </Badge>
              </>)}
          </div>
          
          <div className="flex gap-2" data-spec-id="action-buttons">
            {!isSupabaseConnected && (<Button onClick={handleInitializeSupabase} disabled={isInitializing} size="sm" data-spec-id="initialize-supabase-button">
                {isInitializing ? (<>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" data-spec-id="loading-icon"/>
                    Connecting...
                  </>) : (<>
                    <Database className="w-4 h-4 mr-2" data-spec-id="database-connect-icon"/>
                    Connect to Supabase
                  </>)}
              </Button>)}
            
            <Button onClick={handleDiagnoseConnection} disabled={isDiagnosing} size="sm" variant="outline" data-spec-id="diagnose-button">
              {isDiagnosing ? (<>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" data-spec-id="diagnose-loading-icon"/>
                  Diagnosing...
                </>) : (<>
                  <Search className="w-4 h-4 mr-2" data-spec-id="diagnose-icon"/>
                  Diagnose Connection
                </>)}
            </Button>
            
            {diagnosticResults?.connection?.status === 'Success' && !isSupabaseConnected && (<Button onClick={()=>window.location.reload()} size="sm" variant="secondary" data-spec-id="refresh-page-button">
                <RefreshCw className="w-4 h-4 mr-2" data-spec-id="refresh-icon"/>
                Refresh Page
              </Button>)}
          </div>
        </div>

        {isSupabaseConnected ? (<Alert className="border-green-200 bg-green-50" data-spec-id="connected-alert">
            <CheckCircle className="h-4 w-4 text-green-600" data-spec-id="success-icon"/>
            <AlertDescription className="text-green-800" data-spec-id="connected-description">
              <strong data-spec-id="w4BHkI6u9BmNEqHX">Database Connected!</strong> All data is now being stored in PostgreSQL. 
              Your data is secure, synchronized, and backed up automatically.
            </AlertDescription>
          </Alert>) : (<Alert className="border-orange-200 bg-orange-50" data-spec-id="localStorage-alert">
            <Info className="h-4 w-4 text-orange-600" data-spec-id="info-icon"/>
            <AlertDescription className="text-orange-800" data-spec-id="localStorage-description">
              <strong data-spec-id="fRvcQfeEZOgs28pw">Running in localStorage mode.</strong> Data is stored locally in your browser. 
              <br data-spec-id="mAskjIRTkQHGJ0ZE"/><br data-spec-id="tNh6b3Ke9HCSxg1D"/>
              <strong data-spec-id="PYc0eM0M89Y6dPp5">To connect to Supabase:</strong>
              <ol className="mt-2 ml-4 text-sm list-decimal" data-spec-id="pIdOUghVf9TCtKDk">
                <li data-spec-id="i2m127ptMdUoe8Qj">Create a Supabase project at <a href="https://supabase.com" target="_blank" className="underline text-blue-600" data-spec-id="Q5eG2l7KEftNQADk">supabase.com</a></li>
                <li data-spec-id="xGwrNnKqn6acApf5">Run the SQL script from <code className="bg-gray-200 px-1 rounded" data-spec-id="J0ObNifKm3QPLCCl">database-setup.sql</code></li>
                <li data-spec-id="NN9zqnb85EbymuAU">Set environment variables: <code className="bg-gray-200 px-1 rounded" data-spec-id="a9VGmamZnHxefZNG">VITE_SUPABASE_URL</code> and <code className="bg-gray-200 px-1 rounded" data-spec-id="i74HO1Phn464b9wh">VITE_SUPABASE_ANON_KEY</code></li>
                <li data-spec-id="SPiqW2rGNmeSQCTT">Redeploy the application</li>
              </ol>
              <div className="mt-2 text-sm" data-spec-id="edUrctn3EgtI2xtC">
                📖 See <code className="bg-gray-200 px-1 rounded" data-spec-id="ZE5WfJX3YrEiRNGc">SUPABASE-SETUP.md</code> for detailed instructions.
              </div>
            </AlertDescription>
          </Alert>)}

        {diagnosticResults && (<Alert className="border-blue-200 bg-blue-50 mt-4" data-spec-id="diagnostic-alert">
            <Info className="h-4 w-4 text-blue-600" data-spec-id="diagnostic-icon"/>
            <AlertDescription className="text-blue-800" data-spec-id="diagnostic-description">
              <strong data-spec-id="diagnostic-title">🔍 Connection Diagnosis Results:</strong>
              <div className="mt-3 space-y-2 text-sm" data-spec-id="diagnostic-results">
                <div data-spec-id="env-section">
                  <strong data-spec-id="env-title">Environment:</strong>
                  <ul className="ml-4 list-disc" data-spec-id="env-list">
                    <li data-spec-id="env-url">URL: {diagnosticResults.environment?.url}</li>
                    <li data-spec-id="env-key">API Key: {diagnosticResults.environment?.key}</li>
                  </ul>
                </div>
                
                <div data-spec-id="connection-section">
                  <strong data-spec-id="connection-title">Connection:</strong>
                  <ul className="ml-4 list-disc" data-spec-id="connection-list">
                    <li data-spec-id="connection-status">Status: {diagnosticResults.connection?.status}</li>
                    {diagnosticResults.connection?.error && (<li className="text-red-600" data-spec-id="connection-error">Error: {diagnosticResults.connection.error}</li>)}
                  </ul>
                </div>
                
                <div data-spec-id="tables-section">
                  <strong data-spec-id="tables-title">Tables:</strong>
                  <ul className="ml-4 list-disc" data-spec-id="tables-list">
                    {Object.entries(diagnosticResults.tables || {}).map(([table, status])=>(<li key={table} data-spec-id={`table-${table}`}>
                        {table}: <span className={status === 'Accessible' ? 'text-green-600' : 'text-red-600'} data-spec-id={`status-${table}`}>
                          {status as string}
                        </span>
                      </li>))}
                  </ul>
                </div>
                
                {diagnosticResults.data && Object.keys(diagnosticResults.data).length > 0 && (<div data-spec-id="data-section">
                    <strong data-spec-id="data-title">Data Count:</strong>
                    <ul className="ml-4 list-disc" data-spec-id="data-list">
                      {Object.entries(diagnosticResults.data).map(([table, count])=>(<li key={table} data-spec-id={`data-${table}`}>
                          {table}: {count as string} records
                        </li>))}
                    </ul>
                  </div>)}
              </div>
            </AlertDescription>
          </Alert>)}

        {isSupabaseConnected && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" data-spec-id="database-features">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg" data-spec-id="feature-security">
              <CheckCircle className="w-4 h-4 text-blue-600" data-spec-id="security-icon"/>
              <span className="text-sm text-blue-800" data-spec-id="security-text">Secure Authentication</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg" data-spec-id="feature-backup">
              <CheckCircle className="w-4 h-4 text-green-600" data-spec-id="backup-icon"/>
              <span className="text-sm text-green-800" data-spec-id="backup-text">Automatic Backups</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg" data-spec-id="feature-sync">
              <CheckCircle className="w-4 h-4 text-purple-600" data-spec-id="sync-icon"/>
              <span className="text-sm text-purple-800" data-spec-id="sync-text">Real-time Sync</span>
            </div>
          </div>)}
      </CardContent>
    </Card>);
};
export default SupabaseStatus;
