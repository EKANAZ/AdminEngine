"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bootstrap_1 = require("./core/Bootstrap");
const AuthModule_1 = require("./modules/auth/AuthModule");
const UserModule_1 = require("./modules/user/UserModule");
const CompanyModule_1 = require("./modules/company/CompanyModule");
const RoleModule_1 = require("./modules/role/RoleModule");
const PermissionModule_1 = require("./modules/permission/PermissionModule");
async function bootstrap() {
    const modules = [
        new AuthModule_1.AuthModule(),
        new UserModule_1.UserModule(),
        new CompanyModule_1.CompanyModule(),
        new RoleModule_1.RoleModule(),
        new PermissionModule_1.PermissionModule()
    ];
    const app = new Bootstrap_1.Bootstrap(modules);
    await app.initialize();
}
bootstrap().catch(console.error);
