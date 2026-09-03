import express from 'express';
import { agents } from '@qalago/agents';
import { recommend } from './recommendation.service';
import { analyzeModeration } from './moderation.service';

const port = Number(process.env.PORT ?? 3004);

const app = express();
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-orchestrator' });
});

app.get('/api/v1/agents', (_req, res) => {
  res.json({ items: agents });
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

app.post('/api/v1/moderation/analyze', (req, res) => {
  const text = String(req.body?.text ?? '');
  if (!text.trim()) {
    res.status(400).json({ message: 'text is required' });
    return;
  }

  const rating =
    req.body?.rating != null && req.body.rating !== ''
      ? Number(req.body.rating)
      : undefined;
  if (rating != null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    res.status(400).json({ message: 'rating must be between 1 and 5' });
    return;
  }

  const reviewId =
    req.body?.reviewId != null ? String(req.body.reviewId) : undefined;

  res.json(
    analyzeModeration({
      text,
      rating,
      reviewId,
    }),
  );
});

app.listen(port, () => {
  console.log(`QalaGo ai-orchestrator: http://localhost:${port}/api/v1/health`);
});
