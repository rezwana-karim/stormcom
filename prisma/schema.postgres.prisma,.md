// Prisma schema for PostgreSQL (production)
// Use with: npx prisma migrate deploy --schema=prisma/schema.postgres.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// NextAuth core models (Prisma Adapter)
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  emailVerified DateTime?
  image         String?

  memberships   Membership[]

  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Organization {
  id          String        @id @default(cuid())
  name        String
  slug        String        @unique
  image       String?

  memberships Membership[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Membership {
  id             String        @id @default(cuid())
  userId         String
  organizationId String
  role           Role          @default(MEMBER)

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@unique([userId, organizationId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
