import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.RELAY_PORT || 3001;

// Resultados em memória: { [sessionId]: { agents: [], createdAt: Date } }
const sessions = new Map();

// Limpa sessões com mais de 2 horas automaticamente
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, session] of sessions.entries()) {
    if (session.createdAt < twoHoursAgo) {
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, sessions: sessions.size });
});

// n8n posta aqui quando um agente termina
// Body esperado: { sessionId, nome, report }
app.post('/agent-result', (req, res) => {
  const { sessionId, nome, report } = req.body;

  if (!sessionId || !nome || !report) {
    return res.status(400).json({ error: 'sessionId, nome e report são obrigatórios.' });
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { agents: [], createdAt: Date.now() });
  }

  const session = sessions.get(sessionId);

  // Evita duplicatas pelo nome
  const exists = session.agents.find(a => a.nome === nome);
  if (!exists) {
    session.agents.push({ nome, report, receivedAt: new Date().toISOString() });
  }

  console.log(`[relay] session=${sessionId} agente="${nome}" total=${session.agents.length}`);
  res.json({ ok: true, total: session.agents.length });
});

// Frontend consulta aqui a cada 2s
// Retorna os agentes já recebidos para aquela sessão
app.get('/agent-results/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.json({ agents: [] });
  }

  res.json({ agents: session.agents });
});

// Frontend chama ao fechar/limpar
app.delete('/agent-results/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[relay] servidor rodando na porta ${PORT}`);
});
