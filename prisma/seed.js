"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var passwordHash, user, organization, store, electronicsCategory, clothingCategory, accessoriesCategory, appleBrand, nikeBrand, samsungBrand, products, customers, shippingAddress, billingAddress, orders, _i, customers_1, customer, customerOrders, totalSpent, totalOrders, averageOrderValue, lastOrder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seeding...');
                    // Clean existing data (in reverse order of dependencies)
                    console.log('🧹 Cleaning existing data...');
                    return [4 /*yield*/, prisma.orderItem.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.order.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.review.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.customer.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.productAttributeValue.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.productVariant.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.product.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.category.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.brand.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.store.deleteMany()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, prisma.projectMember.deleteMany()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, prisma.project.deleteMany()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, prisma.membership.deleteMany()];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, prisma.organization.deleteMany()];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, prisma.session.deleteMany()];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, prisma.account.deleteMany()];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 17:
                    _a.sent();
                    // Create test user with password
                    console.log('👤 Creating test user...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('Test123!@#', 10)];
                case 18:
                    passwordHash = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                id: 'clqm1j4k00000l8dw8z8r8z8a', // Fixed user ID
                                email: 'test@example.com',
                                name: 'Test User',
                                emailVerified: new Date(),
                                passwordHash: passwordHash,
                            },
                        })];
                case 19:
                    user = _a.sent();
                    console.log("\u2705 Created user: ".concat(user.email));
                    // Create organization
                    console.log('🏢 Creating organization...');
                    return [4 /*yield*/, prisma.organization.create({
                            data: {
                                id: 'clqm1j4k00000l8dw8z8r8z8b', // Fixed org ID
                                name: 'Demo Company',
                                slug: 'demo-company',
                                image: null,
                            },
                        })];
                case 20:
                    organization = _a.sent();
                    console.log("\u2705 Created organization: ".concat(organization.name));
                    // Create membership
                    console.log('👥 Creating membership...');
                    return [4 /*yield*/, prisma.membership.create({
                            data: {
                                userId: user.id,
                                organizationId: organization.id,
                                role: 'OWNER',
                            },
                        })];
                case 21:
                    _a.sent();
                    console.log('✅ Created membership');
                    // Create store with the exact CUID used in StoreSelector
                    console.log('🏪 Creating store...');
                    return [4 /*yield*/, prisma.store.create({
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
                                subscriptionPlan: client_1.SubscriptionPlan.PRO,
                                subscriptionStatus: client_1.SubscriptionStatus.ACTIVE,
                                productLimit: 1000,
                                orderLimit: 10000,
                            },
                        })];
                case 22:
                    store = _a.sent();
                    console.log("\u2705 Created store: ".concat(store.name, " (ID: ").concat(store.id, ")"));
                    // Create categories
                    console.log('📂 Creating categories...');
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                storeId: store.id,
                                name: 'Electronics',
                                slug: 'electronics',
                                description: 'Electronic devices and gadgets',
                                isPublished: true,
                                sortOrder: 1,
                            },
                        })];
                case 23:
                    electronicsCategory = _a.sent();
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                storeId: store.id,
                                name: 'Clothing',
                                slug: 'clothing',
                                description: 'Fashion and apparel',
                                isPublished: true,
                                sortOrder: 2,
                            },
                        })];
                case 24:
                    clothingCategory = _a.sent();
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                storeId: store.id,
                                name: 'Accessories',
                                slug: 'accessories',
                                description: 'Fashion accessories and extras',
                                isPublished: true,
                                sortOrder: 3,
                            },
                        })];
                case 25:
                    accessoriesCategory = _a.sent();
                    console.log('✅ Created 3 categories');
                    // Create brands
                    console.log('🏷️ Creating brands...');
                    return [4 /*yield*/, prisma.brand.create({
                            data: {
                                storeId: store.id,
                                name: 'Apple',
                                slug: 'apple',
                                description: 'Premium technology products',
                                website: 'https://apple.com',
                                isPublished: true,
                            },
                        })];
                case 26:
                    appleBrand = _a.sent();
                    return [4 /*yield*/, prisma.brand.create({
                            data: {
                                storeId: store.id,
                                name: 'Nike',
                                slug: 'nike',
                                description: 'Athletic apparel and footwear',
                                website: 'https://nike.com',
                                isPublished: true,
                            },
                        })];
                case 27:
                    nikeBrand = _a.sent();
                    return [4 /*yield*/, prisma.brand.create({
                            data: {
                                storeId: store.id,
                                name: 'Samsung',
                                slug: 'samsung',
                                description: 'Consumer electronics',
                                website: 'https://samsung.com',
                                isPublished: true,
                            },
                        })];
                case 28:
                    samsungBrand = _a.sent();
                    console.log('✅ Created 3 brands');
                    // Create products
                    console.log('📦 Creating products...');
                    return [4 /*yield*/, Promise.all([
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
                                    inventoryStatus: client_1.InventoryStatus.IN_STOCK,
                                    images: JSON.stringify(['/products/iphone-15-pro.jpg']),
                                    thumbnailUrl: '/products/iphone-15-pro-thumb.jpg',
                                    status: client_1.ProductStatus.ACTIVE,
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
                                    inventoryStatus: client_1.InventoryStatus.IN_STOCK,
                                    images: JSON.stringify(['/products/galaxy-s24.jpg']),
                                    status: client_1.ProductStatus.ACTIVE,
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
                                    inventoryStatus: client_1.InventoryStatus.IN_STOCK,
                                    images: JSON.stringify(['/products/air-max-270.jpg']),
                                    status: client_1.ProductStatus.ACTIVE,
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
                                    inventoryStatus: client_1.InventoryStatus.IN_STOCK,
                                    images: JSON.stringify(['/products/dri-fit-tshirt.jpg']),
                                    status: client_1.ProductStatus.ACTIVE,
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
                                    inventoryStatus: client_1.InventoryStatus.LOW_STOCK,
                                    images: JSON.stringify(['/products/earbuds.jpg']),
                                    status: client_1.ProductStatus.ACTIVE,
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
                                    inventoryStatus: client_1.InventoryStatus.OUT_OF_STOCK,
                                    images: JSON.stringify(['/products/smart-watch.jpg']),
                                    status: client_1.ProductStatus.ACTIVE,
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
                                    inventoryStatus: client_1.InventoryStatus.OUT_OF_STOCK,
                                    images: JSON.stringify(['/products/macbook-pro.jpg']),
                                    status: client_1.ProductStatus.DRAFT,
                                },
                            }),
                        ])];
                case 29:
                    products = _a.sent();
                    console.log("\u2705 Created ".concat(products.length, " products"));
                    // Create customers
                    console.log('👨‍👩‍👧‍👦 Creating customers...');
                    return [4 /*yield*/, Promise.all([
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
                        ])];
                case 30:
                    customers = _a.sent();
                    console.log("\u2705 Created ".concat(customers.length, " customers"));
                    // Create orders with different statuses
                    console.log('🛒 Creating orders...');
                    shippingAddress = JSON.stringify({
                        firstName: 'John',
                        lastName: 'Doe',
                        address: '123 Main Street',
                        city: 'San Francisco',
                        state: 'CA',
                        postalCode: '94102',
                        country: 'US',
                        phone: '+1-555-0101',
                    });
                    billingAddress = shippingAddress;
                    return [4 /*yield*/, Promise.all([
                            // PENDING order
                            prisma.order.create({
                                data: {
                                    storeId: store.id,
                                    customerId: customers[0].id,
                                    orderNumber: 'ORD-00001',
                                    status: client_1.OrderStatus.PENDING,
                                    subtotal: 999.99,
                                    taxAmount: 89.99,
                                    shippingAmount: 10.00,
                                    discountAmount: 0,
                                    totalAmount: 1099.98,
                                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.PENDING,
                                    shippingMethod: 'Standard Shipping',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                                    status: client_1.OrderStatus.PAID,
                                    subtotal: 899.99,
                                    taxAmount: 80.99,
                                    shippingAmount: 15.00,
                                    discountAmount: 50.00,
                                    totalAmount: 945.98,
                                    discountCode: 'SAVE50',
                                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.PAID,
                                    shippingMethod: 'Express Shipping',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                                    status: client_1.OrderStatus.PROCESSING,
                                    subtotal: 335.00,
                                    taxAmount: 30.15,
                                    shippingAmount: 10.00,
                                    discountAmount: 0,
                                    totalAmount: 375.15,
                                    paymentMethod: client_1.PaymentMethod.DEBIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.PAID,
                                    shippingMethod: 'Standard Shipping',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                                    status: client_1.OrderStatus.SHIPPED,
                                    subtotal: 199.99,
                                    taxAmount: 17.99,
                                    shippingAmount: 10.00,
                                    discountAmount: 0,
                                    totalAmount: 227.98,
                                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.PAID,
                                    shippingMethod: 'Standard Shipping',
                                    trackingNumber: 'TRACK123456789',
                                    trackingUrl: 'https://tracking.example.com/TRACK123456789',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                                    status: client_1.OrderStatus.DELIVERED,
                                    subtotal: 150.00,
                                    taxAmount: 13.50,
                                    shippingAmount: 10.00,
                                    discountAmount: 0,
                                    totalAmount: 173.50,
                                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.PAID,
                                    shippingMethod: 'Express Shipping',
                                    trackingNumber: 'TRACK987654321',
                                    trackingUrl: 'https://tracking.example.com/TRACK987654321',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                                    status: client_1.OrderStatus.CANCELED,
                                    subtotal: 449.99,
                                    taxAmount: 40.49,
                                    shippingAmount: 10.00,
                                    discountAmount: 0,
                                    totalAmount: 500.48,
                                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.REFUNDED,
                                    shippingMethod: 'Standard Shipping',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                                    status: client_1.OrderStatus.PROCESSING,
                                    subtotal: 1184.98,
                                    taxAmount: 106.64,
                                    shippingAmount: 15.00,
                                    discountAmount: 100.00,
                                    totalAmount: 1206.62,
                                    discountCode: 'BULK100',
                                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                                    paymentGateway: client_1.PaymentGateway.STRIPE,
                                    paymentStatus: client_1.PaymentStatus.PAID,
                                    shippingMethod: 'Express Shipping',
                                    shippingAddress: shippingAddress,
                                    billingAddress: billingAddress,
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
                        ])];
                case 31:
                    orders = _a.sent();
                    console.log("\u2705 Created ".concat(orders.length, " orders"));
                    // Update customer statistics
                    console.log('📊 Updating customer statistics...');
                    _i = 0, customers_1 = customers;
                    _a.label = 32;
                case 32:
                    if (!(_i < customers_1.length)) return [3 /*break*/, 36];
                    customer = customers_1[_i];
                    return [4 /*yield*/, prisma.order.findMany({
                            where: { customerId: customer.id, status: { not: client_1.OrderStatus.CANCELED } },
                        })];
                case 33:
                    customerOrders = _a.sent();
                    totalSpent = customerOrders.reduce(function (sum, order) { return sum + order.totalAmount; }, 0);
                    totalOrders = customerOrders.length;
                    averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
                    lastOrder = customerOrders.sort(function (a, b) { return b.createdAt.getTime() - a.createdAt.getTime(); })[0];
                    return [4 /*yield*/, prisma.customer.update({
                            where: { id: customer.id },
                            data: {
                                totalOrders: totalOrders,
                                totalSpent: totalSpent,
                                averageOrderValue: averageOrderValue,
                                lastOrderAt: lastOrder === null || lastOrder === void 0 ? void 0 : lastOrder.createdAt,
                            },
                        })];
                case 34:
                    _a.sent();
                    _a.label = 35;
                case 35:
                    _i++;
                    return [3 /*break*/, 32];
                case 36:
                    console.log('✅ Updated customer statistics');
                    console.log('\n🎉 Database seeding completed successfully!');
                    console.log('\n📊 Summary:');
                    console.log("   - Users: 1");
                    console.log("   - Organizations: 1");
                    console.log("   - Stores: 1 (ID: ".concat(store.id, ")"));
                    console.log("   - Categories: 3");
                    console.log("   - Brands: 3");
                    console.log("   - Products: ".concat(products.length));
                    console.log("   - Customers: ".concat(customers.length));
                    console.log("   - Orders: ".concat(orders.length));
                    console.log('\n🔑 Test Credentials:');
                    console.log("   Email: test@example.com");
                    console.log("   Password: Test123!@#");
                    console.log("   Store ID: ".concat(store.id));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
