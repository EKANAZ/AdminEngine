import { z } from 'zod';

// Client login validation schema
export const clientLoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    companyDomain: z.string().min(1, 'Company domain is required')
});

// Sync data validation schema
export const syncDataSchema = z.object({
    lastSyncTimestamp: z.string().datetime('Invalid timestamp format'),
    entityTypes: z.array(z.string()).min(1, 'At least one entity type is required')
});

// Push data validation schema
export const pushDataSchema = z.object({
    changes: z.record(z.array(z.any()))
}); 