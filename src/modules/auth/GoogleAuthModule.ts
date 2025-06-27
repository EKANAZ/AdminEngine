import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';

export class GoogleAuthModule implements IModule {
  public router: Router;
  constructor() {
    this.router = Router();
  }
  initialize(): void {
    this.router.get('/auth/google', (req, res) => {
      // Placeholder: Redirect to Google OAuth
      res.json({ message: 'Redirect to Google OAuth' });
    });
    this.router.get('/auth/google/callback', (req, res) => {
      // Placeholder: Handle Google OAuth callback
      res.json({ message: 'Google OAuth callback' });
    });
    // Dummy route to ensure router is always valid
    this.router.get('/__dummy', (req, res) => res.json({ ok: true }));
  }
} 