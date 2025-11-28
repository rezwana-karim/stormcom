import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, PaymentGateway, InventoryStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
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

  // Create test user with password
  console.log('👤 Creating test user...');
  const passwordHash = await bcrypt.hash('Test123!@#', 10);
  const user = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8a', // Fixed user ID
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: new Date(),
      passwordHash,
    },
  });
  console.log(`✅ Created user: ${user.email}`);

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

  // Create organization
  console.log('🏢 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8b', // Fixed org ID
      name: 'Demo Company',
      slug: 'demo-company',
      image: null,
    },
  });
  console.log(`✅ Created organization: ${organization.name}`);

  // Create membership
  console.log('👥 Creating membership...');
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'OWNER',
    },
  });
  console.log('✅ Created membership');

  // Create store with the exact CUID used in StoreSelector
  console.log('🏪 Creating store...');
  const store = await prisma.store.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8r', // EXACT CUID from StoreSelector
      organizationId: organization.id,
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
  });
  console.log(`✅ Created store: ${store.name} (ID: ${store.id})`);

  // Create additional staff members with different roles
  console.log('👥 Creating staff members with various roles...');
  
  // Sales Manager
  const salesManagerHash = await bcrypt.hash('Sales123!@#', 12);
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
  const inventoryManagerHash = await bcrypt.hash('Inventory123!@#', 12);
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
  const customerServiceHash = await bcrypt.hash('Support123!@#', 12);
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
  const contentManagerHash = await bcrypt.hash('Content123!@#', 12);
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
  const marketingManagerHash = await bcrypt.hash('Marketing123!@#', 12);
  const marketingManager = await prisma.user.create({
    data: {
      email: 'marketing@example.com',
      name: 'Marketing Manager',
      emailVerified: new Date(),
      passwordHash: marketingManagerHash,
    },
  });
  console.log(`✅ Created Marketing Manager: ${marketingManager.email}`);
  
  // Assign Store Admin to store
  console.log('👥 Assigning staff to store...');
  await prisma.storeStaff.create({
    data: {
      userId: storeAdmin.id,
      storeId: store.id,
      role: 'STORE_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Assigned Store Admin to Demo Store');
  
  // Assign Sales Manager
  await prisma.storeStaff.create({
    data: {
      userId: salesManager.id,
      storeId: store.id,
      role: 'SALES_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Sales Manager to Demo Store');
  
  // Assign Inventory Manager
  await prisma.storeStaff.create({
    data: {
      userId: inventoryManager.id,
      storeId: store.id,
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Inventory Manager to Demo Store');
  
  // Assign Customer Service
  await prisma.storeStaff.create({
    data: {
      userId: customerService.id,
      storeId: store.id,
      role: 'CUSTOMER_SERVICE',
      isActive: true,
    },
  });
  console.log('✅ Assigned Customer Service to Demo Store');
  
  // Assign Content Manager
  await prisma.storeStaff.create({
    data: {
      userId: contentManager.id,
      storeId: store.id,
      role: 'CONTENT_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Content Manager to Demo Store');
  
  // Assign Marketing Manager
  await prisma.storeStaff.create({
    data: {
      userId: marketingManager.id,
      storeId: store.id,
      role: 'MARKETING_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Assigned Marketing Manager to Demo Store');

  // Create categories
  console.log('📂 Creating categories...');
  const electronicsCategory = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      isPublished: true,
      sortOrder: 1,
    },
  });

  const clothingCategory = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      isPublished: true,
      sortOrder: 2,
    },
  });

  const accessoriesCategory = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Accessories',
      slug: 'accessories',
      description: 'Fashion accessories and extras',
      isPublished: true,
      sortOrder: 3,
    },
  });
  console.log('✅ Created 3 categories');

  // Create brands
  console.log('🏷️ Creating brands...');
  const appleBrand = await prisma.brand.create({
    data: {
      storeId: store.id,
      name: 'Apple',
      slug: 'apple',
      description: 'Premium technology products',
      website: 'https://apple.com',
      isPublished: true,
    },
  });

  const nikeBrand = await prisma.brand.create({
    data: {
      storeId: store.id,
      name: 'Nike',
      slug: 'nike',
      description: 'Athletic apparel and footwear',
      website: 'https://nike.com',
      isPublished: true,
    },
  });

  const samsungBrand = await prisma.brand.create({
    data: {
      storeId: store.id,
      name: 'Samsung',
      slug: 'samsung',
      description: 'Consumer electronics',
      website: 'https://samsung.com',
      isPublished: true,
    },
  });
  console.log('✅ Created 3 brands');

  // Create products
  console.log('📦 Creating products...');
  const products = await Promise.all([
    // Electronics - Active
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: electronicsCategory.id,
        brandId: appleBrand.id,
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Latest iPhone with A17 Pro chip and titanium design',
        shortDescription: 'Premium smartphone',
        price: 999.99,
        compareAtPrice: 1099.99,
        costPrice: 750.00,
        sku: 'AAPL-IPH15P-001',
        barcode: '194253000000',
        trackInventory: true,
        inventoryQty: 50,
        lowStockThreshold: 10,
        inventoryStatus: InventoryStatus.IN_STOCK,
        images: JSON.stringify(['/products/iphone-15-pro.jpg']),
        thumbnailUrl: '/products/iphone-15-pro-thumb.jpg',
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: electronicsCategory.id,
        brandId: samsungBrand.id,
        name: 'Samsung Galaxy S24',
        slug: 'samsung-galaxy-s24',
        description: 'Flagship Android phone with AI features',
        shortDescription: 'AI-powered smartphone',
        price: 899.99,
        compareAtPrice: 999.99,
        costPrice: 650.00,
        sku: 'SAMS-GAL24-001',
        barcode: '887276000000',
        trackInventory: true,
        inventoryQty: 35,
        lowStockThreshold: 10,
        inventoryStatus: InventoryStatus.IN_STOCK,
        images: JSON.stringify(['/products/galaxy-s24.jpg']),
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    // Clothing - Active
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: clothingCategory.id,
        brandId: nikeBrand.id,
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        description: 'Comfortable running shoes with Max Air cushioning',
        shortDescription: 'Running shoes',
        price: 150.00,
        compareAtPrice: 180.00,
        costPrice: 80.00,
        sku: 'NIKE-AM270-001',
        barcode: '193151000000',
        trackInventory: true,
        inventoryQty: 120,
        lowStockThreshold: 20,
        inventoryStatus: InventoryStatus.IN_STOCK,
        images: JSON.stringify(['/products/air-max-270.jpg']),
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
        isFeatured: false,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: clothingCategory.id,
        brandId: nikeBrand.id,
        name: 'Nike Dri-FIT T-Shirt',
        slug: 'nike-dri-fit-tshirt',
        description: 'Moisture-wicking athletic t-shirt',
        shortDescription: 'Athletic t-shirt',
        price: 35.00,
        costPrice: 15.00,
        sku: 'NIKE-DFT-001',
        trackInventory: true,
        inventoryQty: 200,
        lowStockThreshold: 30,
        inventoryStatus: InventoryStatus.IN_STOCK,
        images: JSON.stringify(['/products/dri-fit-tshirt.jpg']),
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
      },
    }),
    // Low stock product
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: accessoriesCategory.id,
        name: 'Wireless Earbuds Pro',
        slug: 'wireless-earbuds-pro',
        description: 'Premium wireless earbuds with noise cancellation',
        price: 199.99,
        costPrice: 100.00,
        sku: 'EARBUD-PRO-001',
        trackInventory: true,
        inventoryQty: 8,
        lowStockThreshold: 10,
        inventoryStatus: InventoryStatus.LOW_STOCK,
        images: JSON.stringify(['/products/earbuds.jpg']),
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
      },
    }),
    // Out of stock product
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: accessoriesCategory.id,
        name: 'Smart Watch Ultra',
        slug: 'smart-watch-ultra',
        description: 'Advanced fitness tracking smartwatch',
        price: 449.99,
        compareAtPrice: 499.99,
        costPrice: 250.00,
        sku: 'WATCH-ULT-001',
        trackInventory: true,
        inventoryQty: 0,
        lowStockThreshold: 5,
        inventoryStatus: InventoryStatus.OUT_OF_STOCK,
        images: JSON.stringify(['/products/smart-watch.jpg']),
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
      },
    }),
    // Draft product (not published)
    prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: electronicsCategory.id,
        brandId: appleBrand.id,
        name: 'MacBook Pro 16"',
        slug: 'macbook-pro-16',
        description: 'Coming soon - Professional laptop',
        price: 2499.99,
        costPrice: 1800.00,
        sku: 'AAPL-MBP16-001',
        trackInventory: true,
        inventoryQty: 0,
        inventoryStatus: InventoryStatus.OUT_OF_STOCK,
        images: JSON.stringify(['/products/macbook-pro.jpg']),
        status: ProductStatus.DRAFT,
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // Create customers
  console.log('👨‍👩‍👧‍👦 Creating customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        storeId: store.id,
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0101',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: store.id,
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0102',
        acceptsMarketing: false,
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: store.id,
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1-555-0103',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: store.id,
        email: 'alice.johnson@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1-555-0104',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: store.id,
        email: 'charlie.brown@example.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        phone: '+1-555-0105',
        acceptsMarketing: false,
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

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
        storeId: store.id,
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
        storeId: store.id,
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
        storeId: store.id,
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
        storeId: store.id,
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
        storeId: store.id,
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
        storeId: store.id,
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
        storeId: store.id,
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
  console.log(`   - Users: 8 (1 Owner + 1 Super Admin + 6 Staff Members)`);
  console.log(`   - Organizations: 1`);
  console.log(`   - Stores: 1 (ID: ${store.id})`);
  console.log(`   - Store Staff Assignments: 6`);
  console.log(`   - Categories: 3`);
  console.log(`   - Brands: 3`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Orders: ${orders.length}`);
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
  console.log(`\n   Store ID: ${store.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
