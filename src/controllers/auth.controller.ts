import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { DatabaseConfig } from '../core/config/DatabaseConfig';
import logger from '../config/logger';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { createTenantDatabase } from '../config/database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async register(req: Request, res: Response): Promise<void> {
    const { companyName, companyDomain, email, password, firstName, lastName } = req.body;

    try {
      // Start transaction
      const queryRunner = DatabaseConfig.getDataSource().createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create company
        const company = new Company();
        company.name = companyName;
        company.domain = companyDomain;
        await queryRunner.manager.save(company);

        // Create tenant database
        await createTenantDatabase(company.id);

        // Create admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User();
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
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

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
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Error during registration'
      });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await DatabaseConfig.getDataSource().getRepository(User)
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

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

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
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Error during login'
      });
    }
  }

  public async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, permissions } = req.body;
      const role = await this.authService.createRole({ name, permissions });
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  public async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.body;
      await this.authService.assignRole(userId, roleId);
      res.json({ message: 'Role assigned successfully' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
} 