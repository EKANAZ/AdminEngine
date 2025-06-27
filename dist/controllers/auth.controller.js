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
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const DatabaseConfig_1 = require("../core/config/DatabaseConfig");
const logger_1 = __importDefault(require("../config/logger"));
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const database_1 = require("../config/database");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
class AuthController {
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    async register(req, res) {
        const { companyName, companyDomain, email, password, firstName, lastName } = req.body;
        try {
            // Start transaction
            const queryRunner = DatabaseConfig_1.DatabaseConfig.getDataSource().createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                // Create company
                const company = new Company_1.Company();
                company.name = companyName;
                company.domain = companyDomain;
                await queryRunner.manager.save(company);
                // Create tenant database
                await (0, database_1.createTenantDatabase)(company.id);
                // Create admin user
                const hashedPassword = await bcrypt.hash(password, 10);
                const user = new User_1.User();
                user.email = email;
                user.password = hashedPassword;
                user.firstName = firstName;
                user.lastName = lastName;
                user.company = company;
                const adminRole = await this.authService.createRole({ name: 'admin', permissions: [] });
                if (adminRole) {
                    user.roles = [adminRole];
                }
                await queryRunner.manager.save(user);
                await queryRunner.commitTransaction();
                // Generate JWT token
                const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
                res.status(201).json({
                    success: true,
                    data: {
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            roles: user.roles
                        },
                        company: {
                            id: company.id,
                            name: company.name
                        }
                    }
                });
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Error during registration'
            });
        }
    }
    async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(User_1.User)
                .findOne({ where: { email }, relations: ['company'] });
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
                return;
            }
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
                return;
            }
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roles: user.roles
                    },
                    company: {
                        id: user.company.id,
                        name: user.company.name
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Error during login'
            });
        }
    }
    async createRole(req, res) {
        try {
            const { name, permissions } = req.body;
            const role = await this.authService.createRole({ name, permissions });
            res.status(201).json(role);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async assignRole(req, res) {
        try {
            const { userId, roleId } = req.body;
            await this.authService.assignRole(userId, roleId);
            res.json({ message: 'Role assigned successfully' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.AuthController = AuthController;
