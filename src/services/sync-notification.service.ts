import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../config/logger';

export interface SyncNotification {
  type: 'data_available' | 'sync_complete' | 'sync_error' | 'conflict_detected';
  entityType: string;
  entityId?: string;
  message: string;
  timestamp: string;
  data?: any;
}

export class SyncNotificationService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Set<string>> = new Map(); // tenantId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Configure based on your needs
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle client authentication and tenant association
      socket.on('authenticate', (data: { token: string; tenantId: string }) => {
        try {
          // Verify JWT token here
          // const decoded = jwt.verify(data.token, process.env.JWT_SECRET!);
          
          // Associate socket with tenant
          this.associateClientWithTenant(socket.id, data.tenantId);
          
          socket.emit('authenticated', { success: true });
          logger.info(`Client ${socket.id} authenticated for tenant ${data.tenantId}`);
        } catch (error) {
          socket.emit('authentication_error', { message: 'Invalid token' });
          logger.error(`Authentication failed for client ${socket.id}:`, error);
        }
      });

      // Handle sync status updates from client
      socket.on('sync_status_update', (data: { status: string; entityType?: string }) => {
        logger.info(`Sync status update from ${socket.id}:`, data);
        // Broadcast to other clients in the same tenant
        this.broadcastToTenant(socket.id, 'sync_status_update', data);
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        this.removeClient(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
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

  // Notify clients when new data is available for sync
  public notifyDataAvailable(tenantId: string, entityType: string, entityId?: string) {
    const notification: SyncNotification = {
      type: 'data_available',
      entityType,
      entityId,
      message: `New ${entityType} data available for sync`,
      timestamp: new Date().toISOString()
    };

    this.sendNotificationToTenant(tenantId, notification);
    logger.info(`Data available notification sent to tenant ${tenantId} for ${entityType}`);
  }

  // Notify clients when sync is completed
  public notifySyncComplete(tenantId: string, entityType: string, entityId?: string, data?: any) {
    const notification: SyncNotification = {
      type: 'sync_complete',
      entityType,
      entityId,
      message: `${entityType} sync completed successfully`,
      timestamp: new Date().toISOString(),
      data
    };

    this.sendNotificationToTenant(tenantId, notification);
    logger.info(`Sync complete notification sent to tenant ${tenantId} for ${entityType}`);
  }

  // Notify clients when sync error occurs
  public notifySyncError(tenantId: string, entityType: string, error: string, entityId?: string) {
    const notification: SyncNotification = {
      type: 'sync_error',
      entityType,
      entityId,
      message: `Sync error for ${entityType}: ${error}`,
      timestamp: new Date().toISOString()
    };

    this.sendNotificationToTenant(tenantId, notification);
    logger.error(`Sync error notification sent to tenant ${tenantId} for ${entityType}: ${error}`);
  }

  // Notify clients when conflict is detected
  public notifyConflictDetected(tenantId: string, entityType: string, entityId: string, conflictData: any) {
    const notification: SyncNotification = {
      type: 'conflict_detected',
      entityType,
      entityId,
      message: `Conflict detected for ${entityType}`,
      timestamp: new Date().toISOString(),
      data: conflictData
    };

    this.sendNotificationToTenant(tenantId, notification);
    logger.warn(`Conflict notification sent to tenant ${tenantId} for ${entityType} ${entityId}`);
  }

  private sendNotificationToTenant(tenantId: string, notification: SyncNotification) {
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

  // Get connected clients count for monitoring
  public getConnectedClientsCount(): number {
    let total = 0;
    for (const clients of this.connectedClients.values()) {
      total += clients.size;
    }
    return total;
  }

  // Get tenants with connected clients
  public getConnectedTenants(): string[] {
    return Array.from(this.connectedClients.keys());
  }
} 