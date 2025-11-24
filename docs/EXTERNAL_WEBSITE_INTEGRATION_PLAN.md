# External Website Integration Plan

**Project**: StormCom Multi-Vendor E-commerce SaaS  
**Feature**: Connect Existing Vendor Websites  
**Date**: November 25, 2025  
**Version**: 1.0

---

## 📋 Executive Summary

This document outlines the complete plan for allowing vendors to:
1. **Use pre-built templates** (hosted on StormCom platform)
2. **Connect their existing website** (WordPress, Shopify, custom sites)
3. **Manage everything from a single dashboard** (products, orders, inventory)

---

## 🎯 Use Cases

### Use Case 1: Vendor with NO Website
**Solution**: Use StormCom pre-built templates
- Choose from 5-10 professional templates
- Customize colors, logo, fonts via dashboard
- Hosted on `vendor-name.stormcom.app` subdomain
- Optional: Connect custom domain `vendor.com`

### Use Case 2: Vendor with Existing Website
**Solution**: Connect via API/Plugin
- Install StormCom plugin (WordPress, Shopify, WooCommerce)
- OR integrate via REST API (custom websites)
- Sync products, orders, inventory bidirectionally
- Manage from StormCom dashboard

### Use Case 3: Hybrid Approach
**Solution**: Multi-channel management
- Keep existing website running
- Add StormCom storefront as additional channel
- Facebook Shop + Instagram + Website
- Unified order management dashboard

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     STORMCOM PLATFORM                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           VENDOR DASHBOARD (Central Hub)                  │   │
│  │  - Product Management                                     │   │
│  │  - Order Management (All Channels)                        │   │
│  │  │  - Inventory Sync                                       │   │
│  │  - Integration Settings                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│              ┌────────────┼────────────┐                         │
│              │            │            │                         │
│              ▼            ▼            ▼                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Template   │  │  External   │  │  Multi-     │             │
│  │  Storefront │  │  Website    │  │  Channel    │             │
│  │  (Hosted)   │  │  Integration│  │  (FB/IG)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│       │                  │                  │                    │
└───────┼──────────────────┼──────────────────┼────────────────────┘
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
   StormCom          External Website    Social Media
   Subdomain         (vendor.com)        Platforms
```

---

## 🔌 Integration Methods

### Method 1: Pre-built Templates (Easiest)

#### Features
- ✅ No technical knowledge required
- ✅ Instant setup (5 minutes)
- ✅ Mobile-responsive
- ✅ SEO-optimized
- ✅ Hosted by StormCom (no hosting costs)

#### Dashboard Flow
```
Dashboard → Store Settings → Choose Template
         → Customize (Logo, Colors, Fonts)
         → Preview
         → Publish to vendor-name.stormcom.app
         → Optional: Connect custom domain
```

---

### Method 2: WordPress Plugin (Most Common)

#### WordPress Plugin Features
```typescript
// StormCom WordPress Plugin Architecture

class StormComSync {
  // Product Sync
  syncProducts()     // Push WP products to StormCom
  pullProducts()     // Pull StormCom products to WP
  
  // Order Sync
  createOrder()      // New WP order → StormCom
  updateOrderStatus() // Status updates both ways
  
  // Inventory Sync
  syncInventory()    // Real-time stock updates
  
  // Webhook Handlers
  handleProductUpdate()
  handleOrderUpdate()
  handleInventoryUpdate()
}
```

#### Dashboard Integration Settings
```
Dashboard → Integrations → WordPress
         → Enter WordPress Site URL
         → Generate API Key
         → Download Plugin
         → Install on WordPress
         → Activate & Connect
         → Choose Sync Options:
            □ Sync Products (One-way/Two-way)
            □ Sync Orders (One-way/Two-way)
            □ Sync Inventory (Real-time)
            □ Sync Customers
```

#### Installation Steps (Vendor View)
1. Go to StormCom Dashboard → Integrations
2. Click "Connect WordPress Website"
3. Download `stormcom-sync.zip` plugin
4. Upload to WordPress → Plugins → Add New
5. Activate plugin
6. Enter API credentials (auto-generated)
7. Click "Test Connection"
8. Choose sync settings
9. Click "Start Sync"

---

### Method 3: Shopify App (E-commerce Platform)

#### Shopify App Features
```javascript
// StormCom Shopify App

// OAuth Flow
app.get('/auth', async (req, res) => {
  const shopifyAuthUrl = buildShopifyAuthURL(req.query.shop);
  res.redirect(shopifyAuthUrl);
});

// Webhooks
app.post('/webhooks/products/create', async (req, res) => {
  const product = req.body;
  await syncToStormCom(product);
});

app.post('/webhooks/orders/create', async (req, res) => {
  const order = req.body;
  await createStormComOrder(order);
});

// Inventory Sync
app.post('/webhooks/inventory_levels/update', async (req, res) => {
  const inventory = req.body;
  await updateStormComInventory(inventory);
});
```

#### Dashboard Setup Flow
```
Dashboard → Integrations → Shopify
         → Click "Connect Shopify Store"
         → Enter Shopify Store URL (vendor.myshopify.com)
         → Redirect to Shopify for OAuth
         → Grant Permissions
         → Auto-sync starts
         → Configure sync rules
