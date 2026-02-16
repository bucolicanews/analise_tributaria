// Validação de Entrada: Verifica se o nó anterior enviou dados.
// Se a IA falhar e não enviar nada, o fluxo não vai quebrar aqui.
if ($input.length === 0 || !$input.first().json.content || !$input.first().json.content.parts) {
  // Retorna um item de erro claro, em vez de quebrar o fluxo.
  return [{
    json: {
      error: "Nenhum dado ou formato inválido recebido do nó da IA."
    }
  }];
}

// 1. Acessa o array 'parts' da saída da IA.
const parts = $input.first().json.content.parts;

// 2. Junta todos os pedaços de texto em uma única string.
const combinedText = parts.map(part => part.text).join('\n\n');

// 3. Divide o texto em seções e filtra para manter APENAS as que começam com um número.
//    Esta é a mudança CRÍTICA: ela ignora qualquer texto, prompt ou lixo
//    que a IA envie antes da seção "# 1.".
const sections = combinedText.split(/\n# /)
  .filter(section => section.trim() && /^\d/.test(section.trim()));

// Se, após a filtragem, nenhuma seção válida for encontrada, retorna um erro.
if (sections.length === 0) {
  return [{
    json: {
      error: "Nenhuma seção numerada (# 1., # 2., etc.) foi encontrada na resposta da IA.",
      raw_response: combinedText
    }
  }];
}

// 4. Ordena as seções numericamente com base no número do título.
sections.sort((a, b) => {
  const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
  const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
  return numA - numB;
});

// 5. Junta as seções ordenadas de volta, adicionando o "# " que foi removido.
const finalReport = sections.map(section => `# ${section}`).join('\n\n');

// 6. Retorna o relatório final no formato que o n8n espera.
return [{
  json: {
    report: finalReport
  }
}];