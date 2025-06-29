import { Router } from 'express';
import { authenticateClient, authorizeClient, ClientRequest } from '../middleware/client.middleware';
import { getTenantDataSource } from '../config/database';
import { ClientUser } from '../models/ClientUser';
import { Interaction } from '../models/Interaction';


const router = Router();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Client ERP Routes - All require client authentication
router.use(authenticateClient);

// Get client's own data
router.get('/profile', asyncHandler(async (req: ClientRequest, res: any) => {
  const clientDataSource = getTenantDataSource(req.client!.id);
  await clientDataSource.initialize();
  
  try {
    // Get client profile from main database
    const { AppDataSource } = require('../config/database');
    const { Customer } = require('../models/Customer');
    const customerRepo = AppDataSource.getRepository(Customer);
    const customer = await customerRepo.findOne({ where: { id: req.client!.id } });
    
    res.json({
      success: true,
      data: {
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
  } finally {
    await clientDataSource.destroy();
  }
}));

// Get client's users (from their database)
router.get('/users', asyncHandler(async (req: ClientRequest, res: any) => {
  const clientDataSource = getTenantDataSource(req.client!.id);
  await clientDataSource.initialize();
  
  try {
    const userRepo = clientDataSource.getRepository(ClientUser);
    const users = await userRepo.find();
    
    res.json({
      success: true,
      data: { users }
    });
  } finally {
    await clientDataSource.destroy();
  }
}));

// Create user in client's database
router.post('/users', asyncHandler(async (req: ClientRequest, res: any) => {
  const clientDataSource = getTenantDataSource(req.client!.id);
  await clientDataSource.initialize();
  
  try {
    const userRepo = clientDataSource.getRepository(ClientUser);
    const user = userRepo.create(req.body);
    const savedUser = await userRepo.save(user);
    
    res.status(201).json({
      success: true,
      data: { user: savedUser }
    });
  } finally {
    await clientDataSource.destroy();
  }
}));

// Get client's interactions
router.get('/interactions', asyncHandler(async (req: ClientRequest, res: any) => {
  const clientDataSource = getTenantDataSource(req.client!.id);
  await clientDataSource.initialize();
  
  try {
    const interactionRepo = clientDataSource.getRepository(Interaction);
    const interactions = await interactionRepo.find();
    
    res.json({
      success: true,
      data: { interactions }
    });
  } finally {
    await clientDataSource.destroy();
  }
}));

// Create interaction in client's database
router.post('/interactions', asyncHandler(async (req: ClientRequest, res: any) => {
  const clientDataSource = getTenantDataSource(req.client!.id);
  await clientDataSource.initialize();
  
  try {
    const interactionRepo = clientDataSource.getRepository(Interaction);
    const interaction = interactionRepo.create(req.body);
    const savedInteraction = await interactionRepo.save(interaction);
    
    res.status(201).json({
      success: true,
      data: { interaction: savedInteraction }
    });
  } finally {
    await clientDataSource.destroy();
  }
}));

// Update client's own profile
router.put('/profile', asyncHandler(async (req: ClientRequest, res: any) => {
  const { AppDataSource } = require('../config/database');
  const { Customer } = require('../models/Customer');
  const customerRepo = AppDataSource.getRepository(Customer);
  
  const customer = await customerRepo.findOne({ where: { id: req.client!.id } });
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }
  
  // Update allowed fields only
  const allowedFields = ['name', 'phone', 'companyName'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      (customer as any)[field] = req.body[field];
    }
  });
  
  const updatedCustomer = await customerRepo.save(customer);
  
  res.json({
    success: true,
    data: {
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        companyName: updatedCustomer.companyName,
        phone: updatedCustomer.phone,
        subscriptionPlan: updatedCustomer.subscriptionPlan
      }
    }
  });
}));

export default router; 