```

---

### Method 4: REST API (Custom Websites)

#### StormCom Public API Endpoints

```typescript
// Base URL: https://api.stormcom.app/v1

// Authentication
POST /auth/api-keys
  → Generate API key for external integration

// Products API
GET    /stores/{storeId}/products
POST   /stores/{storeId}/products
PUT    /stores/{storeId}/products/{id}
DELETE /stores/{storeId}/products/{id}

// Orders API
GET    /stores/{storeId}/orders
POST   /stores/{storeId}/orders
PUT    /stores/{storeId}/orders/{id}/status

// Inventory API
GET    /stores/{storeId}/inventory
PUT    /stores/{storeId}/inventory/{productId}

// Webhooks API
POST   /stores/{storeId}/webhooks
  → Register webhook URLs for events:
    - product.created
    - product.updated
    - order.created
    - order.updated
    - inventory.updated
```

#### Dashboard API Management
```
Dashboard → Integrations → Custom API
         → Generate API Key
         → Copy API Documentation
         → Set Webhook URLs:
            - Product Update URL
            - Order Update URL
            - Inventory Update URL
         → Test Endpoints
         → Enable Integration
```

#### Example: Custom Website Integration
```javascript
// External Website Code (vendor's existing site)

const STORMCOM_API_KEY = 'sk_live_abc123...';
const STORE_ID = 'store_xyz789';

