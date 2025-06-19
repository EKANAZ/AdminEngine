"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCompany = exports.authorize = exports.authenticate = void 0;
const auth_service_1 = require("../services/auth.service");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const authService = new auth_service_1.AuthService();
        const user = await authService.validateToken(token);
        req.user = user;
        req.company = user.company;
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const authorize = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const userPermissions = req.user.roles.flatMap((role) => role.permissions.map((permission) => `${permission.resource}:${permission.action}`));
            const hasPermission = requiredPermissions.every(permission => {
                // Check for wildcard permissions
                if (userPermissions.includes('*:*'))
                    return true;
                const [resource, action] = permission.split(':');
                return userPermissions.includes(`${resource}:${action}`);
            });
            if (!hasPermission) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};
exports.authorize = authorize;
const requireCompany = async (req, res, next) => {
    try {
        if (!req.company) {
            return res.status(401).json({ message: 'Company context required' });
        }
        if (req.company.status !== 'active') {
            return res.status(403).json({ message: 'Company account is inactive' });
        }
        return next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking company status' });
    }
};
exports.requireCompany = requireCompany;
