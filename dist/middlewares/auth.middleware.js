"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Invalid token format' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
            relations: ['roles']
        });
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            roles: user.roles.map(role => role.name)
        };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            const hasPermission = req.user.roles.some(role => {
                const resourcePermissions = role.permissions?.[resource];
                return resourcePermissions && resourcePermissions[action];
            });
            if (!hasPermission) {
                res.status(403).json({ message: 'Insufficient permissions' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};
exports.checkPermission = checkPermission;
