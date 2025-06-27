import { IModule } from '../../core/interfaces/IModule';
import syncRouter from '../../routes/sync.routes';

export class SyncModule implements IModule {
  public router = syncRouter;
  initialize() {
    // Any sync-specific initialization logic (optional)
  }
} 