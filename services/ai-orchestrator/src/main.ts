import express from 'express';
import { recommendationAgent } from '@qalago/agents';
import { recommend } from './recommendation.service';

const port = Number(process.env.PORT ?? 3004);

const app = express();
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-orchestrator' });
});

app.get('/api/v1/agents', (_req, res) => {
  res.json({ items: [recommendationAgent] });
});

app.post('/api/v1/recommendations', async (req, res) => {
  try {
    const citySlug = String(req.body?.citySlug ?? 'uralsk');
    const limit = req.body?.limit ? Number(req.body.limit) : undefined;
    const auth = req.header('authorization') ?? undefined;
    const result = await recommend({ citySlug, authorization: auth, limit });
    res.json(result);
  } catch (err) {
    res.status(502).json({ message: String(err) });
  }
});

app.listen(port, () => {
  console.log(`QalaGo ai-orchestrator: http://localhost:${port}/api/v1/health`);
});
