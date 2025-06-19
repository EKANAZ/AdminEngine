import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import logger from './logger';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts'],
});

async function initializeDatabase() {
    try {
        await AppDataSource.initialize();
        logger.info('Database connection established successfully');
        
        // Create initial tables
        await AppDataSource.synchronize();
        logger.info('Database schema synchronized successfully');
        
        // Close the connection
        await AppDataSource.destroy();
        logger.info('Database connection closed');

        // Create default admin user and company
        const companyRepository = AppDataSource.getRepository(Company);
        const userRepository = AppDataSource.getRepository(User);
        const roleRepository = AppDataSource.getRepository(Role);
        const permissionRepository = AppDataSource.getRepository(Permission);

        // Check if admin company exists
        let adminCompany = await companyRepository.findOne({
          where: { name: 'System Admin' }
        });

        if (!adminCompany) {
          // Create admin company
          adminCompany = companyRepository.create({
            name: 'Admin Company',
            domain: 'admin.local',
            isActive: true,
            metadata: {
              settings: {
                theme: 'light',
                language: 'en',
                timezone: 'UTC'
              }
            }
          });
          await companyRepository.save(adminCompany);
          logger.info('Admin company created');
        }

        // Check if admin user exists
        let adminUser = await userRepository.findOne({
          where: { email: 'admin@system.com' }
        });

        if (!adminUser) {
          // Create admin user
          const hashedPassword = await bcrypt.hash('Admin@123', 10);
          adminUser = userRepository.create({
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@system.com',
            password: hashedPassword,
            isActive: true,
            company: adminCompany
          });
          await userRepository.save(adminUser);
          logger.info('Admin user created');
        }

        // Create admin role if it doesn't exist
        let adminRole = await roleRepository.findOne({
          where: { name: 'System Admin' }
        });

        if (!adminRole) {
          adminRole = roleRepository.create({
            name: 'System Admin',
            description: 'System administrator with full access',
            isSystem: true,
            user: adminUser
          });
          await roleRepository.save(adminRole);
          logger.info('Admin role created');

          // Create default permissions
          const defaultPermissions = [
            { resource: '*', action: '*', isAllowed: true },
            { resource: 'user', action: 'create', isAllowed: true },
            { resource: 'user', action: 'read', isAllowed: true },
            { resource: 'user', action: 'update', isAllowed: true },
            { resource: 'user', action: 'delete', isAllowed: true },
            { resource: 'company', action: 'create', isAllowed: true },
            { resource: 'company', action: 'read', isAllowed: true },
            { resource: 'company', action: 'update', isAllowed: true },
            { resource: 'company', action: 'delete', isAllowed: true },
            { resource: 'role', action: 'create', isAllowed: true },
            { resource: 'role', action: 'read', isAllowed: true },
            { resource: 'role', action: 'update', isAllowed: true },
            { resource: 'role', action: 'delete', isAllowed: true }
          ];

          for (const perm of defaultPermissions) {
            const permission = permissionRepository.create({
              ...perm,
              role: adminRole
            });
            await permissionRepository.save(permission);
          }
          logger.info('Default permissions created');
        }

        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase(); 