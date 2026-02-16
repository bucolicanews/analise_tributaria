// Validação de Entrada: Garante que o fluxo não quebre se a IA falhar.
if ($input.length === 0 || !$input.first().json.content || !$input.first().json.content.parts) {
  return [{
    json: {
      error: "Nenhum dado ou formato inválido recebido do nó da IA."
    }
  }];
}

// 1. Junta todos os fragmentos de texto da IA em uma única string.
const combinedText = $input.first().json.content.parts.map(part => part.text).join('\n\n');

// 2. Usa Regex para ENCONTRAR e EXTRAIR todas as seções numeradas, ignorando qualquer lixo.
//    Esta é a lógica mais robusta: ela não divide o texto, ela caça os padrões corretos.
//    A regex procura por "#" (um ou mais), um número, um ponto, e captura tudo
//    até o início da próxima seção ou o final do texto.
const sections = combinedText.match(/#\s*#?\s*\d+\..*?(\n(?=#\s*#?\s*\d+\.)|$)/gs);

// 3. Verifica se alguma seção válida foi encontrada.
if (!sections || sections.length === 0) {
  return [{
    json: {
      error: "Nenhuma seção numerada (# 1., # 2., etc.) foi encontrada na resposta da IA.",
      raw_response: combinedText
    }
  }];
}

// 4. Ordena as seções numericamente para corrigir a desordem da IA.
sections.sort((a, b) => {
  const numA = parseInt(a.match(/^#\s*#?\s*(\d+)/)?.[1] || '0', 10);
  const numB = parseInt(b.match(/^#\s*#?\s*(\d+)/)?.[1] || '0', 10);
  return numA - numB;
});

// 5. Junta as seções ordenadas em um único relatório limpo.
const finalReport = sections.join('\n\n');

// 6. Retorna o relatório final no formato que o n8n espera.
return [{
  json: {
    report: finalReport
  }
}];