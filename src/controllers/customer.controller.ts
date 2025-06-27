import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../models/Customer';
import { createTenantDatabase } from '../config/database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import logger from '../config/logger';

export class CustomerController {
  async registerCustomer(req: Request, res: Response) {
    try {
      // Ensure DataSource is initialized
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const { firstName, lastName, email, password, phone, companyName } = req.body;
      
      // Start transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create customer record in main database
        const customerRepo = AppDataSource.getRepository(Customer);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const customer = customerRepo.create({
          name: `${firstName} ${lastName}`,
          companyName: companyName || 'Individual Customer',
          email,
          password: hashedPassword,
          phone,
          subscriptionPlan: 'basic',
          registrationInfo: JSON.stringify({
            firstName,
            lastName,
            registeredAt: new Date().toISOString()
          })
        });
        
        await queryRunner.manager.save(customer);

        // Create client database for this customer
        await createTenantDatabase(customer.id);
        logger.info(`Created client database for customer: ${customer.id}`);

        await queryRunner.commitTransaction();

        // Generate JWT token for client
        const token = jwt.sign(
          { 
            customerId: customer.id, 
            email: customer.email,
            type: 'client'
          }, 
          process.env.JWT_SECRET || 'your-secret-key', 
          { expiresIn: '24h' }
        );

        res.status(201).json({ 
          success: true, 
          data: {
            token,
            customer: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              companyName: customer.companyName,
              phone: customer.phone,
              subscriptionPlan: customer.subscriptionPlan
            },
            message: 'Client registration successful. Client database created.'
          }
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      logger.error('Customer registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Client registration failed', 
        error: (error as Error).message 
      });
    }
  }

  async loginCustomer(req: Request, res: Response) {
    try {
      // Ensure DataSource is initialized
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const { email, password } = req.body;
      const customerRepo = AppDataSource.getRepository(Customer);
      const customer = await customerRepo.findOne({ where: { email } });
      
      if (!customer) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      const isValid = await bcrypt.compare(password, customer.password);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Generate JWT token for client access
      const token = jwt.sign(
        { 
          customerId: customer.id, 
          email: customer.email,
          type: 'client'
        }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '24h' }
      );
      
      res.json({ 
        success: true, 
        data: {
          token,
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            companyName: customer.companyName,
            phone: customer.phone,
            subscriptionPlan: customer.subscriptionPlan
          }
        }
      });
    } catch (error) {
      logger.error('Customer login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Login failed', 
        error: (error as Error).message 
      });
    }
  }
} 