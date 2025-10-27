/**
 * Funções utilitárias para formatação de texto
 */

/**
 * Formata nome próprio para Title Case (Primeira letra de cada palavra maiúscula)
 * Considera preposições e artigos em minúsculas
 */
export const formatName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  // Remove espaços extras e converte para lowercase
  const cleanName = name.trim().toLowerCase();
  
  // Lista de preposições e artigos que devem ficar em minúsculas
  const lowercaseWords = [
    'da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos',
    'a', 'o', 'as', 'os', 'para', 'por', 'com', 'sem', 'sob', 'sobre',
    'ante', 'após', 'até', 'desde', 'entre', 'perante', 'através', 'y'
  ];
  
  // Divide o nome em palavras
  const words = cleanName.split(/\s+/);
  
  // Formata cada palavra
  const formattedWords = words.map((word, index) => {
    if (!word) return '';
    
    // Primeira palavra sempre com maiúscula
    if (index === 0) {
      return capitalizeFirst(word);
    }
    
    // Última palavra sempre com maiúscula (sobrenomes principais)
    if (index === words.length - 1) {
      return capitalizeFirst(word);
    }
    
    // Verifica se é uma preposição/artigo
    if (lowercaseWords.includes(word)) {
      return word.toLowerCase();
    }
    
    // Outras palavras com primeira letra maiúscula
    return capitalizeFirst(word);
  });
  
  return formattedWords.join(' ');
};

/**
 * Capitaliza apenas a primeira letra de uma string
 */
const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formata nome do bebê (similar ao nome da mãe, mas permite estar vazio)
 */
export const formatBabyName = (name: string): string => {
  if (!name || typeof name !== 'string' || name.trim() === '') return '';
  return formatName(name);
};

/**
 * Formata nome do companheiro/parceiro
 */
export const formatPartnerName = (name: string): string => {
  if (!name || typeof name !== 'string' || name.trim() === '') return '';
  return formatName(name);
};

/**
 * Valida se um nome está em formato adequado
 */
export const validateNameFormat = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  // Verifica se tem pelo menos 2 palavras (nome e sobrenome)
  const words = name.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length >= 2;
};