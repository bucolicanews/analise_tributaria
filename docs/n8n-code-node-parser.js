// n8n Code Node — Parser Robusto de Relatório IA
// Substitua o conteúdo do seu nó "Code" por este script
//
// Compatível com os formatos de título:
//   # 1. Título
//   ## 1. Título
//   **1. Título**
//   1. Título
//    1. Título (com espaço inicial)

const combinedText = $input.first().json.content.parts
  .map(part => part.text)
  .join('\n\n');

// Divide sempre que encontrar início de seção numerada
const rawSections = combinedText.split(/\n(?=\s*(?:#+ |\*\*)?(\d+)\.\s)/g);

// Filtra apenas blocos que começam com número de seção
const sections = rawSections.filter(s => /^\s*(?:#+ |\*\*)?(\d+)\.\s/.test(s));

// Ordena numericamente — garante ordem mesmo se a IA embaralhar seções
sections.sort((a, b) => {
  const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
  const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
  return numA - numB;
});

const finalReport = sections.join('\n\n');

return [{
  json: {
    report: finalReport
  }
}];
