import { Repository } from 'typeorm';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { AppDataSource } from '../config/database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private userRepository: Repository<User>;
  private companyRepository: Repository<Company>;
  private roleRepository: Repository<Role>;
  private permissionRepository: Repository<Permission>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.companyRepository = AppDataSource.getRepository(Company);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.permissionRepository = AppDataSource.getRepository(Permission);
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ user: User; token: string }> {
    // Create company
    const company = this.companyRepository.create({
      name: userData.companyName,
      status: 'active'
    });
    await this.companyRepository.save(company);

    // Create user
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      company
    });
    await this.userRepository.save(user);

    // Create default admin role
    const adminRole = this.roleRepository.create({
      name: 'Admin',
      description: 'System administrator role',
      isSystem: true,
      user
    });
    await this.roleRepository.save(adminRole);

    // Create default permissions
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

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company', 'roles', 'roles.permissions']
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user);
    return { user, token };
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await this.userRepository.save(user);

    // TODO: Send password reset email
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
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

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.company.id,
      roles: user.roles.map(role => role.name)
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h'
    });
  }

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        relations: ['company', 'roles', 'roles.permissions']
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async assignRole(userId: string, roleId: string): Promise<User> {
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

  async createRole(roleData: {
    name: string;
    description?: string;
    permissions: Record<string, any>;
  }): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleData.name }
    });

    if (existingRole) {
      throw new AuthError('Role already exists', 400);
    }

    const role = this.roleRepository.create(roleData);
    return this.roleRepository.save(role);
  }
} 