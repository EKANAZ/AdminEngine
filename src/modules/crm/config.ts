export const crmModuleConfig = {
  name: 'crm',
  version: '1.0.0',
  description: 'Customer Relationship Management Module',
  dependencies: [],
  features: [
    'customer_management',
    'contact_management',
    'interaction_tracking',
    'lead_management',
    'reporting'
  ],
  settings: {
    defaultStatuses: ['active', 'inactive', 'lead'],
    interactionTypes: ['email', 'call', 'meeting', 'note', 'other'],
    customFields: {
      customer: [],
      contact: [],
      interaction: []
    }
  },
  pricing: {
    monthly: 49.99,
    yearly: 499.99,
    features: {
      customer_management: true,
      contact_management: true,
      interaction_tracking: true,
      lead_management: true,
      reporting: true,
      api_access: false,
      custom_fields: false,
      advanced_analytics: false
    }
  },
  permissions: [
    'crm:customer:create',
    'crm:customer:read',
    'crm:customer:update',
    'crm:customer:delete',
    'crm:contact:create',
    'crm:contact:read',
    'crm:contact:update',
    'crm:contact:delete',
    'crm:interaction:create',
    'crm:interaction:read',
    'crm:interaction:update',
    'crm:interaction:delete',
    'crm:report:view'
  ]
}; 