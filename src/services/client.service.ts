import { DataSource, MoreThan } from 'typeorm';
import { ClientUser } from '../models/ClientUser';
import { Company } from '../models/Company';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import logger from '../config/logger';
import { DatabaseConfig } from '../core/config/DatabaseConfig';

import { Interaction } from '../models/Interaction';

// Map sync keys to entity classes (shared for pull/push)
const entityMap: Record<string, any> = {
    end_user: ClientUser, // sync key for client user entity
    interaction: Interaction, // adjust key as per client payload
    interactions: Interaction, // allow plural for flexibility
};

export class ClientService {
    // Client login
    async login(email: string, password: string, companyDomain: string) {
        try {
            // Find company by domain
            const company = await DatabaseConfig.getDataSource().getRepository(Company).findOne({ where: { domain: companyDomain } });
            if (!company) {
                throw new Error('Company not found');
            }

            // Get tenant database connection
            const tenantDataSource = new DataSource({
                type: 'postgres',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: `tenant_${company.id}`,
                entities: [ClientUser],
            });

            await tenantDataSource.initialize();

            // Find user in tenant database
            const user = await tenantDataSource
                .getRepository(ClientUser)
                .findOne({ where: { email } });

            if (!user || !user.password || !(await compare(password, user.password))) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT token
            const token = sign(
                { 
                    userId: user.id, 
                    companyId: company.id,
                    email: user.email 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            await tenantDataSource.destroy();

            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
            };
        } catch (error) {
            logger.error('Client login error:', error);
            throw error;
        }
    }

    // Pull data from server to client
    async pullData(
        dataSource: DataSource,
        userId: string,
        lastSyncTimestamp: string,
        entityTypes: string[]
    ) {
        try {
            const result: any = {};

            for (const entityType of entityTypes) {
                const entityClass = entityMap[entityType];
                if (!entityClass) continue;
                const repository = dataSource.getRepository(entityClass);
                const data = await repository.find({
                    where: {
                        updatedAt: MoreThan(new Date(lastSyncTimestamp))
                    }
                });
                result[entityType] = data;
            }

            return result;
        } catch (error) {
            logger.error('Pull data error:', error);
            throw error;
        }
    }

    // Push data from client to server
    async pushData(
        dataSource: DataSource,
        userId: string,
        changes: { [key: string]: any[] }
    ) {
        try {
            const result: any = {};
            // Use shared entityMap
            for (const [entityType, entities] of Object.entries(changes)) {
                const entityClass = entityMap[entityType];
                console.log('entityType:', entityType, 'entityClass:', entityClass); // Debug log
                if (!entityClass) continue;
                const repository = dataSource.getRepository(entityClass);
                for (const entity of entities) {
                    console.log('Saving entity:', entity); // Debug log
                    if (entity.id) {
                        // Check if entity exists
                        const existing = await repository.findOne({ where: { id: entity.id } });
                        if (existing) {
                            // Update existing entity
                            await repository.update(entity.id, entity);
                        } else {
                            // Insert new entity with provided id
                            await repository.save(entity);
                        }
                    } else {
                        // Create new entity
                        await repository.save(entity);
                    }
                }
                result[entityType] = await repository.find();
            }

            return result;
        } catch (error) {
            logger.error('Push data error:', error);
            throw error;
        }
    }

    // Get sync status
    async getSyncStatus(dataSource: DataSource, userId: string) {
        try {
            const syncStatus = await dataSource
                .getRepository('SyncStatus')
                .findOne({ where: { userId } });

            return {
                lastSyncTimestamp: syncStatus?.lastSyncTimestamp || null,
                pendingChanges: syncStatus?.pendingChanges || 0
            };
        } catch (error) {
            logger.error('Get sync status error:', error);
            throw error;
        }
    }

    get companyRepository() { return DatabaseConfig.getDataSource().getRepository(Company); }
} 