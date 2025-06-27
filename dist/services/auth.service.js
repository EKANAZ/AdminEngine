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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.AuthError = void 0;
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const Role_1 = require("../models/Role");
const Permission_1 = require("../models/Permission");
const DatabaseConfig_1 = require("../core/config/DatabaseConfig");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
class AuthError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
class AuthService {
    get userRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(User_1.User); }
    get companyRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(Company_1.Company); }
    get roleRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(Role_1.Role); }
    get permissionRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(Permission_1.Permission); }
    async register(userData) {
        // 1. Create a new company for the user
        const company = this.companyRepository.create({ name: userData.companyName });
        await this.companyRepository.save(company);
        // 2. Hash the user's password for security
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        // 3. Create the user and associate with the company
        const user = this.userRepository.create({
            ...userData,
            password: hashedPassword,
            company
        });
        await this.userRepository.save(user);
        // 4. Create a default admin role for the user
        const adminRole = this.roleRepository.create({
            name: 'Admin',
            description: 'System administrator role',
            isSystem: true,
            user
        });
        await this.roleRepository.save(adminRole);
        // 5. Assign all permissions to the admin role
        const defaultPermissions = [
            { resource: '*', action: '*', isAllowed: true }
        ];
        for (const perm of defaultPermissions) {
            const permission = this.permissionRepository.create({
                ...perm,
                role: adminRole
            });
            await this.permissionRepository.save(permission);
        }
        // 6. Generate a JWT token for the new user
        const token = this.generateToken(user);
        // 7. Return the user and token
        return { user, token };
    }
    async login(email, password) {
        // 1. Find the user by email
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ['company', 'roles', 'roles.permissions']
        });
        if (!user) {
            throw new Error('User not found');
        }
        // 2. Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        if (!user.isActive) {
            throw new Error('User account is inactive');
        }
        // 3. Update the user's last login timestamp
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);
        // 4. Generate a JWT token for the user
        const token = this.generateToken(user);
        return { user, token };
    }
    async resetPassword(email) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        const resetToken = (0, uuid_1.v4)();
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await this.userRepository.save(user);
        // TODO: Send password reset email
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('Current password is invalid');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await this.userRepository.save(user);
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.company.id,
            roles: user.roles.map(role => role.name)
        };
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });
    }
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await this.userRepository.findOne({
                where: { id: decoded.sub },
                relations: ['company', 'roles', 'roles.permissions']
            });
            if (!user || !user.isActive) {
                throw new Error('Invalid token');
            }
            return user;
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async assignRole(userId, roleId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });
        if (!user) {
            throw new AuthError('User not found', 404);
        }
        const role = await this.roleRepository.findOne({
            where: { id: roleId }
        });
        if (!role) {
            throw new AuthError('Role not found', 404);
        }
        user.roles = [...user.roles, role];
        return this.userRepository.save(user);
    }
    async createRole(roleData) {
        const existingRole = await this.roleRepository.findOne({
            where: { name: roleData.name }
        });
        if (existingRole) {
            throw new AuthError('Role already exists', 400);
        }
        const role = this.roleRepository.create({ name: roleData.name, description: roleData.description });
        return this.roleRepository.save(role);
    }
}
exports.AuthService = AuthService;
