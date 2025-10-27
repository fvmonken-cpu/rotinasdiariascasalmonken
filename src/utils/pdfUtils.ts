import { jsPDF } from 'jspdf';

// Função para carregar imagem da logomarca
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Função para adicionar cabeçalho com logomarca
export const addPDFHeader = async (doc: jsPDF, title: string) => {
  try {
    // Carregar a logomarca
    const logoImg = await loadImage('https://cdn-pinspec-public.pinspec.ai/assets/Z8gZalhVAKjQV45OvNsVM.png');
    
    // Adicionar logo (redimensionada para caber no cabeçalho)
    const logoWidth = 100;
    const logoHeight = 40;
    const logoX = 40;
    const logoY = 20;
    
    doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Adicionar título ao lado da logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, logoX + logoWidth + 20, logoY + 25);
    
    return logoY + logoHeight + 20; // Retorna a posição Y onde o conteúdo deve começar
    
  } catch (error) {
    console.warn('Erro ao carregar logomarca, continuando sem ela:', error);
    
    // Fallback sem logomarca
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 40, 40);
    
    return 60; // Retorna a posição Y onde o conteúdo deve começar
  }
};

// Função para adicionar rodapé com copyright e usuário
export const addPDFFooter = (doc: jsPDF, userName?: string) => {
  const pageCount = doc.internal.pages.length - 1;
  const pageHeight = doc.internal.pageSize.height;
  const footerText = 'Copyright Espaço Casal Monken. Dados sigilosos. O usuário responsável pela geração deste documento é também responsável pelo correto uso do mesmo.';
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Configurar fonte do rodapé
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    // Calcular largura da página para centralizar o texto
    const pageWidth = doc.internal.pageSize.width;
    const textWidth = doc.getTextWidth(footerText);
    const x = (pageWidth - textWidth) / 2;
    
    // Adicionar texto do rodapé
    doc.text(footerText, x, pageHeight - 30);
    
    // Adicionar nome do usuário se fornecido
    if (userName) {
      const userText = `Documento gerado por: ${userName}`;
      const userTextWidth = doc.getTextWidth(userText);
      const userX = (pageWidth - userTextWidth) / 2;
      doc.text(userText, userX, pageHeight - 20);
    }
    
    // Adicionar numeração das páginas
    doc.setFontSize(10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 80, pageHeight - 10);
    
    // Resetar cor do texto para preto
    doc.setTextColor(0, 0, 0);
  }
};

// Função para adicionar informações de geração
export const addGenerationInfo = (doc: jsPDF, startY: number, activeFilters?: string[]) => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const now = new Date();
  const brazilTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  
  let currentY = startY;
  
  // Primeira linha: Data e hora de geração
  doc.text(`Data e hora de geração: ${brazilTime}`, 40, currentY);
  currentY += 15;
  
  // Segunda linha: Filtros aplicados
  if (activeFilters && activeFilters.length > 0) {
    doc.text(`Filtros aplicados: ${activeFilters.join(' | ')}`, 40, currentY);
    currentY += 15;
  } else {
    doc.text('Filtros aplicados: Nenhum (todos os registros)', 40, currentY);
    currentY += 15;
  }
  
  // Terceira linha em diante: dados da tabela começam aqui
  return currentY + 10; // Retorna a próxima posição Y disponível
};