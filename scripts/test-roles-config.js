/**
 * Automated Browser Testing for All Roles
 * Uses Playwright to test each role with real browser interactions
 */

const testRoles = [
  {
    name: 'SUPER_ADMIN',
    email: 'superadmin@example.com',
    password: 'SuperAdmin123!@#',
    expectedAccess: {
      canCreateStore: true,
      dashboardPath: '/dashboard',
      storesPath: '/dashboard/stores',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
      { name: 'View Stores', url: '/dashboard/stores' },
      { name: 'Check Create Store Button', selector: 'button:has-text("Create Store")' },
    ],
  },
  {
    name: 'OWNER',
    email: 'test@example.com',
    password: 'Test123!@#',
    expectedAccess: {
      canCreateStore: true,
      dashboardPath: '/dashboard',
      storesPath: '/dashboard/stores',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
      { name: 'View Stores', url: '/dashboard/stores' },
      { name: 'Check Create Store Button', selector: 'button:has-text("Create Store")' },
    ],
  },
  {
    name: 'ADMIN',
    email: 'admin@example.com',
    password: 'OrgAdmin123!@#',
    expectedAccess: {
      canCreateStore: true,
      dashboardPath: '/dashboard',
      storesPath: '/dashboard/stores',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
      { name: 'View Stores', url: '/dashboard/stores' },
      { name: 'Check Create Store Button', selector: 'button:has-text("Create Store")' },
    ],
  },
  {
    name: 'MEMBER',
    email: 'member@example.com',
    password: 'OrgMember123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
      storesPath: '/dashboard/stores',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
      { name: 'View Stores (read-only)', url: '/dashboard/stores' },
    ],
  },
  {
    name: 'VIEWER',
    email: 'viewer@example.com',
    password: 'OrgViewer123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
  {
    name: 'STORE_ADMIN',
    email: 'storeadmin@example.com',
    password: 'StoreAdmin123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
      productsPath: '/dashboard/products',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
      { name: 'View Products', url: '/dashboard/products' },
    ],
  },
  {
    name: 'SALES_MANAGER',
    email: 'sales@example.com',
    password: 'SalesManager123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
  {
    name: 'INVENTORY_MANAGER',
    email: 'inventory@example.com',
    password: 'InventoryManager123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
      productsPath: '/dashboard/products',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
      { name: 'View Products', url: '/dashboard/products' },
    ],
  },
  {
    name: 'CUSTOMER_SERVICE',
    email: 'support@example.com',
    password: 'CustomerService123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
  {
    name: 'CONTENT_MANAGER',
    email: 'content@example.com',
    password: 'ContentManager123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
  {
    name: 'MARKETING_MANAGER',
    email: 'marketing@example.com',
    password: 'MarketingManager123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
  {
    name: 'DELIVERY_BOY',
    email: 'delivery@example.com',
    password: 'Delivery123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
  {
    name: 'CUSTOMER',
    email: 'customer1@example.com',
    password: 'Customer123!@#',
    expectedAccess: {
      canCreateStore: false,
      dashboardPath: '/dashboard',
    },
    tests: [
      { name: 'Login', url: '/login' },
      { name: 'Access Dashboard', url: '/dashboard' },
    ],
  },
];

module.exports = { testRoles };
