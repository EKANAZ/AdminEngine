import { Repository } from 'typeorm';
import { Module } from '../models/Module';
import { CompanyModule } from '../models/CompanyModule';
import { getTenantDataSource } from '../config/database';
import { DatabaseConfig } from '../core/config/DatabaseConfig';

export class ModuleService {
  get moduleRepository() { return DatabaseConfig.getDataSource().getRepository(Module); }
  get companyModuleRepository() { return DatabaseConfig.getDataSource().getRepository(CompanyModule); }

  async installModule(companyId: string, moduleId: string): Promise<CompanyModule> {
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

  private async initializeModuleInTenant(companyId: string, module: Module): Promise<void> {
    const tenantDataSource = getTenantDataSource(companyId);
    await tenantDataSource.initialize();

    try {
      // Load module entities
      const moduleEntities = await this.loadModuleEntities(module.name);
      
      // Update tenant data source with module entities
      tenantDataSource.entityMetadatas.push(...moduleEntities);
      
      // Seed module data
      await this.seedModuleData(tenantDataSource, module);
    } finally {
      await tenantDataSource.destroy();
    }
  }

  private async loadModuleEntities(moduleName: string): Promise<any[]> {
    // Dynamic import of module entities
    const modulePath = `../modules/${moduleName}/entities`;
    try {
      const entities = await import(modulePath);
      return Object.values(entities);
    } catch (error) {
      console.error(`Error loading module entities for ${moduleName}:`, error);
      return [];
    }
  }

  private async seedModuleData(dataSource: any, module: Module): Promise<void> {
    // Dynamic import of module seeder
    const seederPath = `../modules/${module.name}/seeders`;
    try {
      const seeder = await import(seederPath);
      if (seeder.default) {
        await seeder.default(dataSource);
      }
    } catch (error) {
      console.error(`Error seeding module data for ${module.name}:`, error);
    }
  }

  async uninstallModule(companyId: string, moduleId: string): Promise<void> {
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

  private async removeModuleFromTenant(companyId: string, moduleId: string): Promise<void> {
    const tenantDataSource = getTenantDataSource(companyId);
    await tenantDataSource.initialize();

    try {
      const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (!module) return;

      // Load module entities
      const moduleEntities = await this.loadModuleEntities(module.name);
      
      // Drop module tables
      for (const entity of moduleEntities) {
        const metadata = tenantDataSource.getMetadata(entity);
        await tenantDataSource.query(`DROP TABLE IF EXISTS "${metadata.tableName}" CASCADE`);
      }
    } finally {
      await tenantDataSource.destroy();
    }
  }

  async getCompanyModules(companyId: string): Promise<CompanyModule[]> {
    return this.companyModuleRepository.find({
      where: { company: { id: companyId } },
      relations: ['module']
    });
  }

  async updateModuleSettings(
    companyId: string,
    moduleId: string,
    settings: Partial<CompanyModule['settings']>
  ): Promise<CompanyModule> {
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