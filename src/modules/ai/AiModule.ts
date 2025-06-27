import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';

export class AiModule implements IModule {
  public router: Router;
  constructor() {
    this.router = Router();
  }
  initialize(): void {
    this.router.post('/ai/ask', async (req, res) => {
      // Placeholder: Integrate with OpenAI or similar here
      const { prompt } = req.body;
      res.json({ response: `AI says: ${prompt}` });
    });
    // Dummy route to ensure router is always valid
    this.router.get('/__dummy', (req, res) => res.json({ ok: true }));
  }
} 