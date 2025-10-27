import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUsers } from '@/hooks/usePatients';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types/patient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
interface ObstetricNurseEditModalProps {
    patient: Patient | null;
    isOpen: boolean;
    onClose: () => void;
}
const ObstetricNurseEditModal: React.FC<ObstetricNurseEditModalProps> = ({ patient, isOpen, onClose })=>{
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedNurseId, setSelectedNurseId] = useState<string>('');
    const { data: obstetricNurses = [] } = useUsers('enfermeira_obstetrica');
    useEffect(()=>{
        if (patient) {
            setSelectedNurseId(patient.obstetric_nurse_id || '');
        }
    }, [
        patient
    ]);
    const updateObstetricNurseMutation = useMutation({
        mutationFn: async ({ patientId, nurseId, currentNurseId }: {
            patientId: string;
            nurseId: string | null;
            currentNurseId: string | null;
        })=>{
            const { error } = await supabase.from('patients').update({
                obstetric_nurse_id: nurseId
            }).eq('id', patientId);
            if (error) throw error;
            if (user?.id) {
                const { data: userData, error: userError } = await supabase.from('users').select('full_name, user_type').eq('id', user.id).single();
                if (userError) {
                    console.error('Erro ao buscar dados do usuário:', userError);
                }
                let newNurseName = 'Não informado';
                if (nurseId) {
                    const { data: newNurseData, error: newNurseError } = await supabase.from('users').select('full_name').eq('id', nurseId).single();
                    if (newNurseError) {
                        console.error('Erro ao buscar dados da nova enfermeira:', newNurseError);
                    } else {
                        newNurseName = newNurseData.full_name;
                    }
                }
                let oldNurseName = 'Não informado';
                if (currentNurseId) {
                    const { data: oldNurseData, error: oldNurseError } = await supabase.from('users').select('full_name').eq('id', currentNurseId).single();
                    if (oldNurseError) {
                        console.error('Erro ao buscar dados da enfermeira anterior:', oldNurseError);
                    } else {
                        oldNurseName = oldNurseData.full_name;
                    }
                }
                const { error: historyError } = await supabase.from('patient_history').insert({
                    patient_id: patientId,
                    user_id: user.id,
                    action_type: 'update',
                    changed_fields: [
                        'obstetric_nurse_id'
                    ],
                    new_values: {
                        obstetric_nurse_id: newNurseName,
                        _user_name: userData?.full_name || 'Usuário não identificado',
                        _user_type: userData?.user_type || 'unknown'
                    },
                    old_values: {
                        obstetric_nurse_id: oldNurseName
                    }
                });
                if (historyError) {
                    console.error('Erro ao criar histórico de alteração:', historyError);
                }
            }
        },
        onSuccess: ()=>{
            queryClient.invalidateQueries({
                queryKey: [
                    'patients'
                ]
            });
            queryClient.invalidateQueries({
                queryKey: [
                    'patient-history'
                ]
            });
            toast.success('Enfermeira obstétrica atualizada com sucesso!');
            onClose();
        },
        onError: (error: Error)=>{
            console.error('Erro ao atualizar enfermeira obstétrica:', error);
            toast.error('Erro ao atualizar enfermeira obstétrica');
        }
    });
    const handleSave = ()=>{
        if (!patient) return;
        updateObstetricNurseMutation.mutate({
            patientId: patient.id,
            nurseId: selectedNurseId || null,
            currentNurseId: patient.obstetric_nurse_id
        });
    };
    if (!patient) return null;
    return (<Dialog open={isOpen} onOpenChange={onClose} data-spec-id="gu6XZuMtj5673nJk">
      <DialogContent className="sm:max-w-md" data-spec-id="obstetric-nurse-edit-modal">
        <DialogHeader data-spec-id="modal-header">
          <DialogTitle data-spec-id="modal-title">
            Editar Enfermeira Obstétrica
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" data-spec-id="modal-content">
          <div data-spec-id="patient-info">
            <p className="text-sm text-gray-600" data-spec-id="1gC8diwkbk1wHyb4">
              <strong data-spec-id="ZS3oYq6nFouvac3L">Paciente:</strong> {patient.full_name}
            </p>
            <p className="text-sm text-gray-600" data-spec-id="93oY20rr15AcW8iD">
              <strong data-spec-id="tQDNctUBPE6JziDt">Via de parto:</strong> {patient.preferred_delivery_type === 'normal' ? 'Normal' : patient.preferred_delivery_type}
            </p>
          </div>

          <div className="space-y-2" data-spec-id="nurse-selection">
            <Label htmlFor="obstetric-nurse" data-spec-id="nurse-label">
              Enfermeira Obstétrica
            </Label>
            <Select value={selectedNurseId} onValueChange={setSelectedNurseId} data-spec-id="nurse-select">
              <SelectTrigger data-spec-id="nurse-trigger">
                <SelectValue placeholder="Selecione uma enfermeira obstétrica" data-spec-id="nurse-value"/>
              </SelectTrigger>
              <SelectContent data-spec-id="nurse-content">
                <SelectItem value="" data-spec-id="nurse-none">Nenhuma</SelectItem>
                {obstetricNurses.map((nurse)=>(<SelectItem key={nurse.id} value={nurse.id} data-spec-id={`nurse-option-${nurse.id}`}>
                    {nurse.full_name}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2" data-spec-id="modal-actions">
            <Button variant="outline" onClick={onClose} disabled={updateObstetricNurseMutation.isPending} data-spec-id="cancel-button">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateObstetricNurseMutation.isPending} data-spec-id="save-button">
              {updateObstetricNurseMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
};
export default ObstetricNurseEditModal;
