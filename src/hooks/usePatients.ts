import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Patient } from '@/types/patient';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calculateGestationalAge } from '@/utils/dateUtils';

interface PatientsFilters {
  search?: string;
  status?: 'todas' | 'ativas' | 'nascidos';
  obstetrician?: string[];
  deliveryType?: string[];
  obstetricNurse?: string[];
  doula?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
}

export const usePatients = (filters: PatientsFilters = {}) => {
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ['patients', filters],
    queryFn: async () => {
      console.log('Buscando pacientes com filtros:', filters);
      
      try {
        // Primeiro, buscar dados básicos dos pacientes
        let query = supabase
          .from('patients')
          .select('*')
          .eq('is_removed', false) // Excluir pacientes removidas
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters.search) {
          console.log('Aplicando filtro de busca:', filters.search);
          query = query.or(`full_name.ilike.%${filters.search}%,baby_name.ilike.%${filters.search}%`);
        }

        if (filters.status === 'ativas') {
          console.log('Aplicando filtro de status: ativas');
          query = query.eq('is_born', false);
        } else if (filters.status === 'nascidos') {
          console.log('Aplicando filtro de status: nascidos');
          query = query.eq('is_born', true);
        }

        if (filters.obstetrician && filters.obstetrician.length > 0) {
          console.log('Aplicando filtro de obstetra:', filters.obstetrician);
          query = query.in('obstetrician_id', filters.obstetrician);
        }

        if (filters.deliveryType && filters.deliveryType.length > 0) {
          console.log('Aplicando filtro de tipo de parto:', filters.deliveryType);
          query = query.in('preferred_delivery_type', filters.deliveryType);
        }

        if (filters.obstetricNurse && filters.obstetricNurse.length > 0) {
          console.log('Aplicando filtro de enfermeira obstétrica:', filters.obstetricNurse);
          query = query.in('obstetric_nurse_id', filters.obstetricNurse);
        }

        if (filters.doula && filters.doula.length > 0) {
          console.log('Aplicando filtro de doula:', filters.doula);
          query = query.in('doula_id', filters.doula);
        }

        if (filters.dueDateFrom) {
          query = query.gte('estimated_due_date', filters.dueDateFrom);
        }

        if (filters.dueDateTo) {
          query = query.lte('estimated_due_date', filters.dueDateTo);
        }

        const { data: patientsData, error: patientsError } = await query;

        if (patientsError) {
          console.error('Erro ao buscar pacientes:', patientsError);
          throw patientsError;
        }

        console.log('Dados brutos da query:', patientsData);

        if (!patientsData || patientsData.length === 0) {
          console.log('Nenhuma paciente encontrada');
          return [];
        }

        // Buscar informações dos usuários (profissionais)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name');

        if (usersError) {
          console.error('Erro ao buscar usuários:', usersError);
          // Continuar mesmo se der erro nos usuários
        }

        // Mapear os dados dos usuários
        const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

        // Combinar dados dos pacientes com dados dos usuários
        const patientsWithUsers = patientsData.map(patient => ({
          ...patient,
          obstetrician: patient.obstetrician_id ? usersMap.get(patient.obstetrician_id) : null,
          pediatrician: patient.pediatrician_id ? usersMap.get(patient.pediatrician_id) : null,
          doula: patient.doula_id ? usersMap.get(patient.doula_id) : null,
          obstetric_nurse: patient.obstetric_nurse_id ? usersMap.get(patient.obstetric_nurse_id) : null,
          nutritionist: patient.nutritionist_id ? usersMap.get(patient.nutritionist_id) : null,
          lactation_consultant: patient.lactation_consultant_id ? usersMap.get(patient.lactation_consultant_id) : null,
          pelvic_physiotherapist: patient.pelvic_physiotherapist_id ? usersMap.get(patient.pelvic_physiotherapist_id) : null,
        }));

        console.log('Pacientes encontradas:', patientsWithUsers.length);
        return patientsWithUsers as Patient[];
        
      } catch (error) {
        console.error('Erro na função queryFn:', error);
        throw error;
      }
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async ({ patientId, userId, reason }: { patientId: string; userId: string; reason?: string }) => {
      console.log('Removendo paciente do acompanhamento:', patientId, 'por:', userId);
      
      // 0. Buscar dados da paciente para calcular idade gestacional atual
      const { data: patientData, error: fetchError } = await supabase
        .from('patients')
        .select('estimated_due_date, is_born')
        .eq('id', patientId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar dados da paciente:', fetchError);
        throw fetchError;
      }

      // Calcular idade gestacional atual no momento da remoção
      let currentGestationalAge = null;
      if (patientData && !patientData.is_born) {
        try {
          const [year, month, day] = patientData.estimated_due_date.split('-').map(Number);
          const dppDate = new Date(year, month - 1, day);
          currentGestationalAge = calculateGestationalAge(dppDate);
          console.log('Idade gestacional calculada no momento da remoção:', currentGestationalAge);
        } catch (error) {
          console.error('Erro ao calcular idade gestacional:', error);
        }
      }

      // 1. Marcar paciente como removida (exclusão suave) + salvar idade gestacional
      const updateData: any = {
        is_removed: true,
        removed_at: new Date().toISOString(),
        removed_by: userId,
        removal_reason: reason || 'Sem motivo especificado'
      };

      // Adicionar idade gestacional se calculada
      if (currentGestationalAge) {
        updateData.removal_gestational_age_weeks = currentGestationalAge.weeks;
        updateData.removal_gestational_age_days = currentGestationalAge.days;
      }

      const { error: patientError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId);

      if (patientError) {
        console.error('Erro ao remover paciente:', patientError);
        throw patientError;
      }

      // 2. Se a paciente já nasceu, marcar também na tabela born_patients
      const bornUpdateData: any = {
        is_removed: true,
        removed_at: new Date().toISOString(),
        removed_by: userId,
        removal_reason: reason || 'Sem motivo especificado'
      };

      // Para pacientes nascidas, usar a idade gestacional do nascimento se disponível
      const { error: bornPatientError } = await supabase
        .from('born_patients')
        .update(bornUpdateData)
        .eq('patient_id', patientId);

      // Não falhar se não existir registro em born_patients
      if (bornPatientError && !bornPatientError.message.includes('0 rows')) {
        console.error('Erro ao remover paciente nascida:', bornPatientError);
        throw bornPatientError;
      }

      // 3. Registrar no histórico
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['patient_removed'],
          new_values: { 
            is_removed: true,
            removed_at: new Date().toISOString(),
            removal_reason: reason || 'Sem motivo especificado',
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { is_removed: false }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de remoção:', historyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['removed-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Paciente removida do acompanhamento');
    },
    onError: (error) => {
      console.error('Erro na remoção:', error);
      toast.error('Erro ao remover paciente');
    },
  });

  const updatePatientStatusMutation = useMutation({
    mutationFn: async ({ patientId, is_born }: { patientId: string; is_born: boolean }) => {
      console.log('Atualizando status da paciente:', patientId, 'para', is_born ? 'nascido' : 'ativa');
      
      const { error } = await supabase
        .from('patients')
        .update({ is_born })
        .eq('id', patientId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro na atualização:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async ({ patientData, userId }: { patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>, userId: string }) => {
      console.log('Criando nova paciente:', patientData);
      
      // 1. Criar a paciente
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (patientError) {
        console.error('Erro ao criar paciente:', patientError);
        throw patientError;
      }

      // 2. Buscar informações do usuário para o histórico
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      // 3. Criar entrada no histórico para registro da criação
      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: newPatient.id,
          user_id: userId,
          action_type: 'create',
          changed_fields: ['patient_created'],
          new_values: { 
            patient_name: newPatient.full_name,
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: null
        });

      if (historyError) {
        console.error('Erro ao criar histórico:', historyError);
        // Não falhamos a operação por causa do histórico, mas logamos o erro
      }

      return newPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Paciente cadastrada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro na criação:', error);
      toast.error('Erro ao cadastrar paciente');
    },
  });

  const registerBirthMutation = useMutation({
    mutationFn: async ({ 
      patientId, 
      birthData, 
      userId 
    }: { 
      patientId: string; 
      birthData: any; 
      userId: string 
    }) => {
      console.log('Registrando nascimento:', patientId, birthData, 'por:', userId);
      
      // 1. Buscar dados da paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) {
        console.error('Erro ao buscar dados da paciente:', patientError);
        throw patientError;
      }

      // 2. Buscar nome da maternidade para gravar como texto (sem referência)
      let maternityName = null;
      if (birthData.maternity_id) {
        const { data: maternityData, error: maternityError } = await supabase
          .from('maternities')
          .select('name')
          .eq('id', birthData.maternity_id)
          .single();

        if (maternityError) {
          console.warn('Erro ao buscar nome da maternidade:', maternityError);
        } else {
          maternityName = maternityData.name;
        }
      }

      // 3. Calcular idade gestacional no momento do parto
      const birthDate = new Date(birthData.birth_date);
      const registrationDate = new Date(patientData.registration_date);
      const registrationGA = patientData.registration_gestational_age_weeks;
      const registrationGADays = patientData.registration_gestational_age_days || 0;

      // Diferença em dias desde o cadastro
      const daysDifference = Math.floor((birthDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcular IG no parto
      const totalDaysAtRegistration = (registrationGA * 7) + registrationGADays;
      const totalDaysAtBirth = totalDaysAtRegistration + daysDifference;
      const weeksAtBirth = Math.floor(totalDaysAtBirth / 7);
      const daysAtBirth = totalDaysAtBirth % 7;

      // 4. Calcular idade da mãe no momento do parto (congelar valor)
      const motherBirthDate = new Date(patientData.birth_date);
      const motherAgeAtBirth = Math.floor((birthDate.getTime() - motherBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

      // 5. Criar registro na tabela born_patients
      const bornPatientData = {
        patient_id: patientId,
        full_name: patientData.full_name,
        patient_birth_date: patientData.birth_date,
        birth_date: birthData.birth_date,
        birth_gestational_age_weeks: weeksAtBirth,
        birth_gestational_age_days: daysAtBirth,
        baby_gender: birthData.baby_gender,
        baby_name: birthData.baby_name || patientData.baby_name || '',
        delivery_type: birthData.delivery_type,
        preferred_delivery_type: patientData.preferred_delivery_type,
        maternity_id: null, // Não manter referência para permitir exclusão da maternidade
        maternity: maternityName, // Gravar apenas o nome da maternidade
        mother_age_at_birth: motherAgeAtBirth, // Idade da mãe congelada no momento do parto
        obstetric_nurse_present_id: birthData.obstetric_nurse_present_id || null,
        doula_present_id: birthData.doula_present_id || null,
        birth_observations: birthData.birth_observations,
        estimated_due_date: patientData.estimated_due_date,
        registration_date: patientData.registration_date,
        registration_gestational_age_weeks: patientData.registration_gestational_age_weeks,
        registration_gestational_age_days: patientData.registration_gestational_age_days,
        created_by: userId, // Registrar quem criou o nascimento
        // Copiar dados dos profissionais
        obstetrician_id: patientData.obstetrician_id || null,
        pediatrician_id: patientData.pediatrician_id || null,
        doula_id: patientData.doula_id || null,
        obstetric_nurse_id: patientData.obstetric_nurse_id || null,
        nutritionist_id: patientData.nutritionist_id || null,
        lactation_consultant_id: patientData.lactation_consultant_id || null,
        pelvic_physiotherapist_id: patientData.pelvic_physiotherapist_id || null,
        // Copiar dados de cursos/serviços
        birth_preparation_course: patientData.birth_preparation_course,
        birth_preparation_date: patientData.birth_preparation_date,
        birth_preparation_status: patientData.birth_preparation_status,
        newborn_care_course: patientData.newborn_care_course,
        newborn_care_date: patientData.newborn_care_date,
        newborn_care_status: patientData.newborn_care_status,
        breastfeeding_workshop: patientData.breastfeeding_workshop,
        breastfeeding_workshop_date: patientData.breastfeeding_workshop_date,
        breastfeeding_workshop_status: patientData.breastfeeding_workshop_status,
        pelvic_physiotherapy: patientData.pelvic_physiotherapy,
        nutritional_monitoring: patientData.nutritional_monitoring,
        pediatric_consultation: patientData.pediatric_consultation,
        pediatric_consultation_date: patientData.pediatric_consultation_date,
        pediatric_consultation_status: patientData.pediatric_consultation_status,
        // Copiar dados comerciais (congelados no momento do nascimento)
        commercial_conditions: patientData.commercial_conditions,
        payment_records: patientData.payment_records,
        // Copiar dados médicos (congelados no momento do nascimento)
        medical_observations: patientData.medical_observations,
        gestational_observations: patientData.gestational_observations,
        weeks_20_date: patientData.weeks_20_date,
        weeks_30_date: patientData.weeks_30_date,
        weeks_32_date: patientData.weeks_32_date,
        weeks_36_date: patientData.weeks_36_date,
      };

      const { data: bornPatient, error: bornError } = await supabase
        .from('born_patients')
        .insert(bornPatientData)
        .select()
        .single();

      if (bornError) {
        console.error('Erro ao criar registro de nascimento:', bornError);
        throw bornError;
      }

      // 6. Atualizar status da paciente para nascida
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          is_born: true,
          baby_name: birthData.baby_name || patientData.baby_name || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) {
        console.error('Erro ao atualizar status da paciente:', updateError);
        throw updateError;
      }

      // 7. Registrar no histórico - buscar nomes de exibição
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      // Mapear códigos para nomes de exibição
      const getDeliveryTypeLabel = (type: string) => {
        const labels = { 'normal': 'Normal', 'cesariana': 'Cesariana' };
        return labels[type as keyof typeof labels] || type;
      };

      const getGenderLabel = (gender: string) => {
        const labels = { 'masculino': 'Masculino', 'feminino': 'Feminino' };
        return labels[gender as keyof typeof labels] || gender;
      };

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['birth_registered'],
          new_values: { 
            birth_registered: 'Sim',
            birth_date: new Date(birthData.birth_date).toLocaleDateString('pt-BR'),
            delivery_type: getDeliveryTypeLabel(birthData.delivery_type),
            baby_gender: getGenderLabel(birthData.baby_gender),
            birth_gestational_age: `${weeksAtBirth}s${daysAtBirth}d`,
            maternity: maternityName || 'Não informado',
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { birth_registered: 'Não' }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de nascimento:', historyError);
      }

      return bornPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['born-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Nascimento registrado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro no registro de nascimento:', error);
      toast.error('Erro ao registrar nascimento');
    },
  });

  const permanentlyDeletePatientMutation = useMutation({
    mutationFn: async ({ patientId, patientType, userId }: { patientId: string; patientType: 'patient' | 'born_patient'; userId: string }) => {
      console.log('Excluindo definitivamente paciente:', patientId, 'tipo:', patientType, 'por:', userId);
      
      // 1. Registrar no histórico antes de excluir
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      // Buscar dados da paciente antes de excluir para o histórico
      const tableFrom = patientType === 'patient' ? 'patients' : 'born_patients';
      const patientIdColumn = patientType === 'patient' ? 'id' : 'patient_id';
      
      const { data: patientData, error: fetchError } = await supabase
        .from(tableFrom)
        .select('full_name')
        .eq(patientIdColumn, patientId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar dados da paciente:', fetchError);
      }

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['patient_permanently_deleted'],
          new_values: { 
            permanently_deleted: true,
            patient_name: patientData?.full_name || 'Nome não encontrado',
            deleted_from_table: tableFrom,
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { permanently_deleted: false }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de exclusão:', historyError);
      }

      // 2. Excluir da tabela de pacientes (se for paciente normal)
      if (patientType === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .delete()
          .eq('id', patientId);

        if (patientError) {
          console.error('Erro ao excluir paciente:', patientError);
          throw patientError;
        }
      }

      // 3. Excluir da tabela born_patients (sempre tentar)
      const { error: bornPatientError } = await supabase
        .from('born_patients')
        .delete()
        .eq('patient_id', patientId);

      // Não falhar se não existir registro em born_patients
      if (bornPatientError && !bornPatientError.message.includes('0 rows')) {
        console.error('Erro ao excluir paciente nascida:', bornPatientError);
        throw bornPatientError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['removed-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Paciente excluída definitivamente do sistema');
    },
    onError: (error) => {
      console.error('Erro na exclusão definitiva:', error);
      toast.error('Erro ao excluir paciente definitivamente');
    },
  });

  // Função para atribuir enfermeira obstétrica
  const assignObstetricNurseMutation = useMutation({
    mutationFn: async ({ patientId, nurseId, userId }: { patientId: string; nurseId: string; userId: string }) => {
      const { error } = await supabase
        .from('patients')
        .update({ obstetric_nurse_id: nurseId })
        .eq('id', patientId);

      if (error) throw error;

      // Registrar no histórico - buscar nomes de exibição
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      const { data: nurseData, error: nurseError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', nurseId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      if (nurseError) {
        console.error('Erro ao buscar dados da enfermeira:', nurseError);
      }

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['obstetric_nurse_id'],
          new_values: { 
            obstetric_nurse_id: nurseData?.full_name || 'Enfermeira não identificada',
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { obstetric_nurse_id: 'Não informado' }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de atribuição:', historyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Enfermeira obstétrica atribuída com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atribuir enfermeira obstétrica:', error);
      toast.error('Erro ao atribuir enfermeira obstétrica');
    },
  });

  // Função para desvincular enfermeira obstétrica
  const unassignObstetricNurseMutation = useMutation({
    mutationFn: async ({ patientId, currentNurseId, userId }: { patientId: string; currentNurseId: string; userId: string }) => {
      const { error } = await supabase
        .from('patients')
        .update({ obstetric_nurse_id: null })
        .eq('id', patientId);

      if (error) throw error;

      // Registrar no histórico - buscar nomes de exibição
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      const { data: currentNurseData, error: currentNurseError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentNurseId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      if (currentNurseError) {
        console.error('Erro ao buscar dados da enfermeira atual:', currentNurseError);
      }

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['obstetric_nurse_id'],
          new_values: { 
            obstetric_nurse_id: 'Não informado',
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { obstetric_nurse_id: currentNurseData?.full_name || 'Enfermeira não identificada' }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de desvinculação:', historyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Enfermeira obstétrica desvinculada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao desvincular enfermeira obstétrica:', error);
      toast.error('Erro ao desvincular enfermeira obstétrica');
    },
  });

  // Função para atribuir doula
  const assignDoulaMutation = useMutation({
    mutationFn: async ({ patientId, doulaId, userId }: { patientId: string; doulaId: string; userId: string }) => {
      const { error } = await supabase
        .from('patients')
        .update({ doula_id: doulaId })
        .eq('id', patientId);

      if (error) throw error;

      // Registrar no histórico - buscar nomes de exibição
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      const { data: doulaData, error: doulaError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', doulaId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      if (doulaError) {
        console.error('Erro ao buscar dados da doula:', doulaError);
      }

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['doula_id'],
          new_values: { 
            doula_id: doulaData?.full_name || 'Doula não identificada',
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { doula_id: 'Não informado' }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de atribuição de doula:', historyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Doula atribuída com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atribuir doula:', error);
      toast.error('Erro ao atribuir doula');
    },
  });

  // Função para desvincular doula
  const unassignDoulaMutation = useMutation({
    mutationFn: async ({ patientId, currentDoulaId, userId }: { patientId: string; currentDoulaId: string; userId: string }) => {
      const { error } = await supabase
        .from('patients')
        .update({ doula_id: null })
        .eq('id', patientId);

      if (error) throw error;

      // Registrar no histórico - buscar nomes de exibição
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      const { data: currentDoulaData, error: currentDoulaError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentDoulaId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      }

      if (currentDoulaError) {
        console.error('Erro ao buscar dados da doula atual:', currentDoulaError);
      }

      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: ['doula_id'],
          new_values: { 
            doula_id: 'Não informado',
            _user_name: userData?.full_name || 'Usuário não identificado',
            _user_type: userData?.user_type || 'unknown'
          },
          old_values: { doula_id: currentDoulaData?.full_name || 'Doula não identificada' }
        });

      if (historyError) {
        console.error('Erro ao criar histórico de desvinculação de doula:', historyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      toast.success('Doula desvinculada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao desvincular doula:', error);
      toast.error('Erro ao desvincular doula');
    },
  });

  return {
    patients: patientsQuery.data || [],
    isLoading: patientsQuery.isLoading,
    error: patientsQuery.error,
    refetch: patientsQuery.refetch,
    createPatient: createPatientMutation.mutate,
    deletePatient: deletePatientMutation.mutate,
    permanentlyDeletePatient: permanentlyDeletePatientMutation.mutate,
    registerBirth: registerBirthMutation.mutate,
    updatePatientStatus: updatePatientStatusMutation.mutate,
    assignObstetricNurse: assignObstetricNurseMutation.mutate,
    unassignObstetricNurse: unassignObstetricNurseMutation.mutate,
    assignDoula: assignDoulaMutation.mutate,
    unassignDoula: unassignDoulaMutation.mutate,
    isCreating: createPatientMutation.isPending,
    isDeleting: deletePatientMutation.isPending,
    isPermanentlyDeleting: permanentlyDeletePatientMutation.isPending,
    isRegisteringBirth: registerBirthMutation.isPending,
    isUpdating: updatePatientStatusMutation.isPending,
    isAssigningNurse: assignObstetricNurseMutation.isPending,
    isUnassigningNurse: unassignObstetricNurseMutation.isPending,
    isAssigningDoula: assignDoulaMutation.isPending,
    isUnassigningDoula: unassignDoulaMutation.isPending,
  };
};

// Hook para buscar pacientes removidas (apenas usuários autorizados)
export const useRemovedPatients = () => {
  return useQuery({
    queryKey: ['removed-patients'],
    queryFn: async () => {
      console.log('Buscando pacientes removidas');
      
      // Buscar pacientes removidas
      const { data: removedPatientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('is_removed', true)
        .order('removed_at', { ascending: false });

      if (patientsError) {
        console.error('Erro ao buscar pacientes removidas:', patientsError);
        throw patientsError;
      }

      // Buscar pacientes nascidas removidas
      const { data: removedBornPatientsData, error: bornPatientsError } = await supabase
        .from('born_patients')
        .select('*')
        .eq('is_removed', true)
        .order('removed_at', { ascending: false });

      if (bornPatientsError) {
        console.error('Erro ao buscar pacientes nascidas removidas:', bornPatientsError);
        throw bornPatientsError;
      }

      // Buscar informações dos usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, user_type');

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError);
      }

      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

      // Combinar e processar dados
      const allRemovedPatients = [
        ...removedPatientsData.map(patient => ({
          ...patient,
          type: 'patient' as const,
          obstetrician: patient.obstetrician_id ? usersMap.get(patient.obstetrician_id) : null,
          pediatrician: patient.pediatrician_id ? usersMap.get(patient.pediatrician_id) : null,
          doula: patient.doula_id ? usersMap.get(patient.doula_id) : null,
          obstetric_nurse: patient.obstetric_nurse_id ? usersMap.get(patient.obstetric_nurse_id) : null,
          nutritionist: patient.nutritionist_id ? usersMap.get(patient.nutritionist_id) : null,
          lactation_consultant: patient.lactation_consultant_id ? usersMap.get(patient.lactation_consultant_id) : null,
          pelvic_physiotherapist: patient.pelvic_physiotherapist_id ? usersMap.get(patient.pelvic_physiotherapist_id) : null,
          removed_by_user: patient.removed_by ? usersMap.get(patient.removed_by) : null,
        })),
        ...removedBornPatientsData.map(patient => ({
          ...patient,
          type: 'born_patient' as const,
          obstetrician: patient.obstetrician_id ? usersMap.get(patient.obstetrician_id) : null,
          pediatrician: patient.pediatrician_id ? usersMap.get(patient.pediatrician_id) : null,
          doula: patient.doula_id ? usersMap.get(patient.doula_id) : null,
          obstetric_nurse: patient.obstetric_nurse_id ? usersMap.get(patient.obstetric_nurse_id) : null,
          nutritionist: patient.nutritionist_id ? usersMap.get(patient.nutritionist_id) : null,
          lactation_consultant: patient.lactation_consultant_id ? usersMap.get(patient.lactation_consultant_id) : null,
          pelvic_physiotherapist: patient.pelvic_physiotherapist_id ? usersMap.get(patient.pelvic_physiotherapist_id) : null,
          removed_by_user: patient.removed_by ? usersMap.get(patient.removed_by) : null,
        }))
      ];

      console.log('Pacientes removidas encontradas:', allRemovedPatients.length);
      return allRemovedPatients;
    },
  });
};

export const useUsers = (userType?: string) => {
  return useQuery({
    queryKey: ['users', userType],
    queryFn: async () => {
      console.log('Buscando usuários do tipo:', userType || 'todos');
      
      let query = supabase
        .from('users')
        .select('*')
        .eq('is_active', true) // Apenas usuários ativos
        .is('deleted_at', null) // Excluir usuários com exclusão suave
        .order('full_name');

      if (userType) {
        query = query.eq('user_type', userType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }

      return data;
    },
  });
};

// Hook para buscar pacientes nascidas com filtros
export const useBornPatients = (filters?: any, userId?: string, userRole?: string) => {
  return useQuery({
    queryKey: ['born-patients', filters, userId, userRole],
    queryFn: async () => {
      console.log('Buscando pacientes nascidas com filtros:', filters);
      console.log('Usuário:', userId, 'Papel:', userRole);
      
      let query = supabase
        .from('born_patients')
        .select(`
          *,
          obstetrician:obstetrician_id(id, full_name, user_type),
          pediatrician:pediatrician_id(id, full_name, user_type),
          doula:doula_id(id, full_name, user_type),
          obstetric_nurse:obstetric_nurse_id(id, full_name, user_type),
          nutritionist:nutritionist_id(id, full_name, user_type),
          lactation_consultant:lactation_consultant_id(id, full_name, user_type),
          pelvic_physiotherapist:pelvic_physiotherapist_id(id, full_name, user_type),
          obstetric_nurse_present:obstetric_nurse_present_id(id, full_name, user_type),
          doula_present:doula_present_id(id, full_name, user_type),
          created_by_user:created_by(id, full_name, user_type)
        `)
        .eq('is_removed', false)
        .order('birth_date', { ascending: false });

      // Filtro específico para doulas: só mostrar nascimentos onde a doula esteve presente
      if (userRole === 'doula' && userId) {
        console.log('Aplicando filtro de doula presente para userId:', userId);
        query = query.eq('doula_present_id', userId);
      }
      
      // Filtro específico para consultoras de amamentação: só mostrar nascimentos de pacientes que contrataram consultoria
      if (userRole === 'consultora_amamentacao') {
        console.log('Aplicando filtro de consultoria de amamentação contratada');
        query = query.eq('breastfeeding_workshop', 'contratado');
      }

      // Aplicar filtros se fornecidos
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,baby_name.ilike.%${filters.search}%`);
      }

      if (filters?.baby_gender && filters.baby_gender.length > 0) {
        query = query.in('baby_gender', filters.baby_gender);
      }

      if (filters?.maternity && filters.maternity.length > 0) {
        query = query.in('maternity', filters.maternity);
      }

      if (filters?.obstetrician && filters.obstetrician.length > 0) {
        query = query.in('obstetrician_id', filters.obstetrician);
      }

      if (filters?.obstetricNursePresent && filters.obstetricNursePresent.length > 0) {
        query = query.in('obstetric_nurse_present_id', filters.obstetricNursePresent);
      }

      if (filters?.doulaPresent && filters.doulaPresent.length > 0) {
        query = query.in('doula_present_id', filters.doulaPresent);
      }

      if (filters?.deliveryType && filters.deliveryType.length > 0) {
        query = query.in('delivery_type', filters.deliveryType);
      }

      if (filters?.birthDateFrom) {
        query = query.gte('birth_date', filters.birthDateFrom);
      }

      if (filters?.birthDateTo) {
        query = query.lte('birth_date', filters.birthDateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar pacientes nascidas:', error);
        throw error;
      }

      console.log('Pacientes nascidas encontradas:', data.length);
      return data;
    },
  });
};

// Hook para editar nascimento
export const useEditBirth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birthData: any) => {
      console.log('Editando nascimento:', birthData);
      
      // Buscar dados do registro atual para verificar se a data de nascimento mudou
      const { data: currentRecord, error: fetchError } = await supabase
        .from('born_patients')
        .select('birth_date, patient_birth_date, mother_age_at_birth')
        .eq('id', birthData.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar registro atual:', fetchError);
        throw fetchError;
      }

      // Buscar nome da maternidade se foi alterada
      let maternityName = null;
      if (birthData.maternity_id) {
        const { data: maternityData, error: maternityError } = await supabase
          .from('maternities')
          .select('name')
          .eq('id', birthData.maternity_id)
          .single();

        if (maternityError) {
          console.warn('Erro ao buscar nome da maternidade na edição:', maternityError);
        } else {
          maternityName = maternityData.name;
        }
      }

      // Recalcular idade da mãe se a data de nascimento mudou
      let motherAgeAtBirth = currentRecord.mother_age_at_birth;
      if (birthData.birth_date !== currentRecord.birth_date) {
        const birthDate = new Date(birthData.birth_date);
        const motherBirthDate = new Date(currentRecord.patient_birth_date);
        motherAgeAtBirth = Math.floor((birthDate.getTime() - motherBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        console.log('Idade da mãe recalculada devido à mudança da data de nascimento:', motherAgeAtBirth);
      }
      
      const { error } = await supabase
        .from('born_patients')
        .update({
          birth_date: birthData.birth_date,
          birth_gestational_age_weeks: birthData.birth_gestational_age_weeks,
          birth_gestational_age_days: birthData.birth_gestational_age_days || 0,
          delivery_type: birthData.delivery_type,
          baby_name: birthData.baby_name || '',
          baby_gender: birthData.baby_gender,
          maternity_id: null, // Não manter referência para permitir exclusão da maternidade
          maternity: maternityName, // Gravar apenas o nome da maternidade
          mother_age_at_birth: motherAgeAtBirth, // Atualizar idade se necessário
          obstetrician_id: birthData.obstetrician_id || null,
          obstetric_nurse_present_id: birthData.obstetric_nurse_present_id || null,
          doula_present_id: birthData.doula_present_id || null,
          birth_observations: birthData.birth_observations || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', birthData.id);

      if (error) {
        console.error('Erro ao editar nascimento:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['born-patients'] });
      toast.success('Nascimento editado com sucesso');
    },
    onError: (error) => {
      console.error('Erro na edição do nascimento:', error);
      toast.error('Erro ao editar nascimento');
    },
  });
};

// Hook para cancelar nascimento
export const useCancelBirth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bornPatientId, patientId }: { bornPatientId: string; patientId: string }) => {
      console.log('Cancelando nascimento:', bornPatientId, 'para paciente:', patientId);
      
      // 1. Remover registro da tabela born_patients
      const { error: deleteError } = await supabase
        .from('born_patients')
        .delete()
        .eq('id', bornPatientId);

      if (deleteError) {
        console.error('Erro ao remover registro de nascimento:', deleteError);
        throw deleteError;
      }

      // 2. Marcar paciente como ativa novamente na tabela patients
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          is_born: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) {
        console.error('Erro ao reativar paciente:', updateError);
        throw updateError;
      }

      console.log('Nascimento cancelado e paciente reativada com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['born-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Nascimento cancelado e paciente reativada');
    },
    onError: (error) => {
      console.error('Erro no cancelamento do nascimento:', error);
      toast.error('Erro ao cancelar nascimento');
    },
  });
};

// Hook para SDR editar apenas serviços contratados
export const useSDREditServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, services, userId }: { 
      patientId: string; 
      services: any; 
      userId: string;
    }) => {
      console.log('SDR editando serviços da paciente:', patientId);
      
      // Buscar dados atuais da paciente para o histórico
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar dados atuais da paciente:', fetchError);
        throw fetchError;
      }

      // Buscar dados do usuário para o histórico
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, user_type')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        throw userError;
      }

      // Identificar campos alterados
      const changedFields: string[] = [];
      const oldValues: any = {};
      const newValues: any = {};

      Object.keys(services).forEach(field => {
        if (currentPatient[field] !== services[field]) {
          changedFields.push(field);
          oldValues[field] = currentPatient[field];
          newValues[field] = services[field];
        }
      });

      if (changedFields.length === 0) {
        console.log('Nenhuma alteração detectada');
        return;
      }

      // 1. Atualizar os serviços da paciente
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          ...services,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) {
        console.error('Erro ao atualizar serviços:', updateError);
        throw updateError;
      }

      // 2. Registrar no histórico
      const { error: historyError } = await supabase
        .from('patient_history')
        .insert({
          patient_id: patientId,
          user_id: userId,
          action_type: 'update',
          changed_fields: changedFields,
          old_values: {
            ...oldValues,
            _user_name: userData.full_name,
            _user_type: userData.user_type
          },
          new_values: {
            ...newValues,
            _user_name: userData.full_name,
            _user_type: userData.user_type
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('Erro ao registrar histórico:', historyError);
        throw historyError;
      }

      console.log('Serviços editados e histórico registrado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Serviços atualizados com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao editar serviços:', error);
      toast.error('Erro ao atualizar serviços');
    },
  });
};