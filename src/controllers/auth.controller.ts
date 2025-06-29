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
      // Use the AuthService for registration
      const result = await this.authService.register({
        firstName,
        lastName,
        email,
        password,
        companyName
      });

        res.status(201).json({
          success: true,
          data: {
          token: result.token,
          refreshToken: result.refreshToken,
            user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            roles: result.user.roles
            },
            company: {
            id: result.user.company.id,
            name: result.user.company.name
            }
          }
        });
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
      // Use the AuthService for login
      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        data: {
          token: result.token,
          refreshToken: result.refreshToken,
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            roles: result.user.roles
          },
          company: {
            id: result.user.company.id,
            name: result.user.company.name
          }
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
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