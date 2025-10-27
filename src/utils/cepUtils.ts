export const formatCEP = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Aplica a máscara XXXXX-XXX
  if (digits.length <= 5) {
    return digits;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  }
};

export const unformatCEP = (formattedCEP: string): string => {
  return formattedCEP.replace(/\D/g, '');
};

export const isValidCEP = (cep: string): boolean => {
  const digits = unformatCEP(cep);
  return digits.length === 8;
};