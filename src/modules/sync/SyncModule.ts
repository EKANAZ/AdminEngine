import { IModule } from '../../core/interfaces/IModule';
import { createSyncRoutes } from '../../routes/sync.routes';
import { App } from '../../core/Application';

export class SyncModule implements IModule {
  public router: any;
  private app?: App;

  initialize() {
    // Create sync routes with app instance for WebSocket notifications
    this.router = createSyncRoutes(undefined, this.app);
  }

  setApp(app: App) {
    this.app = app;
    // Re-initialize router with app instance
    this.router = createSyncRoutes(undefined, this.app);
  }

  // Method to send notifications
  sendNotificationToTenant(tenantId: string, notification: any) {
    if (this.app) {
      this.app.sendNotificationToTenant(tenantId, notification);
    }
  }
} 