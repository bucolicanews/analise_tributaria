// n8n Code Node — Parser de Relatório JOTA
const combinedText = $input.first().json.content.parts
  .map(part => part.text)
  .join('\n\n');

// Regex para capturar seções numeradas (ex: # 1. Título)
const sections = combinedText.match(/#\s*#?\s*\d+\..*?(\n(?=#\s*#?\s*\d+\.)|$)/gs);

if (!sections || sections.length === 0) {
  return [{ json: { report: combinedText } }];
}

// Ordena numericamente para evitar que a IA embaralhe a lógica
sections.sort((a, b) => {
  const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
  const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
  return numA - numB;
});

return [{ json: { report: sections.join('\n\n') } }];