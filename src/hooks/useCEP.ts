import { useState } from 'react';

interface CEPData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado
  erro?: boolean;
}

interface UseCEPReturn {
  loading: boolean;
  error: string | null;
  fetchCEP: (cep: string) => Promise<CEPData | null>;
}

export const useCEP = (): UseCEPReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCEP = async (cep: string): Promise<CEPData | null> => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data: CEPData = await response.json();
      
      if (data.erro) {
        setError('CEP não encontrado');
        return null;
      }

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento || '',
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      };
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError('Erro ao buscar CEP. Tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, fetchCEP };
};