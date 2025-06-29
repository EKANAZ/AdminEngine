import { Repository } from 'typeorm';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { DatabaseConfig } from '../core/config/DatabaseConfig';
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
  get userRepository() { return DatabaseConfig.getDataSource().getRepository(User); }
  get companyRepository() { return DatabaseConfig.getDataSource().getRepository(Company); }
  get roleRepository() { return DatabaseConfig.getDataSource().getRepository(Role); }
  get permissionRepository() { return DatabaseConfig.getDataSource().getRepository(Permission); }

  // In-memory refresh token store (use Redis in production)
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ user: User; token: string; refreshToken: string }> {
    // 1. Create a new company for the user
    const company = this.companyRepository.create({ name: userData.companyName });
    await this.companyRepository.save(company);

    // 2. Hash the user's password for security
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    // 3. Create the user and associate with the company
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      company
    });
    await this.userRepository.save(user);

    // 4. Create a default admin role for the user
    const adminRole = this.roleRepository.create({
      name: 'Admin',
      description: 'System administrator role',
      isSystem: true,
      user
    });
    await this.roleRepository.save(adminRole);

    // 5. Assign all permissions to the admin role
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

    // 6. Generate JWT token and refresh token for the new user
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // 7. Return the user and tokens
    return { user, token, refreshToken };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    // 1. Find the user by email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company', 'roles', 'roles.permissions']
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // 3. Update the user's last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 4. Generate JWT token and refresh token for the user
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return { user, token, refreshToken };
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
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  private generateRefreshToken(user: User): string {
    const refreshToken = uuidv4(); // Generate a unique refresh token
    
    // Store refresh token with expiration
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return refreshToken;
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

    const role = this.roleRepository.create({ name: roleData.name, description: roleData.description });
    return this.roleRepository.save(role);
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Check if refresh token exists in our store
      const storedToken = this.refreshTokens.get(refreshToken);
      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token has expired
      if (new Date() > storedToken.expiresAt) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Refresh token expired');
      }

      // Get user data
      const user = await this.userRepository.findOne({
        where: { id: storedToken.userId },
        relations: ['company', 'roles', 'roles.permissions']
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token and refresh token
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    // Remove refresh token from store
    this.refreshTokens.delete(refreshToken);
  }
} 