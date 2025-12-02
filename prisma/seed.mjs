import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, PaymentGateway, InventoryStatus, SubscriptionPlan, SubscriptionStatus, Role } from '@prisma/client';
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

  // Create Super Admin user
  console.log('👑 Creating Super Admin...');
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin123!@#', 10);
  const superAdmin = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8s', // Fixed super admin ID
      email: 'superadmin@example.com',
      name: 'Super Admin',
      emailVerified: new Date(),
      passwordHash: superAdminPasswordHash,
      isSuperAdmin: true,
      accountStatus: 'APPROVED',
    },
  });
  console.log(`✅ Created Super Admin: ${superAdmin.email}`);

  // Create test users with different roles
  console.log('👤 Creating test users...');
  const passwordHash = await bcrypt.hash('Test123!@#', 10);
  
  const storeOwner = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8b',
      email: 'owner@example.com',
      name: 'Store Owner',
      emailVerified: new Date(),
      passwordHash,
      accountStatus: 'APPROVED',
    },
  });
  
  const storeAdmin = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8c',
      email: 'admin@example.com',
      name: 'Store Admin',
      emailVerified: new Date(),
      passwordHash,
      accountStatus: 'APPROVED',
    },
  });
  
  const storeMember = await prisma.user.create({
    data: {
      id: 'clqm1j4k00000l8dw8z8r8z8d',
      email: 'member@example.com',
      name: 'Store Member',
      emailVerified: new Date(),
      passwordHash,
      accountStatus: 'APPROVED',
    },
  });
  
  const users = [storeOwner, storeAdmin, storeMember];
  console.log(`✅ Created ${users.length} test users`);

  // Create 2 organizations
  console.log('🏢 Creating organizations...');
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Demo Company',
        slug: 'demo-company',
        image: null,
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Acme Corp',
        slug: 'acme-corp',
        image: null,
      },
    }),
  ]);
  console.log(`✅ Created ${organizations.length} organizations`);

  // Create memberships - users across organizations with different roles
  console.log('👥 Creating memberships...');
  await Promise.all([
    prisma.membership.create({
      data: {
        userId: users[0].id,
        organizationId: organizations[0].id,
        role: Role.OWNER,
      },
    }),
    prisma.membership.create({
      data: {
        userId: users[1].id,
        organizationId: organizations[0].id,
        role: Role.ADMIN,
      },
    }),
    prisma.membership.create({
      data: {
        userId: users[2].id,
        organizationId: organizations[0].id,
        role: Role.MEMBER,
      },
    }),
    prisma.membership.create({
      data: {
        userId: users[0].id,
        organizationId: organizations[1].id,
        role: Role.ADMIN,
      },
    }),
    prisma.membership.create({
      data: {
        userId: users[1].id,
        organizationId: organizations[1].id,
        role: Role.OWNER,
      },
    }),
  ]);
  console.log('✅ Created memberships');

  // Create 2 stores
  console.log('🏪 Creating stores...');
  const stores = await Promise.all([
    prisma.store.create({
      data: {
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
        description: 'Acme store for products and services',
        email: 'sales@acme-store.com',
        phone: '+1-555-0101',
        website: 'https://acme-store.example.com',
        address: '456 Commerce Avenue',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        currency: 'USD',
        timezone: 'America/New_York',
        locale: 'en',
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 500,
        orderLimit: 5000,
      },
    }),
  ]);
  console.log(`✅ Created ${stores.length} stores`);

  // Create 5 categories
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
  console.log('📦 Creating products...');
  const productData = [
    // Electronics (5)
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      categoryId: categories[0].id,
      brandId: brands[0].id,
      price: 999.99,
      sku: 'AAPL-IPH15P-001',
      description: 'Latest iPhone with A17 Pro chip',
      variants: [
        { name: 'Space Black 256GB', sku: 'AAPL-IPH15P-SB-256', price: 999.99 },
        { name: 'Silver 512GB', sku: 'AAPL-IPH15P-SV-512', price: 1099.99 },
      ],
    },
    {
      name: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      categoryId: categories[0].id,
      brandId: brands[2].id,
      price: 899.99,
      sku: 'SAM-GS24-001',
      description: 'Flagship Android smartphone',
      variants: [
        { name: 'Phantom Black', sku: 'SAM-GS24-PB', price: 899.99 },
        { name: 'Cobalt Blue', sku: 'SAM-GS24-CB', price: 899.99 },
      ],
    },
    {
      name: 'iPad Air',
      slug: 'ipad-air',
      categoryId: categories[0].id,
      brandId: brands[0].id,
      price: 599.99,
      sku: 'AAPL-IPAD-AIR-001',
      description: 'Powerful and colorful iPad',
      variants: [
        { name: 'Space Gray 256GB', sku: 'AAPL-IPAD-AIR-SG', price: 599.99 },
        { name: 'Blue 512GB', sku: 'AAPL-IPAD-AIR-BL', price: 699.99 },
      ],
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      slug: 'sony-wh1000xm5',
      categoryId: categories[0].id,
      brandId: brands[3].id,
      price: 399.99,
      sku: 'SONY-WH-XM5-001',
      description: 'Premium noise-canceling headphones',
      variants: [
        { name: 'Black', sku: 'SONY-WH-XM5-BK', price: 399.99 },
        { name: 'Silver', sku: 'SONY-WH-XM5-SV', price: 399.99 },
      ],
    },
    {
      name: 'Samsung 4K Smart TV 65"',
      slug: 'samsung-4k-tv-65',
      categoryId: categories[0].id,
      brandId: brands[2].id,
      price: 1299.99,
      sku: 'SAM-TV-65-001',
      description: '4K UHD Smart TV with Quantum Processor',
      variants: [
        { name: '65" QN90C', sku: 'SAM-TV-65-QN90C', price: 1299.99 },
      ],
    },
    // Clothing (4)
    {
      name: 'Nike Air Max 90',
      slug: 'nike-air-max-90',
      categoryId: categories[1].id,
      brandId: brands[1].id,
      price: 129.99,
      sku: 'NIKE-AM90-001',
      description: 'Classic Nike Air Max sneaker',
      variants: [
        { name: 'Size 10 White', sku: 'NIKE-AM90-W-10', price: 129.99 },
        { name: 'Size 11 Black', sku: 'NIKE-AM90-B-11', price: 129.99 },
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
      categoryId: categories[1].id,
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
      brandId: brands[3].id,
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
      categoryId: categories[2].id,
      price: 89.99,
      sku: 'BAG-TRAVEL-001',
      description: 'Spacious travel backpack',
      variants: [
        { name: 'Gray', sku: 'BAG-TRAVEL-GR', price: 89.99 },
      ],
    },
    // Home & Garden (2)
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
    // Sports (1)
    {
      name: 'Yoga Mat Pro',
      slug: 'yoga-mat-pro',
      categoryId: categories[4].id,
      price: 59.99,
      sku: 'YOGA-MAT-001',
      description: 'Premium non-slip yoga mat',
      variants: [
        { name: 'Purple 6mm', sku: 'YOGA-MAT-PUR', price: 59.99 },
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

      // Create variants
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
              options: JSON.stringify({ variant: v.name }),
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
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0101',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0102',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1-555-0103',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'alice.johnson@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1-555-0104',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'charlie.brown@example.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        phone: '+1-555-0105',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'diana.prince@example.com',
        firstName: 'Diana',
        lastName: 'Prince',
        phone: '+1-555-0106',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'evan.lee@example.com',
        firstName: 'Evan',
        lastName: 'Lee',
        phone: '+1-555-0107',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'fiona.green@example.com',
        firstName: 'Fiona',
        lastName: 'Green',
        phone: '+1-555-0108',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'george.martin@example.com',
        firstName: 'George',
        lastName: 'Martin',
        phone: '+1-555-0109',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'hannah.miller@example.com',
        firstName: 'Hannah',
        lastName: 'Miller',
        phone: '+1-555-0110',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'isaac.newton@example.com',
        firstName: 'Isaac',
        lastName: 'Newton',
        phone: '+1-555-0111',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'julia.roberts@example.com',
        firstName: 'Julia',
        lastName: 'Roberts',
        phone: '+1-555-0112',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'kevin.hart@example.com',
        firstName: 'Kevin',
        lastName: 'Hart',
        phone: '+1-555-0113',
        acceptsMarketing: false,
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'laura.palmer@example.com',
        firstName: 'Laura',
        lastName: 'Palmer',
        phone: '+1-555-0114',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: stores[0].id,
        email: 'michael.scott@example.com',
        firstName: 'Michael',
        lastName: 'Scott',
        phone: '+1-555-0115',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // Create 20 orders
  console.log('🛒 Creating orders...');
  const orderStatuses = [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELED];
  const paymentMethods = [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PAYPAL];
  const paymentStatuses = [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELED];

  const orders = await Promise.all(
    Array.from({ length: 20 }).map(async (_, index) => {
      const customer = customers[index % customers.length];
      const randomProducts = products.slice(index % 3, (index % 3) + 2);
      const orderTotal = randomProducts.reduce((sum) => sum + Math.random() * 500 + 50, 0);

      const order = await prisma.order.create({
        data: {
          storeId: stores[0].id,
          customerId: customer.id,
          orderNumber: `ORD-${String(index + 1).padStart(5, '0')}`,
          status: orderStatuses[index % orderStatuses.length],
          subtotal: Math.round(orderTotal * 100) / 100,
          taxAmount: Math.round((orderTotal * 0.1) * 100) / 100,
          shippingAmount: index % 3 === 0 ? 9.99 : index % 3 === 1 ? 0 : 19.99,
          discountAmount: index % 5 === 0 ? 20 : 0,
          totalAmount: Math.round((orderTotal + (index % 3 === 0 ? 9.99 : index % 3 === 1 ? 0 : 19.99)) * 100) / 100,
          paymentMethod: paymentMethods[index % paymentMethods.length],
          paymentGateway: PaymentGateway.STRIPE,
          paymentStatus: paymentStatuses[index % paymentStatuses.length],
          shippingAddress: JSON.stringify({
            firstName: customer.firstName,
            lastName: customer.lastName,
            address: `${123 + index} Main St`,
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
          }),
          billingAddress: JSON.stringify({
            firstName: customer.firstName,
            lastName: customer.lastName,
            address: `${123 + index} Main St`,
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
          }),
          customerNote: index % 4 === 0 ? 'Please leave at door' : null,
          items: {
            create: randomProducts.map((product, itemIndex) => ({
              productId: product.id,
              productName: product.name,
              sku: product.sku || '',
              price: Math.random() * 300 + 20,
              quantity: itemIndex + 1,
              subtotal: Math.random() * 300 + 20,
              taxAmount: Math.random() * 50,
              totalAmount: Math.random() * 500 + 100,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    })
  );
  console.log(`✅ Created ${orders.length} orders`);

  // Create 10 reviews
  console.log('⭐ Creating reviews...');
  const reviews = await Promise.all(
    Array.from({ length: 10 }).map(async (_, index) => {
      const productIndex = index % products.length;
      const customerIndex = index % customers.length;
      const rating = (index % 5) + 1;

      return prisma.review.create({
        data: {
          storeId: stores[0].id,
          productId: products[productIndex].id,
          customerId: customers[customerIndex].id,
          rating,
          title: [
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
          comment: [
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
          approvedAt: new Date(),
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
  console.log(`   - Users: 4 (including Super Admin)`);
  console.log(`   - Organizations: 2`);
  console.log(`   - Stores: 2 (Demo Store & Acme Store)`);
  console.log(`   - Categories: 5`);
  console.log(`   - Brands: 4`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log('\n🔑 Super Admin Credentials:');
  console.log(`   Email: superadmin@example.com`);
  console.log(`   Password: SuperAdmin123!@#`);
  console.log('\n🔑 Test User Credentials (Password: Test123!@#):');
  console.log(`   Owner: owner@example.com`);
  console.log(`   Admin: admin@example.com`);
  console.log(`   Member: member@example.com`);
  console.log(`   Primary Store ID: ${stores[0].id}`);
  console.log(`   Secondary Store ID: ${stores[1].id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
