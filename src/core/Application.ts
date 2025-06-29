import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Config } from './config/Config';
import { Logger } from './logger/Logger';
import { ErrorHandlerMiddleware } from './middleware/ErrorHandlerMiddleware';

export class App {
  private app: Application;
  private httpServer: any;
  private io: SocketIOServer;
  private config: Config;
  private logger: Logger;
  private connectedClients: Map<string, Set<string>> = new Map();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });
    this.config = new Config();
    this.logger = new Logger(this.config);
    this.setupMiddleware();
    this.setupErrorHandling();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));

    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (this.config.isDevelopment()) {
      this.app.use(morgan('dev'));
    }

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        websocket: 'enabled',
        connectedClients: this.getConnectedClientsCount(),
        connectedTenants: this.getConnectedTenants()
      });
    });
  }

  private setupErrorHandling(): void {
    const errorHandler = new ErrorHandlerMiddleware();
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Pass error as last argument to match ErrorHandlerMiddleware signature
      errorHandler.handle(req, res, next, err);
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);

      // Handle client authentication and tenant association
      socket.on('authenticate', (data: { token: string; tenantId: string }) => {
        try {
          // Associate socket with tenant
          this.associateClientWithTenant(socket.id, data.tenantId);
          
          socket.emit('authenticated', { success: true });
          this.logger.info(`Client ${socket.id} authenticated for tenant ${data.tenantId}`);
        } catch (error) {
          socket.emit('authentication_error', { message: 'Invalid token' });
          this.logger.error(`Authentication failed for client ${socket.id}:`, error);
        }
      });

      // Handle sync status updates from client
      socket.on('sync_status_update', (data: { status: string; entityType?: string }) => {
        this.logger.info(`Sync status update from ${socket.id}:`, data);
        // Broadcast to other clients in the same tenant
        this.broadcastToTenant(socket.id, 'sync_status_update', data);
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        this.removeClient(socket.id);
        this.logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });

    this.logger.info('WebSocket sync notification service initialized');
  }

  private associateClientWithTenant(socketId: string, tenantId: string) {
    if (!this.connectedClients.has(tenantId)) {
      this.connectedClients.set(tenantId, new Set());
    }
    this.connectedClients.get(tenantId)!.add(socketId);
  }

  private removeClient(socketId: string) {
    for (const [tenantId, clients] of this.connectedClients.entries()) {
      if (clients.has(socketId)) {
        clients.delete(socketId);
        if (clients.size === 0) {
          this.connectedClients.delete(tenantId);
        }
        break;
      }
    }
  }

  private broadcastToTenant(excludeSocketId: string, event: string, data: any) {
    for (const [tenantId, clients] of this.connectedClients.entries()) {
      if (clients.has(excludeSocketId)) {
        // Found the tenant, broadcast to other clients in same tenant
        for (const clientId of clients) {
          if (clientId !== excludeSocketId) {
            const socket = this.io.sockets.sockets.get(clientId);
            if (socket) {
              socket.emit(event, data);
            }
          }
        }
        break;
      }
    }
  }

  public use(...args: any[]): void {
    // Pass all arguments to express' app.use
    // This allows both (middleware) and (path, middleware)
    // @ts-ignore
    this.app.use(...args);
  }

  public listen(): void {
    const port = this.config.port;
    this.httpServer.listen(port, () => {
      this.logger.info(`Server is running on port ${port}`);
      this.logger.info(`WebSocket sync notifications enabled`);
      
      // Print all registered routes for debugging
      // @ts-ignore
      (this.app._router.stack as any[])
        .filter((r: any) => r.route)
        .forEach((r: any) => {
          const methods = Object.keys(r.route.methods).join(',').toUpperCase();
          console.log(`${methods} ${r.route.path}`);
        });
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getHttpServer(): any {
    return this.httpServer;
  }

  public getConnectedClientsCount(): number {
    let total = 0;
    for (const clients of this.connectedClients.values()) {
      total += clients.size;
    }
    return total;
  }

  public getConnectedTenants(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  // Method to send notifications (for sync service to use)
  public sendNotificationToTenant(tenantId: string, notification: any) {
    const clients = this.connectedClients.get(tenantId);
    if (clients) {
      for (const clientId of clients) {
        const socket = this.io.sockets.sockets.get(clientId);
        if (socket) {
          socket.emit('sync_notification', notification);
        }
      }
    }
  }

  // Notify clients when new data is available for sync
  public notifyDataAvailable(tenantId: string, entityType: string, entityId?: string) {
    const notification = {
      type: 'data_available',
      entityType,
      entityId,
      message: `New ${entityType} data available for sync`,
      timestamp: new Date().toISOString()
    };

    this.sendNotificationToTenant(tenantId, notification);
    this.logger.info(`Data available notification sent to tenant ${tenantId} for ${entityType}`);
  }

  // Notify clients when sync is completed
  public notifySyncComplete(tenantId: string, entityType: string, entityId?: string, data?: any) {
    const notification = {
      type: 'sync_complete',
      entityType,
      entityId,
      message: `${entityType} sync completed successfully`,
      timestamp: new Date().toISOString(),
      data
    };

    this.sendNotificationToTenant(tenantId, notification);
    this.logger.info(`Sync complete notification sent to tenant ${tenantId} for ${entityType}`);
  }

  // Notify clients when sync error occurs
  public notifySyncError(tenantId: string, entityType: string, error: string, entityId?: string) {
    const notification = {
      type: 'sync_error',
      entityType,
      entityId,
      message: `Sync error for ${entityType}: ${error}`,
      timestamp: new Date().toISOString()
    };

    this.sendNotificationToTenant(tenantId, notification);
    this.logger.error(`Sync error notification sent to tenant ${tenantId} for ${entityType}: ${error}`);
  }
}