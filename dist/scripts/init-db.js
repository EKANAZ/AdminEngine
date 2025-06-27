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
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../config/logger"));
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const Role_1 = require("../models/Role");
const Permission_1 = require("../models/Permission");
const Module_1 = require("../models/Module");
const bcrypt = __importStar(require("bcrypt"));
async function initializeDatabase() {
    try {
        // Initialize database connection
        await database_1.AppDataSource.initialize();
        logger_1.default.info('Database connection established');
        // Create tables
        await database_1.AppDataSource.synchronize();
        logger_1.default.info('Database tables created');
        // Create default admin company
        const companyRepository = database_1.AppDataSource.getRepository(Company_1.Company);
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
            logger_1.default.info('Admin company created');
        }
        // Create default admin user
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
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
            logger_1.default.info('Admin user created');
        }
        // Create default roles
        const roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
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
                logger_1.default.info(`${roleName} role created`);
            }
        }
        // Create default permissions
        const permissionRepository = database_1.AppDataSource.getRepository(Permission_1.Permission);
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
                logger_1.default.info(`${perm.name} permission created`);
            }
        }
        // Create default modules
        const moduleRepository = database_1.AppDataSource.getRepository(Module_1.Module);
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
                logger_1.default.info(`${mod.name} module created`);
            }
        }
        logger_1.default.info('Database initialization completed successfully');
    }
    catch (error) {
        logger_1.default.error('Error initializing database:', error);
        throw error;
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
}
// Run the initialization
initializeDatabase();
