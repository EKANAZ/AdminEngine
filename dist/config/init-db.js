"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("./logger"));
const Company_1 = require("../models/Company");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
const Permission_1 = require("../models/Permission");
const bcrypt = __importStar(require("bcrypt"));
// Load environment variables
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
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
        logger_1.default.info('Database connection established successfully');
        // Create initial tables
        await AppDataSource.synchronize();
        logger_1.default.info('Database schema synchronized successfully');
        // Close the connection
        await AppDataSource.destroy();
        logger_1.default.info('Database connection closed');
        // Create default admin user and company
        const companyRepository = AppDataSource.getRepository(Company_1.Company);
        const userRepository = AppDataSource.getRepository(User_1.User);
        const roleRepository = AppDataSource.getRepository(Role_1.Role);
        const permissionRepository = AppDataSource.getRepository(Permission_1.Permission);
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
            logger_1.default.info('Admin company created');
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
            logger_1.default.info('Admin user created');
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
            logger_1.default.info('Admin role created');
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
            logger_1.default.info('Default permissions created');
        }
        logger_1.default.info('Database initialization completed successfully');
    }
    catch (error) {
        logger_1.default.error('Error initializing database:', error);
        process.exit(1);
    }
}
// Run the initialization
initializeDatabase();
