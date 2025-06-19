import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Client } from 'pg';

export class DatabaseService {
  private static instance: DatabaseService;
  private mainDataSource: DataSource;

  private constructor() {
    this.mainDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'auth_service',
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      entities: [User, Role],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initializeMainDatabase(): Promise<void> {
    try {
      await this.mainDataSource.initialize();
      console.log('Main database connected successfully');
    } catch (error) {
      console.error('Error connecting to main database:', error);
      throw error;
    }
  }

  public async createUserDatabase(userId: string): Promise<void> {
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres' // Connect to default database
    });

    try {
      await client.connect();
      
      // Create new database for user
      const dbName = `user_${userId.replace(/-/g, '_')}`;
      await client.query(`CREATE DATABASE ${dbName}`);
      
      // Create new user with password
      const userPassword = Math.random().toString(36).slice(-8); // Generate random password
      await client.query(`CREATE USER ${dbName} WITH PASSWORD '${userPassword}'`);
      
      // Grant privileges
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbName}`);
      
      // Store the database credentials in user metadata
      await this.mainDataSource
        .createQueryBuilder()
        .update(User)
        .set({
          metadata: {
            databaseName: dbName,
            databaseUser: dbName,
            databasePassword: userPassword
          }
        })
        .where('id = :id', { id: userId })
        .execute();

      console.log(`Created database for user ${userId}`);
    } catch (error) {
      console.error('Error creating user database:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  public async getUserDatabaseConnection(userId: string): Promise<DataSource> {
    const user = await this.mainDataSource
      .createQueryBuilder(User, 'user')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user?.metadata?.databaseName) {
      throw new Error('User database not found');
    }

    return new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: user.metadata.databaseUser,
      password: user.metadata.databasePassword,
      database: user.metadata.databaseName,
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    });
  }
} 