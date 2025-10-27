import React, { useState } from 'react';
import { useAllMaternities, useMaternities } from '@/hooks/useMaternities';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import MaternityFormModal from './MaternityFormModal';
interface MaternitiesViewProps {
    'data-spec-id'?: string;
}
const MaternitiesView: React.FC<MaternitiesViewProps> = ({ 'data-spec-id': dataSpecId })=>{
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaternity, setSelectedMaternity] = useState<any>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const { canRegisterBirth } = useUserPermissions();
    const { data: maternities, isLoading, error } = useAllMaternities();
    const { deleteMaternity, deactivateMaternity, isDeleting, isDeactivating } = useMaternities();
    const filteredMaternities = maternities?.filter((maternity)=>{
        const searchLower = searchTerm.toLowerCase();
        return maternity.name.toLowerCase().includes(searchLower);
    }) || [];
    const handleNewMaternity = ()=>{
        setSelectedMaternity(null);
        setShowFormModal(true);
    };
    const handleEditMaternity = (maternity: any)=>{
        setSelectedMaternity(maternity);
        setShowFormModal(true);
    };
    const handleDeleteMaternity = (id: string)=>{
        deleteMaternity({
            id
        });
    };
    const handleForceDeleteMaternity = (id: string)=>{
        deleteMaternity({
            id,
            force: true
        });
    };
    const closeModal = ()=>{
        setShowFormModal(false);
        setSelectedMaternity(null);
    };
    if (!canRegisterBirth) {
        return (<div className="flex items-center justify-center min-h-[400px]" data-spec-id="access-denied">
        <Card className="w-full max-w-md" data-spec-id="access-denied-card">
          <CardContent className="text-center py-12" data-spec-id="access-denied-content">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" data-spec-id="access-denied-icon"/>
            <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="access-denied-title">
              Acesso Negado
            </h3>
            <p className="text-gray-600" data-spec-id="access-denied-description">
              Você não tem permissão para gerenciar maternidades.
            </p>
          </CardContent>
        </Card>
      </div>);
    }
    return (<div className="space-y-6" data-spec-id={dataSpecId}>
      <div className="flex flex-col space-y-4" data-spec-id="header-section">
        <div className="flex items-center justify-between" data-spec-id="header-row">
          <div data-spec-id="title-section">
            <h1 className="text-2xl font-bold text-gray-900" data-spec-id="page-title">
              Maternidades
            </h1>
            <p className="text-gray-600" data-spec-id="page-description">
              Cadastre e gerencie as maternidades onde os partos ocorrem
            </p>
          </div>
          
          <Badge variant="outline" className="text-sm" data-spec-id="count-badge">
            {filteredMaternities.length} maternidade(s)
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" data-spec-id="controls-section">
          <div className="relative max-w-md flex-1" data-spec-id="search-section">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" data-spec-id="search-icon"/>
            <Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="pl-10" data-spec-id="search-input"/>
          </div>

          <Button onClick={handleNewMaternity} data-spec-id="new-maternity-button">
            <Plus className="h-4 w-4 mr-2" data-spec-id="plus-icon"/>
            Nova Maternidade
          </Button>
        </div>
      </div>

      {}
      {error && (<Alert variant="destructive" data-spec-id="error-alert">
          <AlertCircle className="h-4 w-4" data-spec-id="error-icon"/>
          <AlertDescription data-spec-id="error-message">
            Erro ao carregar maternidades: {error.message}
          </AlertDescription>
        </Alert>)}

      {}
      {isLoading && (<Card data-spec-id="loading-card">
          <CardHeader data-spec-id="loading-header">
            <Skeleton className="h-6 w-48" data-spec-id="loading-title"/>
          </CardHeader>
          <CardContent data-spec-id="loading-content">
            <div className="space-y-4" data-spec-id="loading-rows">
              {Array.from({
        length: 5
    }).map((_, index)=>(<div key={index} className="flex space-x-4" data-spec-id={`loading-row-${index}`}>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-1-${index}`}/>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-2-${index}`}/>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-3-${index}`}/>
                  <Skeleton className="h-4 w-1/4" data-spec-id={`loading-cell-4-${index}`}/>
                </div>))}
            </div>
          </CardContent>
        </Card>)}

      {}
      {!isLoading && !error && (<Card data-spec-id="maternities-card">
          <CardHeader data-spec-id="table-header">
            <CardTitle className="flex items-center" data-spec-id="table-title">
              <Building2 className="h-5 w-5 mr-2" data-spec-id="table-icon"/>
              Maternidades Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent data-spec-id="table-content">
            {filteredMaternities.length === 0 ? (<div className="text-center py-12" data-spec-id="empty-state">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" data-spec-id="empty-icon"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2" data-spec-id="empty-title">
                  Nenhuma maternidade encontrada
                </h3>
                <p className="text-gray-600" data-spec-id="empty-description">
                  {searchTerm ? 'Nenhuma maternidade encontrada com esse nome.' : 'Cadastre a primeira maternidade do sistema.'}
                </p>
              </div>) : (<div className="overflow-x-auto" data-spec-id="table-container">
                <Table data-spec-id="maternities-table">
                  <TableHeader data-spec-id="table-header-row">
                    <TableRow data-spec-id="header-row">
                      <TableHead className="min-w-[300px]" data-spec-id="name-header">Nome</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="status-header">Status</TableHead>
                      <TableHead className="min-w-[120px]" data-spec-id="created-header">Criado em</TableHead>
                      <TableHead className="min-w-[100px]" data-spec-id="actions-header">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-spec-id="table-body">
                    {filteredMaternities.map((maternity)=>(<TableRow key={maternity.id} data-spec-id={`maternity-row-${maternity.id}`}>
                        <TableCell className="font-medium" data-spec-id={`name-cell-${maternity.id}`}>
                          {maternity.name}
                        </TableCell>
                        <TableCell data-spec-id={`status-cell-${maternity.id}`}>
                          <Badge variant={maternity.is_active ? 'default' : 'secondary'} data-spec-id={`status-badge-${maternity.id}`}>
                            {maternity.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell data-spec-id={`created-cell-${maternity.id}`}>
                          {formatDate(new Date(maternity.created_at))}
                        </TableCell>
                        <TableCell data-spec-id={`actions-cell-${maternity.id}`}>
                          <div className="flex space-x-2" data-spec-id={`actions-group-${maternity.id}`}>
                            <Button variant="outline" size="sm" onClick={()=>handleEditMaternity(maternity)} data-spec-id={`edit-button-${maternity.id}`}>
                              <Edit className="h-4 w-4" data-spec-id={`edit-icon-${maternity.id}`}/>
                            </Button>
                            
                            <AlertDialog data-spec-id={`delete-dialog-${maternity.id}`}>
                              <AlertDialogTrigger asChild data-spec-id={`delete-trigger-${maternity.id}`}>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" disabled={isDeleting} data-spec-id={`delete-button-${maternity.id}`}>
                                  <Trash2 className="h-4 w-4" data-spec-id={`delete-icon-${maternity.id}`}/>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-spec-id={`delete-content-${maternity.id}`}>
                                <AlertDialogHeader data-spec-id={`delete-header-${maternity.id}`}>
                                  <AlertDialogTitle data-spec-id={`delete-title-${maternity.id}`}>
                                    Gerenciar Maternidade
                                  </AlertDialogTitle>
                                  <AlertDialogDescription data-spec-id={`delete-description-${maternity.id}`}>
                                    <div className="space-y-3" data-spec-id="ccDOnhrHFSz5GoLj">
                                      <p data-spec-id="88b3cRZHx1u5eIYu">Como deseja proceder com a maternidade "{maternity.name}"?</p>
                                      <div className="text-sm space-y-2" data-spec-id="svfJ5Db1kQse2UBX">
                                        <p data-spec-id="GC7KtNxc39lTiYUu"><strong data-spec-id="32zXqwqw85MlwFXq">Desativar:</strong> Remove da lista ativa mas mantém histórico</p>
                                        <p data-spec-id="I7OfV9hNnqIe6VbS"><strong data-spec-id="GhwKdgL0dShaZCC8">Excluir:</strong> Remove permanentemente do sistema</p>
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter data-spec-id={`delete-footer-${maternity.id}`}>
                                  <AlertDialogCancel data-spec-id={`delete-cancel-${maternity.id}`}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction asChild data-spec-id={`deactivate-action-${maternity.id}`}>
                                    <Button onClick={()=>deactivateMaternity(maternity.id)} variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" disabled={isDeactivating} data-spec-id={`deactivate-button-${maternity.id}`}>
                                      Desativar
                                    </Button>
                                  </AlertDialogAction>
                                  <AlertDialogAction onClick={()=>handleDeleteMaternity(maternity.id)} className="bg-red-600 hover:bg-red-700" disabled={isDeleting} data-spec-id={`delete-confirm-${maternity.id}`}>
                                    Excluir Permanentemente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>)}
          </CardContent>
        </Card>)}

      {}
      <MaternityFormModal isOpen={showFormModal} onClose={closeModal} maternity={selectedMaternity} data-spec-id="Uv3N60g2omOf7nit"/>
    </div>);
};
export default MaternitiesView;