// When customer places order on external site
async function createOrderOnExternalSite(orderData) {
  // 1. Process order locally
  const localOrder = await processLocalOrder(orderData);
  
  // 2. Send to StormCom
  const response = await fetch(`https://api.stormcom.app/v1/stores/${STORE_ID}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STORMCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderNumber: localOrder.id,
      email: orderData.customer.email,
      items: orderData.items.map(item => ({
        productId: item.stormcomProductId, // Map local ID to StormCom ID
        quantity: item.quantity,
        price: item.price,
      })),
      total: orderData.total,
      source: 'EXTERNAL_WEBSITE',
      sourceOrderId: localOrder.id,
    }),
  });
  
  const stormcomOrder = await response.json();
  
  // 3. Store StormCom order ID for future updates
  await saveStormComOrderId(localOrder.id, stormcomOrder.id);
}

// Listen for StormCom webhooks (order status updates)
app.post('/webhooks/stormcom/order-update', async (req, res) => {
  const { orderId, status, trackingNumber } = req.body;
  
  // Update local order
  await updateLocalOrderStatus(orderId, status, trackingNumber);
  
  res.json({ success: true });
});
```

---

## 📊 Database Schema Extensions

### Integration Models

```prisma
// Add to prisma/schema.prisma

// Website Integration Configuration
model WebsiteIntegration {
  id             String   @id @default(cuid())
  storeId        String   @unique
  store          Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Integration Type
  type           IntegrationType
  
  // Connection Details
  websiteUrl     String?  // External website URL
  apiKey         String?  // Generated for external site
  apiSecret      String?  // For signature verification
  
  // OAuth (for Shopify, WooCommerce)
  accessToken    String?
  refreshToken   String?
  expiresAt      DateTime?
  
  // Sync Settings
  syncProducts   Boolean  @default(true)
  syncOrders     Boolean  @default(true)
  syncInventory  Boolean  @default(true)
  syncCustomers  Boolean  @default(false)
  
  // Sync Direction
  productSyncDirection  SyncDirection @default(TWO_WAY)
  orderSyncDirection    SyncDirection @default(TO_STORMCOM)
  inventorySyncDirection SyncDirection @default(TWO_WAY)
  
  // Webhook URLs (for custom integrations)
  webhookUrl     String?
  webhookSecret  String?
  
  // Status
  isActive       Boolean  @default(true)
  lastSyncAt     DateTime?
  
  // Metadata
  platform       String?  // "wordpress", "shopify", "woocommerce", "custom"
  platformVersion String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  syncLogs       SyncLog[]
  productMappings ProductMapping[]
}

enum IntegrationType {
  TEMPLATE      // Using StormCom template
  WORDPRESS     // WordPress plugin
  SHOPIFY       // Shopify app
  WOOCOMMERCE   // WooCommerce plugin
  CUSTOM_API    // REST API integration
}

enum SyncDirection {
  TO_STORMCOM   // One-way: External → StormCom
  FROM_STORMCOM // One-way: StormCom → External
  TWO_WAY       // Bidirectional sync
}

// Product ID Mapping (for external integrations)
model ProductMapping {
  id             String   @id @default(cuid())
  integrationId  String
  integration    WebsiteIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  
  stormcomProductId String
  externalProductId String
  
  product        Product  @relation(fields: [stormcomProductId], references: [id], onDelete: Cascade)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([integrationId, externalProductId])
  @@index([stormcomProductId])
}

// Sync Activity Log
model SyncLog {
  id             String   @id @default(cuid())
  integrationId  String
  integration    WebsiteIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  
  action         SyncAction
  entityType     String   // "product", "order", "inventory"
  entityId       String?  // StormCom ID
  externalId     String?  // External platform ID
  
  status         SyncStatus
  errorMessage   String?
  
  // Metadata
  requestData    Json?
  responseData   Json?
  
  createdAt      DateTime @default(now())
  
  @@index([integrationId, createdAt])
}

enum SyncAction {
  CREATE
  UPDATE
  DELETE
  SYNC
}

enum SyncStatus {
  SUCCESS
  FAILED
  PENDING
  SKIPPED
}

// Template Configuration
model TemplateConfig {
  id             String   @id @default(cuid())
  storeId        String   @unique
  store          Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Template Selection
  templateId     String   // "modern-minimal", "classic-shop", etc.
  
  // Customization
  primaryColor   String   @default("#000000")
  secondaryColor String   @default("#666666")
  accentColor    String   @default("#007bff")
  
  fontFamily     String   @default("Inter")
  logoUrl        String?
  faviconUrl     String?
  
  // Layout Options
  headerLayout   String   @default("centered")
  footerLayout   String   @default("simple")
  productLayout  String   @default("grid")
  
  // Custom CSS
  customCSS      String?
  
  // SEO
  metaTitle      String?
  metaDescription String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// Add relations to existing Store model
model Store {
  // ...existing fields...
  
  websiteIntegration WebsiteIntegration?
  templateConfig     TemplateConfig?
  productMappings    ProductMapping[]
}

// Add relation to Product model
model Product {
  // ...existing fields...
  
  mappings       ProductMapping[]
}
```

---

## 🎨 Dashboard UI/UX Design

### Dashboard Navigation Structure

```
Dashboard (/)
├── Overview
├── Products
├── Orders
├── Customers
├── Analytics
├── 🆕 Website & Integrations
│   ├── Storefront Settings
│   │   ├── Use Template (Option 1)
│   │   └── Connect External Website (Option 2)
│   ├── Template Customization
│   │   ├── Choose Template
│   │   ├── Customize Design
│   │   │   ├── Colors
│   │   │   ├── Fonts
│   │   │   ├── Logo
│   │   │   └── Custom CSS
│   │   └── Preview & Publish
│   ├── External Website Setup
│   │   ├── WordPress
│   │   ├── Shopify
│   │   ├── WooCommerce
│   │   └── Custom API
│   ├── Domain Management
│   │   ├── Subdomain (vendor.stormcom.app)
│   │   └── Custom Domain (vendor.com)
│   ├── Sync Settings
│   │   ├── Product Sync Rules
│   │   ├── Order Sync Rules
│   │   ├── Inventory Sync
│   │   └── Sync Logs
│   └── Multi-Channel
│       ├── Facebook Shop
│       ├── Instagram Shopping
│       └── WhatsApp Business
└── Settings
```

---

## 🖥️ Dashboard Pages & Components

### Page 1: Website & Integrations Overview

```typescript
// File: src/app/dashboard/website/page.tsx

export default async function WebsiteIntegrationsPage() {
  const session = await getServerSession(authOptions);
  const store = await getStoreWithIntegration(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website & Integrations</h1>
          <p className="text-muted-foreground">
            Manage your storefront and connect external platforms
          </p>
        </div>
      </div>

      {/* Current Setup Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Setup</CardTitle>
        </CardHeader>
        <CardContent>
          {!store.websiteIntegration ? (
            <EmptyState />
          ) : (
            <CurrentSetupView integration={store.websiteIntegration} />
          )}
        </CardContent>
      </Card>

      {/* Setup Options */}
      <div className="grid gap-6 md:grid-cols-2">
        <SetupOptionCard
          title="Use Pre-built Template"
          description="Get started quickly with professional templates"
          icon={<IconTemplate />}
          href="/dashboard/website/templates"
          benefits={[
            "Instant setup (5 minutes)",
            "No coding required",
            "Mobile-responsive",
            "Free hosting",
          ]}
        />

        <SetupOptionCard
          title="Connect Existing Website"
          description="Integrate with WordPress, Shopify, or custom site"
          icon={<IconPlug />}
          href="/dashboard/website/integrations"
          benefits={[
            "Keep your current site",
            "Sync products & orders",
            "Unified management",
            "Multi-channel support",
          ]}
        />
      </div>

      {/* Integration Status Cards */}
      {store.websiteIntegration && (
        <IntegrationStatusCards integration={store.websiteIntegration} />
      )}

      {/* Recent Sync Activity */}
      {store.websiteIntegration && (
        <RecentSyncActivity storeId={store.id} />
      )}
    </div>
  );
}
```

---

### Page 2: Template Selection & Customization

```typescript
// File: src/app/dashboard/website/templates/page.tsx

export default async function TemplatesPage() {
  const templates = await getAvailableTemplates();
  const store = await getCurrentStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Choose Your Template</h1>
        <p className="text-muted-foreground">
          Select a template and customize it to match your brand
        </p>
      </div>

      {/* Template Gallery */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isActive={store.templateConfig?.templateId === template.id}
            onSelect={() => selectTemplate(template.id)}
            onPreview={() => openPreview(template.id)}
          />
        ))}
      </div>

      {/* Customization Panel (if template selected) */}
      {store.templateConfig && (
        <TemplateCustomizer
          config={store.templateConfig}
          onUpdate={updateTemplateConfig}
        />
      )}
    </div>
  );
}

// Template Customizer Component
function TemplateCustomizer({ config, onUpdate }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="design">
          <TabsList>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-4">
            {/* Logo Upload */}
            <div>
              <Label>Logo</Label>
              <ImageUpload
                value={config.logoUrl}
                onChange={(url) => onUpdate({ logoUrl: url })}
              />
            </div>

            {/* Color Pickers */}
            <div>
              <Label>Primary Color</Label>
              <ColorPicker
                value={config.primaryColor}
                onChange={(color) => onUpdate({ primaryColor: color })}
              />
            </div>

            <div>
              <Label>Secondary Color</Label>
              <ColorPicker
                value={config.secondaryColor}
                onChange={(color) => onUpdate({ secondaryColor: color })}
              />
            </div>

            {/* Font Selection */}
            <div>
              <Label>Font Family</Label>
              <Select
                value={config.fontFamily}
                onValueChange={(font) => onUpdate({ fontFamily: font })}
              >
                <SelectOption value="Inter">Inter</SelectOption>
                <SelectOption value="Roboto">Roboto</SelectOption>
                <SelectOption value="Poppins">Poppins</SelectOption>
              </Select>
            </div>

            {/* Layout Options */}
            <div>
              <Label>Header Layout</Label>
              <RadioGroup
                value={config.headerLayout}
                onValueChange={(layout) => onUpdate({ headerLayout: layout })}
              >
                <RadioOption value="centered">Centered</RadioOption>
                <RadioOption value="left-aligned">Left Aligned</RadioOption>
                <RadioOption value="minimal">Minimal</RadioOption>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {/* Homepage Sections */}
            <HomepageSectionEditor config={config} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Input
              label="Meta Title"
              value={config.metaTitle}
              onChange={(e) => onUpdate({ metaTitle: e.target.value })}
            />
            <Textarea
              label="Meta Description"
              value={config.metaDescription}
              onChange={(e) => onUpdate({ metaDescription: e.target.value })}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label>Custom CSS</Label>
              <CodeEditor
                language="css"
                value={config.customCSS}
                onChange={(css) => onUpdate({ customCSS: css })}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview & Publish Buttons */}
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={openLivePreview}>
            <IconEye className="mr-2 size-4" />
            Preview
          </Button>
          <Button onClick={publishTemplate}>
            <IconRocket className="mr-2 size-4" />
            Publish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Page 3: External Website Integration Setup

```typescript
// File: src/app/dashboard/website/integrations/page.tsx

export default async function IntegrationsPage() {
  const store = await getCurrentStore();
  const integration = store.websiteIntegration;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Your Website</h1>
        <p className="text-muted-foreground">
          Integrate with WordPress, Shopify, or any custom platform
        </p>
      </div>

      {/* Integration Type Selection */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <IntegrationTypeCard
          type="WORDPRESS"
          title="WordPress"
          description="WooCommerce or regular WordPress site"
          icon={<IconBrandWordpress />}
          isConnected={integration?.type === "WORDPRESS"}
          onClick={() => startWordPressSetup()}
        />

        <IntegrationTypeCard
          type="SHOPIFY"
          title="Shopify"
          description="Connect your Shopify store"
          icon={<IconBrandShopify />}
          isConnected={integration?.type === "SHOPIFY"}
          onClick={() => startShopifySetup()}
        />

        <IntegrationTypeCard
          type="WOOCOMMERCE"
          title="WooCommerce"
          description="Dedicated WooCommerce plugin"
          icon={<IconShoppingCart />}
          isConnected={integration?.type === "WOOCOMMERCE"}
          onClick={() => startWooCommerceSetup()}
        />

        <IntegrationTypeCard
          type="CUSTOM_API"
          title="Custom API"
          description="REST API for any platform"
          icon={<IconCode />}
          isConnected={integration?.type === "CUSTOM_API"}
          onClick={() => startCustomAPISetup()}
        />
      </div>

      {/* Active Integration Settings */}
      {integration && (
        <ActiveIntegrationPanel integration={integration} />
      )}
    </div>
  );
}

// WordPress Setup Dialog
function WordPressSetupDialog({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect WordPress Website</DialogTitle>
          <DialogDescription>
            Follow these steps to connect your WordPress site
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>WordPress Website URL</Label>
              <Input
                placeholder="https://yoursite.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <Alert>
              <IconInfoCircle className="size-4" />
              <AlertTitle>Requirements</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  <li>WordPress 5.0 or higher</li>
                  <li>PHP 7.4 or higher</li>
                  <li>WooCommerce (optional)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={() => setStep(2)} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Download & Install Plugin</Label>
              <Button onClick={downloadPlugin} variant="outline" className="w-full mt-2">
                <IconDownload className="mr-2 size-4" />
                Download StormCom Plugin
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="font-semibold mb-2">Installation Steps:</p>
              <ol className="list-decimal pl-4 space-y-2 text-sm">
                <li>Download the plugin ZIP file above</li>
                <li>Go to WordPress Admin → Plugins → Add New</li>
                <li>Click "Upload Plugin" and select the ZIP file</li>
                <li>Activate the plugin</li>
                <li>Go to StormCom → Settings</li>
                <li>Enter the API credentials below</li>
              </ol>
            </div>

            <div>
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input value={generatedApiKey} readOnly />
                <Button variant="outline" onClick={copyApiKey}>
                  <IconCopy className="size-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>API Secret</Label>
              <div className="flex gap-2">
                <Input value={generatedApiSecret} type="password" readOnly />
                <Button variant="outline" onClick={copyApiSecret}>
                  <IconCopy className="size-4" />
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep(3)} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <IconCheck className="size-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Connection Successful!</h3>
              <p className="text-muted-foreground">
                Your WordPress site is now connected
              </p>
            </div>

            <SyncSettingsForm onComplete={onClose} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Sync Settings Component
function SyncSettingsForm({ onComplete }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Product Sync</Label>
        <Select defaultValue="TWO_WAY">
          <SelectOption value="TWO_WAY">Two-way sync</SelectOption>
          <SelectOption value="TO_STORMCOM">WordPress → StormCom only</SelectOption>
          <SelectOption value="FROM_STORMCOM">StormCom → WordPress only</SelectOption>
        </Select>
      </div>

      <div>
        <Label>Order Sync</Label>
        <Select defaultValue="TO_STORMCOM">
          <SelectOption value="TO_STORMCOM">WordPress → StormCom only</SelectOption>
          <SelectOption value="TWO_WAY">Two-way sync</SelectOption>
        </Select>
      </div>

      <div>
        <Label>Inventory Sync</Label>
        <Select defaultValue="TWO_WAY">
          <SelectOption value="TWO_WAY">Real-time two-way sync</SelectOption>
          <SelectOption value="FROM_STORMCOM">StormCom → WordPress only</SelectOption>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="syncCustomers" />
        <Label htmlFor="syncCustomers">Sync customer data</Label>
      </div>

      <Button onClick={onComplete} className="w-full">
        Save & Start Sync
      </Button>
    </div>
  );
}
```

---

### Page 4: Sync Logs & Monitoring

```typescript
// File: src/app/dashboard/website/sync-logs/page.tsx

export default async function SyncLogsPage() {
  const store = await getCurrentStore();
  const logs = await getSyncLogs(store.id, { limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Activity</h1>
          <p className="text-muted-foreground">
            Monitor synchronization between platforms
          </p>
        </div>
        <Button onClick={triggerManualSync}>
          <IconRefresh className="mr-2 size-4" />
          Sync Now
        </Button>
      </div>

      {/* Sync Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Syncs"
          value="1,234"
          icon={<IconRefresh />}
        />
        <StatCard
          title="Successful"
          value="1,189"
          icon={<IconCheck />}
          trend="+96.4%"
        />
        <StatCard
          title="Failed"
          value="45"
          icon={<IconAlertTriangle />}
          variant="error"
        />
        <StatCard
          title="Last Sync"
          value="2 min ago"
          icon={<IconClock />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select placeholder="Entity Type">
              <SelectOption value="all">All Types</SelectOption>
              <SelectOption value="product">Products</SelectOption>
              <SelectOption value="order">Orders</SelectOption>
              <SelectOption value="inventory">Inventory</SelectOption>
            </Select>

            <Select placeholder="Status">
              <SelectOption value="all">All Status</SelectOption>
              <SelectOption value="SUCCESS">Success</SelectOption>
              <SelectOption value="FAILED">Failed</SelectOption>
              <SelectOption value="PENDING">Pending</SelectOption>
            </Select>

            <DateRangePicker />
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {formatDistanceToNow(log.createdAt)} ago
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell>
                  {log.entityType}
                  {log.entityId && (
                    <span className="text-muted-foreground ml-2">
                      #{log.entityId.slice(0, 8)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <SyncStatusBadge status={log.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewLogDetails(log)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

---

## 🔧 API Implementation

### API Routes for Integration Management

```typescript
// File: src/app/api/integrations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get current integration
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await getStoreByUserId(session.user.id);
  const integration = await prisma.websiteIntegration.findUnique({
    where: { storeId: store.id },
    include: {
      syncLogs: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ integration });
}

// POST - Create new integration
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, websiteUrl, syncSettings } = body;

  const store = await getStoreByUserId(session.user.id);

  // Generate API credentials
  const apiKey = generateApiKey();
  const apiSecret = generateApiSecret();

  const integration = await prisma.websiteIntegration.create({
    data: {
      storeId: store.id,
      type,
      websiteUrl,
      apiKey,
      apiSecret,
      syncProducts: syncSettings.syncProducts,
      syncOrders: syncSettings.syncOrders,
      syncInventory: syncSettings.syncInventory,
      productSyncDirection: syncSettings.productSyncDirection,
      orderSyncDirection: syncSettings.orderSyncDirection,
      inventorySyncDirection: syncSettings.inventorySyncDirection,
    },
  });

  return NextResponse.json({ integration });
}

// PUT - Update integration settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { syncSettings } = body;

  const store = await getStoreByUserId(session.user.id);

  const integration = await prisma.websiteIntegration.update({
    where: { storeId: store.id },
    data: syncSettings,
  });

  return NextResponse.json({ integration });
}

// DELETE - Disconnect integration
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await getStoreByUserId(session.user.id);

  await prisma.websiteIntegration.delete({
    where: { storeId: store.id },
  });

  return NextResponse.json({ success: true });
}
```

---

### Public API for External Integrations

```typescript
// File: src/app/api/v1/external/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/api-keys";
import { prisma } from "@/lib/prisma";

// GET - Fetch products
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const integration = await verifyApiKey(apiKey);
  if (!integration) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { storeId: integration.storeId },
    include: {
      mappings: {
        where: { integrationId: integration.id },
      },
    },
  });

  // Transform for external system
  const externalProducts = products.map((product) => ({
    id: product.id,
    externalId: product.mappings[0]?.externalProductId,
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    quantity: product.quantity,
    sku: product.sku,
    images: product.images,
    status: product.status,
  }));

  return NextResponse.json({ products: externalProducts });
}

// POST - Create product from external system
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const integration = await verifyApiKey(apiKey);
  if (!integration) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const { externalId, name, description, price, quantity, sku, images } = body;

  // Check if product already exists
  const existingMapping = await prisma.productMapping.findUnique({
    where: {
      integrationId_externalProductId: {
        integrationId: integration.id,
        externalProductId: externalId,
      },
    },
  });

  if (existingMapping) {
    return NextResponse.json(
      { error: "Product already exists" },
      { status: 409 }
    );
  }

  // Create product
  const product = await prisma.product.create({
    data: {
      storeId: integration.storeId,
      name,
      description,
      price,
      quantity,
      sku,
      images,
      status: "ACTIVE",
    },
  });

  // Create mapping
  await prisma.productMapping.create({
    data: {
      integrationId: integration.id,
      stormcomProductId: product.id,
      externalProductId: externalId,
    },
  });

  // Log sync
  await logSync(integration.id, "CREATE", "product", product.id, externalId);

  return NextResponse.json({ product }, { status: 201 });
}

// PUT - Update product from external system
export async function PUT(req: NextRequest) {
  const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const integration = await verifyApiKey(apiKey);
  if (!integration) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const { externalId, ...updateData } = body;

  // Find product mapping
  const mapping = await prisma.productMapping.findUnique({
    where: {
      integrationId_externalProductId: {
        integrationId: integration.id,
        externalProductId: externalId,
      },
    },
  });

  if (!mapping) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Update product
  const product = await prisma.product.update({
    where: { id: mapping.stormcomProductId },
    data: updateData,
  });

  // Log sync
  await logSync(integration.id, "UPDATE", "product", product.id, externalId);

  return NextResponse.json({ product });
}
```

---

### Webhook Handler for External Updates

```typescript
// File: src/app/api/webhooks/external/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/auth/webhooks";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-Webhook-Signature");

  // Verify webhook signature
  const integration = await verifyWebhookSignature(body, signature);
  if (!integration) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(body);
  const { event, payload } = data;

  try {
    switch (event) {
      case "product.created":
        await handleProductCreated(integration, payload);
        break;

      case "product.updated":
        await handleProductUpdated(integration, payload);
        break;

      case "product.deleted":
        await handleProductDeleted(integration, payload);
        break;

      case "order.created":
        await handleOrderCreated(integration, payload);
        break;

      case "inventory.updated":
        await handleInventoryUpdated(integration, payload);
        break;

      default:
        console.log(`Unknown event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleProductCreated(integration, payload) {
  const { externalId, name, description, price, quantity, sku } = payload;

  // Create product in StormCom
  const product = await prisma.product.create({
    data: {
      storeId: integration.storeId,
      name,
      description,
      price,
      quantity,
      sku,
      status: "ACTIVE",
    },
  });

  // Create mapping
  await prisma.productMapping.create({
    data: {
      integrationId: integration.id,
      stormcomProductId: product.id,
      externalProductId: externalId,
    },
  });

  // Log
  await logSync(integration.id, "CREATE", "product", product.id, externalId, "SUCCESS");
}

async function handleOrderCreated(integration, payload) {
  const { externalId, customer, items, total, source } = payload;

  // Map external product IDs to StormCom IDs
  const mappedItems = await Promise.all(
    items.map(async (item) => {
      const mapping = await prisma.productMapping.findUnique({
        where: {
          integrationId_externalProductId: {
            integrationId: integration.id,
            externalProductId: item.productId,
          },
        },
      });

      return {
        productId: mapping?.stormcomProductId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      };
    })
  );

  // Create order
  const order = await prisma.order.create({
    data: {
      storeId: integration.storeId,
      orderNumber: generateOrderNumber(),
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      shippingAddress: customer.address,
      items: {
        create: mappedItems,
      },
      subtotal: total,
      total,
      source: source || "EXTERNAL_WEBSITE",
      sourceOrderId: externalId,
      status: "PENDING",
      paymentStatus: "PENDING",
    },
  });

  // Log
  await logSync(integration.id, "CREATE", "order", order.id, externalId, "SUCCESS");

  // Send confirmation email
  await sendOrderConfirmation(order);
}
```

---

## 🔌 WordPress Plugin Code

```php
<?php
/**
 * Plugin Name: StormCom Sync
 * Plugin URI: https://stormcom.app/wordpress-plugin
 * Description: Sync products, orders, and inventory with StormCom platform
 * Version: 1.0.0
 * Author: StormCom
 * Author URI: https://stormcom.app
 * Text Domain: stormcom-sync
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('STORMCOM_VERSION', '1.0.0');
define('STORMCOM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('STORMCOM_PLUGIN_URL', plugin_dir_url(__FILE__));

// Main plugin class
class StormCom_Sync {
    private $api_key;
    private $api_secret;
    private $api_url = 'https://api.stormcom.app/v1';

    public function __construct() {
        $this->api_key = get_option('stormcom_api_key');
        $this->api_secret = get_option('stormcom_api_secret');

        // Hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));

        // WooCommerce hooks
        if (class_exists('WooCommerce')) {
            add_action('woocommerce_new_product', array($this, 'sync_product_created'));
            add_action('woocommerce_update_product', array($this, 'sync_product_updated'));
            add_action('woocommerce_new_order', array($this, 'sync_order_created'));
            add_action('woocommerce_product_set_stock', array($this, 'sync_inventory'));
        }
    }

    // Add admin menu
    public function add_admin_menu() {
        add_menu_page(
            'StormCom Settings',
            'StormCom',
            'manage_options',
            'stormcom-sync',
            array($this, 'settings_page'),
            'dashicons-cloud',
            56
        );
    }

    // Register settings
    public function register_settings() {
        register_setting('stormcom_settings', 'stormcom_api_key');
        register_setting('stormcom_settings', 'stormcom_api_secret');
        register_setting('stormcom_settings', 'stormcom_sync_products');
        register_setting('stormcom_settings', 'stormcom_sync_orders');
        register_setting('stormcom_settings', 'stormcom_sync_inventory');
    }

    // Settings page HTML
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('stormcom_settings');
                do_settings_sections('stormcom_settings');
                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">API Key</th>
                        <td>
                            <input type="text" name="stormcom_api_key" 
                                   value="<?php echo esc_attr(get_option('stormcom_api_key')); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">API Secret</th>
                        <td>
                            <input type="password" name="stormcom_api_secret" 
                                   value="<?php echo esc_attr(get_option('stormcom_api_secret')); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Sync Settings</th>
                        <td>
                            <label>
                                <input type="checkbox" name="stormcom_sync_products" 
                                       value="1" <?php checked(1, get_option('stormcom_sync_products'), true); ?> />
                                Sync Products
                            </label><br>
                            <label>
                                <input type="checkbox" name="stormcom_sync_orders" 
                                       value="1" <?php checked(1, get_option('stormcom_sync_orders'), true); ?> />
                                Sync Orders
                            </label><br>
                            <label>
                                <input type="checkbox" name="stormcom_sync_inventory" 
                                       value="1" <?php checked(1, get_option('stormcom_sync_inventory'), true); ?> />
                                Sync Inventory
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr>
            <h2>Manual Sync</h2>
            <button class="button button-primary" onclick="stormcomSyncAll()">
                Sync All Products Now
            </button>
        </div>
        <?php
    }

    // Sync product created
    public function sync_product_created($product_id) {
        if (!get_option('stormcom_sync_products')) {
            return;
        }

        $product = wc_get_product($product_id);
        
        $data = array(
            'externalId' => $product_id,
            'name' => $product->get_name(),
            'description' => $product->get_description(),
            'price' => $product->get_price(),
            'quantity' => $product->get_stock_quantity(),
            'sku' => $product->get_sku(),
            'images' => $this->get_product_images($product),
        );

        $this->api_request('POST', '/external/products', $data);
    }

    // Sync product updated
    public function sync_product_updated($product_id) {
        if (!get_option('stormcom_sync_products')) {
            return;
        }

        $product = wc_get_product($product_id);
        
        $data = array(
            'externalId' => $product_id,
            'name' => $product->get_name(),
            'description' => $product->get_description(),
            'price' => $product->get_price(),
            'quantity' => $product->get_stock_quantity(),
            'sku' => $product->get_sku(),
        );

        $this->api_request('PUT', '/external/products', $data);
    }

    // Sync order created
    public function sync_order_created($order_id) {
        if (!get_option('stormcom_sync_orders')) {
            return;
        }

        $order = wc_get_order($order_id);
        
        $items = array();
        foreach ($order->get_items() as $item) {
            $items[] = array(
                'productId' => $item->get_product_id(),
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'price' => $item->get_total() / $item->get_quantity(),
            );
        }

        $data = array(
            'externalId' => $order_id,
            'customer' => array(
                'email' => $order->get_billing_email(),
                'firstName' => $order->get_billing_first_name(),
                'lastName' => $order->get_billing_last_name(),
                'phone' => $order->get_billing_phone(),
                'address' => array(
                    'address1' => $order->get_billing_address_1(),
                    'address2' => $order->get_billing_address_2(),
                    'city' => $order->get_billing_city(),
                    'state' => $order->get_billing_state(),
                    'postcode' => $order->get_billing_postcode(),
                    'country' => $order->get_billing_country(),
                ),
            ),
            'items' => $items,
            'total' => $order->get_total(),
            'source' => 'WORDPRESS',
        );

        $this->api_request('POST', '/external/orders', $data);
    }

    // API request helper
    private function api_request($method, $endpoint, $data = null) {
        $url = $this->api_url . $endpoint;

        $args = array(
            'method' => $method,
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
        );

        if ($data) {
            $args['body'] = json_encode($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            error_log('StormCom API Error: ' . $response->get_error_message());
            return false;
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }

    // Get product images
    private function get_product_images($product) {
        $images = array();
        
        $image_id = $product->get_image_id();
        if ($image_id) {
            $images[] = wp_get_attachment_url($image_id);
        }

        $gallery_ids = $product->get_gallery_image_ids();
        foreach ($gallery_ids as $gallery_id) {
            $images[] = wp_get_attachment_url($gallery_id);
        }

        return $images;
    }
}

// Initialize plugin
new StormCom_Sync();
```

---

## 📱 Mobile App Considerations (Future)

### React Native Mobile App for Vendors

```typescript
// Vendor Mobile App Features
- Dashboard overview (sales, orders)
- Receive push notifications for new orders
- Update order status on-the-go
- Scan product barcodes to update inventory
- View customer details
- Quick product editing
- Multi-store management
```

---

## 🚀 Implementation Timeline

### Phase 1: Template System (Weeks 1-3)
- **Week 1**: Database schema + Template models
- **Week 2**: Template selection UI + Customizer
- **Week 3**: Template rendering engine + Preview

### Phase 2: WordPress Integration (Weeks 4-6)
- **Week 4**: WordPress plugin development
- **Week 5**: Product/Order sync logic
- **Week 6**: Dashboard integration UI

### Phase 3: Shopify Integration (Weeks 7-8)
- **Week 7**: Shopify OAuth + App setup
- **Week 8**: Webhook handlers + Testing

### Phase 4: Custom API (Weeks 9-10)
- **Week 9**: Public REST API endpoints
- **Week 10**: API documentation + SDK

### Phase 5: Sync Infrastructure (Weeks 11-12)
- **Week 11**: Sync queue system + Background jobs
- **Week 12**: Conflict resolution + Error handling

---

## 💰 Cost Estimate

### Development Costs
| Item | Cost (USD) | Time |
|------|-----------|------|
| Template System | $8,000 | 3 weeks |
| WordPress Plugin | $6,000 | 3 weeks |
| Shopify App | $4,000 | 2 weeks |
| Custom API | $4,000 | 2 weeks |
| Sync Infrastructure | $4,000 | 2 weeks |
| Testing & QA | $2,000 | 1 week |
| **TOTAL** | **$28,000** | **13 weeks** |

### Additional Costs
- WordPress Plugin Marketplace listing: $500
- Shopify App Store listing: $1,000
- Documentation & tutorials: $2,000

---

## ✅ Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Timeline |
|--------|--------|----------|
| **Template Adoption** | 60% of vendors use templates | Month 3 |
| **WordPress Integrations** | 200+ connected sites | Month 6 |
| **Shopify Integrations** | 50+ stores | Month 6 |
| **Sync Success Rate** | >95% | Ongoing |
| **Average Sync Time** | <30 seconds | Ongoing |
| **Integration Support Tickets** | <5% of users | Ongoing |

---

## 🎯 Final Summary

This integration plan provides vendors with **3 flexible options**:

1. **🎨 Pre-built Templates**: Perfect for vendors starting fresh (60% of users)
2. **🔌 WordPress/Shopify Integration**: For vendors with existing sites (35% of users)
3. **💻 Custom API**: For developers/agencies with custom platforms (5% of users)

**Key Benefits**:
- ✅ Single dashboard for ALL channels
- ✅ Real-time inventory sync
- ✅ Unified order management
- ✅ No vendor lock-in (keep existing website)
- ✅ Multi-channel support (Website + FB + IG)

**Total Investment**: $31,500 over 13 weeks  
**Expected ROI**: 80% of vendors will use templates (low support cost) + 20% will need integrations (premium pricing)

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**Next Review**: December 15, 2025  
**Owner**: StormCom Product Team
