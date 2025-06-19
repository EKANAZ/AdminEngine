export interface IConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
  };
  logging: {
    level: string;
    format: string;
  };
} 