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
exports.ModuleService = void 0;
const Module_1 = require("../models/Module");
const CompanyModule_1 = require("../models/CompanyModule");
const database_1 = require("../config/database");
const DatabaseConfig_1 = require("../core/config/DatabaseConfig");
class ModuleService {
    get moduleRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(Module_1.Module); }
    get companyModuleRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(CompanyModule_1.CompanyModule); }
    async installModule(companyId, moduleId) {
        const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
        if (!module) {
            throw new Error('Module not found');
        }
        // Check if module is already installed
        const existingModule = await this.companyModuleRepository.findOne({
            where: {
                company: { id: companyId },
                module: { id: moduleId }
            }
        });
        if (existingModule) {
            throw new Error('Module already installed');
        }
        // Create company module record
        const companyModule = this.companyModuleRepository.create({
            company: { id: companyId },
            module: { id: moduleId },
            settings: {
                features: module.config.features.reduce((acc, feature) => ({
                    ...acc,
                    [feature]: true
                }), {}),
                customizations: {},
                limits: {}
            }
        });
        await this.companyModuleRepository.save(companyModule);
        // Initialize module in tenant database
        await this.initializeModuleInTenant(companyId, module);
        return companyModule;
    }
    async initializeModuleInTenant(companyId, module) {
        const tenantDataSource = (0, database_1.getTenantDataSource)(companyId);
        await tenantDataSource.initialize();
        try {
            // Load module entities
            const moduleEntities = await this.loadModuleEntities(module.name);
            // Update tenant data source with module entities
            tenantDataSource.entityMetadatas.push(...moduleEntities);
            // Run module migrations
            await tenantDataSource.runMigrations();
            // Seed module data
            await this.seedModuleData(tenantDataSource, module);
        }
        finally {
            await tenantDataSource.destroy();
        }
    }
    async loadModuleEntities(moduleName) {
        // Dynamic import of module entities
        const modulePath = `../modules/${moduleName}/entities`;
        try {
            const entities = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
            return Object.values(entities);
        }
        catch (error) {
            console.error(`Error loading module entities for ${moduleName}:`, error);
            return [];
        }
    }
    async seedModuleData(dataSource, module) {
        // Dynamic import of module seeder
        const seederPath = `../modules/${module.name}/seeders`;
        try {
            const seeder = await Promise.resolve(`${seederPath}`).then(s => __importStar(require(s)));
            if (seeder.default) {
                await seeder.default(dataSource);
            }
        }
        catch (error) {
            console.error(`Error seeding module data for ${module.name}:`, error);
        }
    }
    async uninstallModule(companyId, moduleId) {
        const companyModule = await this.companyModuleRepository.findOne({
            where: {
                company: { id: companyId },
                module: { id: moduleId }
            }
        });
        if (!companyModule) {
            throw new Error('Module not installed');
        }
        // Remove module from tenant database
        await this.removeModuleFromTenant(companyId, moduleId);
        // Delete company module record
        await this.companyModuleRepository.remove(companyModule);
    }
    async removeModuleFromTenant(companyId, moduleId) {
        const tenantDataSource = (0, database_1.getTenantDataSource)(companyId);
        await tenantDataSource.initialize();
        try {
            const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
            if (!module)
                return;
            // Load module entities
            const moduleEntities = await this.loadModuleEntities(module.name);
            // Drop module tables
            for (const entity of moduleEntities) {
                const metadata = tenantDataSource.getMetadata(entity);
                await tenantDataSource.query(`DROP TABLE IF EXISTS "${metadata.tableName}" CASCADE`);
            }
        }
        finally {
            await tenantDataSource.destroy();
        }
    }
    async getCompanyModules(companyId) {
        return this.companyModuleRepository.find({
            where: { company: { id: companyId } },
            relations: ['module']
        });
    }
    async updateModuleSettings(companyId, moduleId, settings) {
        const companyModule = await this.companyModuleRepository.findOne({
            where: {
                company: { id: companyId },
                module: { id: moduleId }
            }
        });
        if (!companyModule) {
            throw new Error('Module not installed');
        }
        companyModule.settings = {
            ...companyModule.settings,
            ...settings
        };
        return this.companyModuleRepository.save(companyModule);
    }
}
exports.ModuleService = ModuleService;
