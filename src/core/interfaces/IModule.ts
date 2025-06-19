import { Router } from 'express';

export interface IModule {
  router: Router;
  initialize(): void;
} 