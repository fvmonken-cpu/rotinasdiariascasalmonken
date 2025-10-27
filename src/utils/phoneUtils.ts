export const formatPhone = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Aplica a máscara (XX) XXXXX-XXXX
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
};

export const unformatPhone = (formattedPhone: string): string => {
  return formattedPhone.replace(/\D/g, '');
};

export const isValidPhone = (phone: string): boolean => {
  const digits = unformatPhone(phone);
  return digits.length === 11; // (XX) XXXXX-XXXX = 11 dígitos
};