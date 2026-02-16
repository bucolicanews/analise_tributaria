// 1. Acessa o array 'parts' da saída da IA.
const parts = $input.first().json.content.parts;

// 2. Junta todos os pedaços de texto em uma única string.
//    Isso resolve o problema da FRAGMENTAÇÃO.
const combinedText = parts.map(part => part.text).join('\n\n');

// 3. Divide o texto em seções, usando o padrão "# " como separador.
//    O .filter(Boolean) remove quaisquer itens vazios que possam surgir.
const sections = combinedText.split(/\n# /).filter(Boolean);

// 4. Ordena as seções numericamente com base no número do título.
//    Isso resolve o problema da ORDEM INCORRETA.
sections.sort((a, b) => {
  const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
  const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
  return numA - numB;
});

// 5. Junta as seções ordenadas de volta, adicionando o "# " que foi removido.
const finalReport = sections.map(section => `# ${section}`).join('\n\n');

// 6. Retorna o relatório final no formato que o n8n espera.
// O n8n precisa de um array de objetos, onde cada objeto tem uma propriedade 'json'.
return [{
  json: {
    report: finalReport
  }
}];