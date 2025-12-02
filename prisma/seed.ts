import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, PaymentGateway, InventoryStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with MEDIUM data...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.inventoryLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.store.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create 3 test users with password
  console.log('👤 Creating test users...');
  const passwordHash = await bcrypt.hash('Test123!@#', 10);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'clqm1j4k00000l8dw8z8r8z8a',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(),
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller@example.com',
        name: 'Seller Admin',
        emailVerified: new Date(),
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@example.com',
        name: 'Buyer Member',
        emailVerified: new Date(),
        passwordHash,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // Create Super Admin user
  console.log('👤 Creating Super Admin user...');
  const superAdminHash = await bcrypt.hash('SuperAdmin123!@#', 12);
  const superAdmin = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z9a', // Fixed Super Admin ID
      email: 'superadmin@example.com',
      name: 'Super Administrator',
      emailVerified: new Date(),
      passwordHash: superAdminHash,
      isSuperAdmin: true,  // Platform-level administrator
    },
  });
  console.log(`✅ Created Super Admin: ${superAdmin.email}`);

  // Create Store Admin user (will be assigned to store later)
  console.log('👤 Creating Store Admin user...');
  const storeAdminHash = await bcrypt.hash('StoreAdmin123!@#', 12);
  const storeAdmin = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z9b', // Fixed Store Admin ID
      email: 'storeadmin@example.com',
      name: 'Store Administrator',
      emailVerified: new Date(),
      passwordHash: storeAdminHash,
    },
  });
  console.log(`✅ Created Store Admin user: ${storeAdmin.email}`);

  // Create organizations
  console.log('🏢 Creating organizations...');
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        id: 'clqm1j4k00000l8dw8z8r8z8b', // Fixed org ID
        name: 'Demo Company',
        slug: 'demo-company',
        image: null,
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        image: null,
      },
    }),
  ]);
  console.log(`✅ Created ${organizations.length} organizations`);

  // Create memberships
  console.log('👥 Creating memberships...');
  await Promise.all([
    prisma.membership.create({
      data: {
        userId: users[0].id,
        organizationId: organizations[0].id,
        role: 'OWNER',
      },
    }),
    prisma.membership.create({
      data: {
        userId: users[1].id,
        organizationId: organizations[0].id,
        role: 'ADMIN',
      },
    }),
    prisma.membership.create({
      data: {
        userId: users[2].id,
        organizationId: organizations[1].id,
        role: 'MEMBER',
      },
    }),
  ]);
  console.log('✅ Created memberships');

  // Create 2 stores
  console.log('🏪 Creating stores...');
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        id: 'clqm1j4k00000l8dw8z8r8z8r',
        organizationId: organizations[0].id,
        name: 'Demo Store',
        slug: 'demo-store',
        description: 'A demo e-commerce store for testing',
        email: 'store@example.com',
        phone: '+1-555-0100',
        website: 'https://demo-store.example.com',
        address: '123 Commerce Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        locale: 'en',
        subscriptionPlan: SubscriptionPlan.PRO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 1000,
        orderLimit: 10000,
      },
    }),
    prisma.store.create({
      data: {
        organizationId: organizations[1].id,
        name: 'Acme Store',
        slug: 'acme-store',
        description: 'Acme Corporation online store',
        email: 'acme@example.com',
        phone: '+1-555-0200',
        website: 'https://acme.example.com',
        address: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        currency: 'USD',
        timezone: 'America/New_York',
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 500,
        orderLimit: 5000,
      },
    }),
  ]);
  console.log(`✅ Created ${stores.length} stores`);

  // Create additional staff members with different roles
  console.log('👥 Creating staff members with various roles...');
  
  // Sales Manager
  const salesManagerHash = await bcrypt.hash('SalesManager123!@#', 12);
  const salesManager = await prisma.user.create({
    data: {
      email: 'sales@example.com',
      name: 'Sales Manager',
      emailVerified: new Date(),
      passwordHash: salesManagerHash,
    },
  });
  console.log(`✅ Created Sales Manager: ${salesManager.email}`);
  
  // Inventory Manager
  const inventoryManagerHash = await bcrypt.hash('InventoryManager123!@#', 12);
  const inventoryManager = await prisma.user.create({
    data: {
      email: 'inventory@example.com',
      name: 'Inventory Manager',
      emailVerified: new Date(),
      passwordHash: inventoryManagerHash,
    },
  });
  console.log(`✅ Created Inventory Manager: ${inventoryManager.email}`);
  
  // Customer Service
  const customerServiceHash = await bcrypt.hash('CustomerService123!@#', 12);
  const customerService = await prisma.user.create({
    data: {
      email: 'support@example.com',
      name: 'Customer Service Rep',
      emailVerified: new Date(),
      passwordHash: customerServiceHash,
    },
  });
  console.log(`✅ Created Customer Service: ${customerService.email}`);
  
  // Content Manager
  const contentManagerHash = await bcrypt.hash('ContentManager123!@#', 12);
  const contentManager = await prisma.user.create({
    data: {
      email: 'content@example.com',
      name: 'Content Manager',
      emailVerified: new Date(),
      passwordHash: contentManagerHash,
    },
  });
  console.log(`✅ Created Content Manager: ${contentManager.email}`);
  
  // Marketing Manager
  const marketingManagerHash = await bcrypt.hash('MarketingManager123!@#', 12);
  const marketingManager = await prisma.user.create({
    data: {
      email: 'marketing@example.com',
      name: 'Marketing Manager',
      emailVerified: new Date(),
      passwordHash: marketingManagerHash,
    },
  });
  console.log(`✅ Created Marketing Manager: ${marketingManager.email}`);
  
  // Customer users (registered customers with login accounts)
  console.log('🛍️ Creating customer users...');
  
  const customer1Hash = await bcrypt.hash('Customer123!@#', 12);
  const customer1User = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      name: 'John Customer',
      emailVerified: new Date(),
      passwordHash: customer1Hash,
    },
  });
  console.log(`✅ Created Customer 1: ${customer1User.email}`);
  
  const customer2Hash = await bcrypt.hash('Customer123!@#', 12);
  const customer2User = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      name: 'Jane Shopper',
      emailVerified: new Date(),
      passwordHash: customer2Hash,
    },
  });
  console.log(`✅ Created Customer 2: ${customer2User.email}`);
  
  // Assign Store Admin to store
  console.log('👥 Assigning staff to store...');
  await prisma.storeStaff.create({
    data: {
      userId: storeAdmin.id,
      storeId: stores[0].id,
      role: 'STORE_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Assigned Store Admin to Demo Store');
  
  // Assign Sales Manager
  await prisma.storeStaff.create({
    data: {
      userId: salesManager.id,
      storeId: stores[0].id,
      role: 'SALES_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Sales Manager to Demo Store');
  
  // Assign Inventory Manager
  await prisma.storeStaff.create({
    data: {
      userId: inventoryManager.id,
      storeId: stores[0].id,
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Inventory Manager to Demo Store');
  
  // Assign Customer Service
  await prisma.storeStaff.create({
    data: {
      userId: customerService.id,
      storeId: stores[0].id,
      role: 'CUSTOMER_SERVICE',
      isActive: true,
    },
  });
  console.log('✅ Assigned Customer Service to Demo Store');
  
  // Assign Content Manager
  await prisma.storeStaff.create({
    data: {
      userId: contentManager.id,
      storeId: stores[0].id,
      role: 'CONTENT_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Content Manager to Demo Store');
  
  // Assign Marketing Manager
  await prisma.storeStaff.create({
    data: {
      userId: marketingManager.id,
      storeId: stores[0].id,
      role: 'MARKETING_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Marketing Manager to Demo Store');

  // Create categories
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        storeId: stores[0].id,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        isPublished: true,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        storeId: stores[0].id,
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        isPublished: true,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        storeId: stores[0].id,
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories and extras',
        isPublished: true,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        storeId: stores[0].id,
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home and garden products',
        isPublished: true,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        storeId: stores[0].id,
        name: 'Sports',
        slug: 'sports',
        description: 'Sports and fitness equipment',
        isPublished: true,
        sortOrder: 5,
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create 4 brands
  console.log('🏷️ Creating brands...');
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        storeId: stores[0].id,
        name: 'Apple',
        slug: 'apple',
        description: 'Premium technology products',
        website: 'https://apple.com',
        isPublished: true,
      },
    }),
    prisma.brand.create({
      data: {
        storeId: stores[0].id,
        name: 'Nike',
        slug: 'nike',
        description: 'Athletic apparel and footwear',
        website: 'https://nike.com',
        isPublished: true,
      },
    }),
    prisma.brand.create({
      data: {
        storeId: stores[0].id,
        name: 'Samsung',
        slug: 'samsung',
        description: 'Consumer electronics',
        website: 'https://samsung.com',
        isPublished: true,
      },
    }),
    prisma.brand.create({
      data: {
        storeId: stores[0].id,
        name: 'Sony',
        slug: 'sony',
        description: 'Entertainment and electronics',
        website: 'https://sony.com',
        isPublished: true,
      },
    }),
  ]);
  console.log(`✅ Created ${brands.length} brands`);

  // Create 15 products with variants
  console.log('📦 Creating products with variants...');
  const productData = [
    // Electronics (5)
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      categoryId: categories[0].id,
      brandId: brands[0].id,
      price: 999.99,
      compareAtPrice: 1099.99,
      sku: 'AAPL-IPH15P-001',
      description: 'Latest iPhone with A17 Pro chip',
      variants: [
        { name: '128GB Black', sku: 'AAPL-IPH15P-128B', price: 999.99 },
        { name: '256GB Silver', sku: 'AAPL-IPH15P-256S', price: 1049.99 },
        { name: '512GB Gold', sku: 'AAPL-IPH15P-512G', price: 1149.99 },
      ],
    },
    {
      name: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      categoryId: categories[0].id,
      brandId: brands[2].id,
      price: 899.99,
      compareAtPrice: 999.99,
      sku: 'SAMS-GAL24-001',
      description: 'Flagship Android phone',
      variants: [
        { name: 'Base Model', sku: 'SAMS-GAL24-BASE', price: 899.99 },
        { name: '512GB', sku: 'SAMS-GAL24-512', price: 949.99 },
      ],
    },
    {
      name: 'iPad Pro 12.9"',
      slug: 'ipad-pro-12-9',
      categoryId: categories[0].id,
      brandId: brands[0].id,
      price: 1199.99,
      sku: 'AAPL-IPAD-001',
      description: 'Professional tablet',
      variants: [
        { name: '256GB WiFi', sku: 'AAPL-IPAD-256W', price: 1199.99 },
        { name: '512GB WiFi+Cellular', sku: 'AAPL-IPAD-512C', price: 1499.99 },
      ],
    },
    {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      categoryId: categories[2].id,
      brandId: brands[3].id,
      price: 399.99,
      sku: 'SONY-WH1000-001',
      description: 'Premium noise-canceling headphones',
      variants: [
        { name: 'Black', sku: 'SONY-WH1000-BK', price: 399.99 },
        { name: 'Silver', sku: 'SONY-WH1000-SV', price: 399.99 },
      ],
    },
    {
      name: 'Apple Watch Series 9',
      slug: 'apple-watch-series-9',
      categoryId: categories[0].id,
      brandId: brands[0].id,
      price: 399.99,
      sku: 'AAPL-AW9-001',
      description: 'Advanced fitness tracking',
      variants: [
        { name: '41mm Silver', sku: 'AAPL-AW9-41S', price: 399.99 },
        { name: '45mm Space Black', sku: 'AAPL-AW9-45B', price: 429.99 },
      ],
    },
    // Clothing (4)
    {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      categoryId: categories[1].id,
      brandId: brands[1].id,
      price: 150.00,
      compareAtPrice: 180.00,
      sku: 'NIKE-AM270-001',
      description: 'Comfortable running shoes',
      variants: [
        { name: 'Size 8', sku: 'NIKE-AM270-8', price: 150.00 },
        { name: 'Size 10', sku: 'NIKE-AM270-10', price: 150.00 },
        { name: 'Size 12', sku: 'NIKE-AM270-12', price: 150.00 },
      ],
    },
    {
      name: 'Nike Dri-FIT T-Shirt',
      slug: 'nike-dri-fit-tshirt',
      categoryId: categories[1].id,
      brandId: brands[1].id,
      price: 35.00,
      sku: 'NIKE-DFT-001',
      description: 'Moisture-wicking athletic t-shirt',
      variants: [
        { name: 'Small Black', sku: 'NIKE-DFT-S-BK', price: 35.00 },
        { name: 'Medium Gray', sku: 'NIKE-DFT-M-GR', price: 35.00 },
      ],
    },
    {
      name: 'Sports Running Jacket',
      slug: 'sports-running-jacket',
      categoryId: categories[4].id,
      brandId: brands[1].id,
      price: 89.99,
      sku: 'NIKE-JCK-001',
      description: 'Lightweight windproof jacket',
      variants: [
        { name: 'Small', sku: 'NIKE-JCK-S', price: 89.99 },
        { name: 'Large', sku: 'NIKE-JCK-L', price: 89.99 },
      ],
    },
    {
      name: 'Training Shorts',
      slug: 'training-shorts',
      categoryId: categories[1].id,
      brandId: brands[1].id,
      price: 45.00,
      sku: 'NIKE-SHRT-001',
      description: 'Breathable training shorts',
      variants: [
        { name: 'Small', sku: 'NIKE-SHRT-S', price: 45.00 },
      ],
    },
    // Accessories (3)
    {
      name: 'Wireless Earbuds Pro',
      slug: 'wireless-earbuds-pro',
      categoryId: categories[2].id,
      price: 199.99,
      sku: 'EARBUD-PRO-001',
      description: 'Premium wireless earbuds',
      variants: [
        { name: 'Black', sku: 'EARBUD-PRO-BK', price: 199.99 },
      ],
    },
    {
      name: 'Phone Case Protector',
      slug: 'phone-case-protector',
      categoryId: categories[2].id,
      price: 25.00,
      sku: 'CASE-PRO-001',
      description: 'Durable phone protection',
      variants: [
        { name: 'iPhone Black', sku: 'CASE-PRO-IPH-BK', price: 25.00 },
        { name: 'Samsung Blue', sku: 'CASE-PRO-SAM-BL', price: 25.00 },
      ],
    },
    {
      name: 'Travel Backpack',
      slug: 'travel-backpack',
      categoryId: categories[3].id,
      price: 89.99,
      sku: 'BAG-TRAVEL-001',
      description: 'Spacious travel backpack',
      variants: [
        { name: 'Gray', sku: 'BAG-TRAVEL-GR', price: 89.99 },
      ],
    },
    // Home (2)
    {
      name: 'Smart LED Lamp',
      slug: 'smart-led-lamp',
      categoryId: categories[3].id,
      price: 49.99,
      sku: 'LAMP-SMART-001',
      description: 'WiFi-enabled smart lamp',
      variants: [
        { name: 'White', sku: 'LAMP-SMART-WH', price: 49.99 },
      ],
    },
    {
      name: 'USB Charging Hub',
      slug: 'usb-charging-hub',
      categoryId: categories[2].id,
      price: 34.99,
      sku: 'HUB-USB-001',
      description: 'Multi-port charging hub',
      variants: [
        { name: 'Standard', sku: 'HUB-USB-STD', price: 34.99 },
      ],
    },
  ];

  const products = await Promise.all(
    productData.map(async (p) => {
      const product = await prisma.product.create({
        data: {
          storeId: stores[0].id,
          categoryId: p.categoryId,
          brandId: p.brandId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          shortDescription: p.description?.substring(0, 50),
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          costPrice: p.price * 0.5,
          sku: p.sku,
          trackInventory: true,
          inventoryQty: Math.floor(Math.random() * 150) + 10,
          lowStockThreshold: 10,
          inventoryStatus: InventoryStatus.IN_STOCK,
          images: JSON.stringify(['/placeholder.svg']),
          status: ProductStatus.ACTIVE,
          publishedAt: new Date(),
          isFeatured: Math.random() > 0.6,
        },
      });

      // Create variants for each product
      await Promise.all(
        p.variants.map((v) =>
          prisma.productVariant.create({
            data: {
              productId: product.id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              inventoryQty: Math.floor(Math.random() * 100) + 5,
              lowStockThreshold: 5,
              isDefault: p.variants.indexOf(v) === 0,
              options: '{}',
            },
          })
        )
      );

      return product;
    })
  );
  console.log(`✅ Created ${products.length} products with variants`);

  // Create 15 customers
  console.log('👨‍👩‍👧‍👦 Creating customers...');
  
  // Registered customers (linked to user accounts)
  const customer1Profile = await prisma.customer.create({
    data: {
      storeId: stores[0].id,
      userId: customer1User.id,  // Link to user account
      email: 'customer1@example.com',
      firstName: 'John',
      lastName: 'Customer',
      phone: '+1-555-0101',
      acceptsMarketing: true,
      marketingOptInAt: new Date(),
      totalOrders: 0,
      totalSpent: 0,
    },
  });
  
  const customer2Profile = await prisma.customer.create({
    data: {
      storeId: stores[0].id,
      userId: customer2User.id,  // Link to user account
      email: 'customer2@example.com',
      firstName: 'Jane',
      lastName: 'Shopper',
      phone: '+1-555-0102',
      acceptsMarketing: false,
      totalOrders: 0,
      totalSpent: 0,
    },
  });
  
  // Guest customers (no user accounts)
  const guestCustomers = await Promise.all([
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        userId: null,  // Guest checkout
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0103',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        userId: null,  // Guest checkout
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0104',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        userId: null,  // Guest checkout
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1-555-0105',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
  ]);
  
  const customers = [customer1Profile, customer2Profile, ...guestCustomers];
  console.log(`✅ Created ${customers.length} customers (2 registered + 3 guests)`);

  // Create orders with different statuses
  console.log('🛒 Creating orders...');
  const shippingAddress = JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US',
    phone: '+1-555-0101',
  });

  const billingAddress = shippingAddress;

  const orders = await Promise.all([
    // PENDING order
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[0].id,
        orderNumber: 'ORD-00001',
        status: OrderStatus.PENDING,
        subtotal: 999.99,
        taxAmount: 89.99,
        shippingAmount: 10.00,
        discountAmount: 0,
        totalAmount: 1099.98,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.PENDING,
        shippingMethod: 'Standard Shipping',
        shippingAddress,
        billingAddress,
        customerNote: 'Please deliver after 5 PM',
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              sku: products[0].sku,
              price: 999.99,
              quantity: 1,
              subtotal: 999.99,
              taxAmount: 89.99,
              totalAmount: 1089.98,
            },
          ],
        },
      },
    }),
    // PAID order (ready to process)
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[1].id,
        orderNumber: 'ORD-00002',
        status: OrderStatus.PAID,
        subtotal: 899.99,
        taxAmount: 80.99,
        shippingAmount: 15.00,
        discountAmount: 50.00,
        totalAmount: 945.98,
        discountCode: 'SAVE50',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.PAID,
        shippingMethod: 'Express Shipping',
        shippingAddress,
        billingAddress,
        items: {
          create: [
            {
              productId: products[1].id,
              productName: products[1].name,
              sku: products[1].sku,
              price: 899.99,
              quantity: 1,
              subtotal: 899.99,
              taxAmount: 80.99,
              discountAmount: 50.00,
              totalAmount: 930.98,
            },
          ],
        },
      },
    }),
    // PROCESSING order
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[2].id,
        orderNumber: 'ORD-00003',
        status: OrderStatus.PROCESSING,
        subtotal: 335.00,
        taxAmount: 30.15,
        shippingAmount: 10.00,
        discountAmount: 0,
        totalAmount: 375.15,
        paymentMethod: PaymentMethod.DEBIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.PAID,
        shippingMethod: 'Standard Shipping',
        shippingAddress,
        billingAddress,
        items: {
          create: [
            {
              productId: products[2].id,
              productName: products[2].name,
              sku: products[2].sku,
              price: 150.00,
              quantity: 2,
              subtotal: 300.00,
              taxAmount: 27.00,
              totalAmount: 327.00,
            },
            {
              productId: products[3].id,
              productName: products[3].name,
              sku: products[3].sku,
              price: 35.00,
              quantity: 1,
              subtotal: 35.00,
              taxAmount: 3.15,
              totalAmount: 38.15,
            },
          ],
        },
      },
    }),
    // SHIPPED order
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[3].id,
        orderNumber: 'ORD-00004',
        status: OrderStatus.SHIPPED,
        subtotal: 199.99,
        taxAmount: 17.99,
        shippingAmount: 10.00,
        discountAmount: 0,
        totalAmount: 227.98,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.PAID,
        shippingMethod: 'Standard Shipping',
        trackingNumber: 'TRACK123456789',
        trackingUrl: 'https://tracking.example.com/TRACK123456789',
        shippingAddress,
        billingAddress,
        items: {
          create: [
            {
              productId: products[4].id,
              productName: products[4].name,
              sku: products[4].sku,
              price: 199.99,
              quantity: 1,
              subtotal: 199.99,
              taxAmount: 17.99,
              totalAmount: 217.98,
            },
          ],
        },
      },
    }),
    // DELIVERED order
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[4].id,
        orderNumber: 'ORD-00005',
        status: OrderStatus.DELIVERED,
        subtotal: 150.00,
        taxAmount: 13.50,
        shippingAmount: 10.00,
        discountAmount: 0,
        totalAmount: 173.50,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.PAID,
        shippingMethod: 'Express Shipping',
        trackingNumber: 'TRACK987654321',
        trackingUrl: 'https://tracking.example.com/TRACK987654321',
        shippingAddress,
        billingAddress,
        fulfilledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        items: {
          create: [
            {
              productId: products[2].id,
              productName: products[2].name,
              sku: products[2].sku,
              price: 150.00,
              quantity: 1,
              subtotal: 150.00,
              taxAmount: 13.50,
              totalAmount: 163.50,
            },
          ],
        },
      },
    }),
    // CANCELED order
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[0].id,
        orderNumber: 'ORD-00006',
        status: OrderStatus.CANCELED,
        subtotal: 449.99,
        taxAmount: 40.49,
        shippingAmount: 10.00,
        discountAmount: 0,
        totalAmount: 500.48,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.REFUNDED,
        shippingMethod: 'Standard Shipping',
        shippingAddress,
        billingAddress,
        canceledAt: new Date(),
        cancelReason: 'Customer requested cancellation',
        adminNote: 'Full refund processed',
        items: {
          create: [
            {
              productId: products[5].id,
              productName: products[5].name,
              sku: products[5].sku,
              price: 449.99,
              quantity: 1,
              subtotal: 449.99,
              taxAmount: 40.49,
              totalAmount: 490.48,
            },
          ],
        },
      },
    }),
    // Multiple items order
    prisma.order.create({
      data: {
        storeId: stores[0].id,
        customerId: customers[1].id,
        orderNumber: 'ORD-00007',
        status: OrderStatus.PROCESSING,
        subtotal: 1184.98,
        taxAmount: 106.64,
        shippingAmount: 15.00,
        discountAmount: 100.00,
        totalAmount: 1206.62,
        discountCode: 'BULK100',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentGateway: PaymentGateway.STRIPE,
        paymentStatus: PaymentStatus.PAID,
        shippingMethod: 'Express Shipping',
        shippingAddress,
        billingAddress,
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              sku: products[0].sku,
              price: 999.99,
              quantity: 1,
              subtotal: 999.99,
              taxAmount: 89.99,
              discountAmount: 50.00,
              totalAmount: 1039.98,
            },
            {
              productId: products[4].id,
              productName: products[4].name,
              sku: products[4].sku,
              price: 199.99,
              quantity: 1,
              subtotal: 199.99,
              taxAmount: 17.99,
              discountAmount: 50.00,
              totalAmount: 167.98,
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${orders.length} orders`);

  // Create 10 reviews
  console.log('⭐ Creating reviews...');
  const reviews = await Promise.all(
    Array.from({ length: 10 }).map(async (_, index) => {
      const productIndex = index % products.length;
      const customerIndex = index % customers.length;
      const rating = (index % 5) + 1; // 1-5 stars

      return prisma.review.create({
        data: {
          storeId: stores[0].id,
          productId: products[productIndex].id,
          customerId: customers[customerIndex].id,
          rating,
          title:
            [
              'Great product!',
              'Highly recommend',
              'Good value for money',
              'Fast shipping',
              'Not as expected',
              'Excellent quality',
              'Perfect fit',
              'Amazing deal',
              'Disappointed',
              'Worth buying',
            ][index % 10],
          comment:
            [
              'This product exceeded my expectations. Great quality and fast shipping!',
              'Very satisfied with my purchase. Would buy again.',
              'Good product for the price. Delivery was quick.',
              'Exactly as described. Highly satisfied.',
              'Not quite what I expected but still decent.',
              'Outstanding product quality. Highly recommend.',
              'Perfect fit and great comfort.',
              'Amazing deal on this product.',
              'Arrived damaged, disappointed.',
              'Best purchase I made this month!',
            ][index % 10],
          isVerifiedPurchase: Math.random() > 0.3,
          isApproved: true,
        },
      });
    })
  );
  console.log(`✅ Created ${reviews.length} reviews`);

  // Update customer statistics
  console.log('📊 Updating customer statistics...');
  for (const customer of customers) {
    const customerOrders = await prisma.order.findMany({
      where: { customerId: customer.id, status: { not: OrderStatus.CANCELED } },
    });
    
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = customerOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrder = customerOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderAt: lastOrder?.createdAt,
      },
    });
  }
  console.log('✅ Updated customer statistics');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 10 (1 Owner + 1 Super Admin + 6 Staff + 2 Customers)`);
  console.log(`   - Organizations: ${organizations.length}`);
  console.log(`   - Stores: ${stores.length} (ID: ${stores[0].id})`);
  console.log(`   - Store Staff Assignments: 6`);
  console.log(`   - Categories: 3`);
  console.log(`   - Brands: 3`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length} (2 registered + 3 guests)`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Reviews: ${reviews.length}`);
  console.log('\n🔑 Test Credentials:');
  console.log(`\n   🏢 Organization Owner:`);
  console.log(`   Email: test@example.com`);
  console.log(`   Password: Test123!@#`);
  console.log(`   Role: OWNER`);
  console.log(`   Access: Full organization control`);
  console.log(`\n   👑 Super Admin (Platform):`);
  console.log(`   Email: superadmin@example.com`);
  console.log(`   Password: SuperAdmin123!@#`);
  console.log(`   Role: SUPER_ADMIN`);
  console.log(`   Access: ALL (Platform-wide)`);
  console.log(`\n   🏪 Store Admin:`);
  console.log(`   Email: storeadmin@example.com`);
  console.log(`   Password: StoreAdmin123!@#`);
  console.log(`   Role: STORE_ADMIN`);
  console.log(`   Access: Full store control`);
  console.log(`\n   💼 Sales Manager:`);
  console.log(`   Email: sales@example.com`);
  console.log(`   Password: Sales123!@#`);
  console.log(`   Role: SALES_MANAGER`);
  console.log(`   Access: Orders, customers, sales reports`);
  console.log(`\n   📦 Inventory Manager:`);
  console.log(`   Email: inventory@example.com`);
  console.log(`   Password: Inventory123!@#`);
  console.log(`   Role: INVENTORY_MANAGER`);
  console.log(`   Access: Products, inventory, stock management`);
  console.log(`\n   🎧 Customer Service:`);
  console.log(`   Email: support@example.com`);
  console.log(`   Password: Support123!@#`);
  console.log(`   Role: CUSTOMER_SERVICE`);
  console.log(`   Access: Customers, support tickets, orders (view)`);
  console.log(`\n   ✍️  Content Manager:`);
  console.log(`   Email: content@example.com`);
  console.log(`   Password: Content123!@#`);
  console.log(`   Role: CONTENT_MANAGER`);
  console.log(`   Access: Product content, categories, descriptions`);
  console.log(`\n   📢 Marketing Manager:`);
  console.log(`   Email: marketing@example.com`);
  console.log(`   Password: Marketing123!@#`);
  console.log(`   Role: MARKETING_MANAGER`);
  console.log(`   Access: Campaigns, analytics, customer insights`);
  console.log(`\n   🛍️  Customer (Registered #1):`);
  console.log(`   Email: customer1@example.com`);
  console.log(`   Password: Customer123!@#`);
  console.log(`   Role: CUSTOMER`);
  console.log(`   Access: Browse, order, manage profile, track orders`);
  console.log(`\n   🛍️  Customer (Registered #2):`);
  console.log(`   Email: customer2@example.com`);
  console.log(`   Password: Customer123!@#`);
  console.log(`   Role: CUSTOMER`);
  console.log(`   Access: Browse, order, manage profile, track orders`);
  console.log(`\n   Store ID: ${stores[0].id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
