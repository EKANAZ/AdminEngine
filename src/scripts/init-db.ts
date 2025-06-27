import { AppDataSource } from '../config/database';
import logger from '../config/logger';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { Module } from '../models/Module'; 
import * as bcrypt from 'bcrypt';

async function initializeDatabase() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        logger.info('Database connection established');

        // Create tables
        await AppDataSource.synchronize();
        logger.info('Database tables created');

        // Create default admin company
        const companyRepository = AppDataSource.getRepository(Company);
        let adminCompany = await companyRepository.findOne({ where: { name: 'Admin Company' } });

        if (!adminCompany) {
            adminCompany = companyRepository.create({
                name: 'Admin Company',
                domain: 'admin-company',
                isActive: true,
                metadata: {
                    databaseName: 'admin_db',
                    databaseUser: 'admin_user',
                    databasePassword: 'admin_pass',
                    settings: {
                        theme: 'default',
                        language: 'en',
                        timezone: 'UTC'
                    }
                }
            });
            await companyRepository.save(adminCompany);
            logger.info('Admin company created');
        }

        // Create default admin user
        const userRepository = AppDataSource.getRepository(User);
        let adminUser = await userRepository.findOne({ where: { email: 'admin@admin.com' } });

        if (!adminUser) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            adminUser = userRepository.create({
                email: 'admin@admin.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                roles: [],
                company: adminCompany,
                isActive: true
            });
            await userRepository.save(adminUser);
            logger.info('Admin user created');
        }

        // Create default roles
        const roleRepository = AppDataSource.getRepository(Role);
        const roles = ['admin', 'manager', 'user'];
        
        for (const roleName of roles) {
            let role = await roleRepository.findOne({ where: { name: roleName } });
            if (!role) {
                role = roleRepository.create({
                    name: roleName,
                    description: `${roleName} role`,
                    permissions: []
                });
                await roleRepository.save(role);
                logger.info(`${roleName} role created`);
            }
        }

        // Create default permissions
        const permissionRepository = AppDataSource.getRepository(Permission);
        const permissions = [
            { name: 'create:user', description: 'Create user' },
            { name: 'read:user', description: 'Read user' },
            { name: 'update:user', description: 'Update user' },
            { name: 'delete:user', description: 'Delete user' },
            { name: 'manage:company', description: 'Manage company' },
            { name: 'manage:roles', description: 'Manage roles' }
        ];

        for (const perm of permissions) {
            let permission = await permissionRepository.findOne({ where: { resource: perm.name, action: 'manage' } });
            if (!permission) {
                permission = permissionRepository.create({
                    resource: perm.name,
                    action: 'manage',
                    isAllowed: true,
                    metadata: {},
                    conditions: {}
                });
                await permissionRepository.save(permission);
                logger.info(`${perm.name} permission created`);
            }
        }

        // Create default modules
        const moduleRepository = AppDataSource.getRepository(Module);
        const modules = [
            { name: 'crm', description: 'Customer Relationship Management' },
            { name: 'inventory', description: 'Inventory Management' },
            { name: 'billing', description: 'Billing and Invoicing' }
        ];

        for (const mod of modules) {
            let module = await moduleRepository.findOne({ where: { name: mod.name } });
            if (!module) {
                module = moduleRepository.create(mod);
                await moduleRepository.save(module);
                logger.info(`${mod.name} module created`);
            }
        }

        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Error initializing database:', error);
        throw error;
    } finally {
        await AppDataSource.destroy();
    }
}

// Run the initialization
initializeDatabase();