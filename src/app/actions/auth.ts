'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// Validation schemas
const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  // Business information (optional but encouraged)
  businessName: z.string().max(100).optional(),
  businessDescription: z.string().max(500).optional(),
  businessCategory: z.string().max(50).optional(),
  phoneNumber: z.string().max(20).optional(),
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
    businessName?: string[]
    businessDescription?: string[]
    businessCategory?: string[]
    phoneNumber?: string[]
    _form?: string[]
  }
  success?: boolean
  message?: string
} | undefined

/**
 * Register a new user with email and password
 * New users are created with PENDING status and must be approved by Super Admin
 * @param state - Previous form state
 * @param formData - Form data containing name, email, password, and business info
 */
export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  // Validate form fields
  const validatedFields = SignupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    businessName: formData.get('businessName') || undefined,
    businessDescription: formData.get('businessDescription') || undefined,
    businessCategory: formData.get('businessCategory') || undefined,
    phoneNumber: formData.get('phoneNumber') || undefined,
  })

  // If validation fails, return errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, email, password, businessName, businessDescription, businessCategory, phoneNumber } = validatedFields.data

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        errors: {
          email: ['Email already registered'],
        },
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user with PENDING status
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        accountStatus: 'PENDING',
        businessName: businessName || null,
        businessDescription: businessDescription || null,
        businessCategory: businessCategory || null,
        phoneNumber: phoneNumber || null,
      },
    })

    if (!user) {
      return {
        errors: {
          _form: ['Failed to create account. Please try again.'],
        },
      }
    }

    // Create notification for the new user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ACCOUNT_PENDING',
        title: 'Account Pending Approval',
        message: 'Your account has been created and is pending approval. We will notify you once your account is reviewed.',
        actionUrl: '/account-pending',
        actionLabel: 'Learn More',
      },
    })

    // If business name is provided, automatically create a store request
    // This streamlines the flow: one approval creates both user access and store
    let storeRequest = null;
    if (businessName) {
      // Generate a slug from the business name
      const storeSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if slug is unique
      const existingStore = await prisma.store.findUnique({ where: { slug: storeSlug } });
      const existingRequest = await prisma.storeRequest.findFirst({ 
        where: { storeSlug, status: 'PENDING' } 
      });
      
      // Only create if slug is available
      if (!existingStore && !existingRequest) {
        storeRequest = await prisma.storeRequest.create({
          data: {
            userId: user.id,
            storeName: businessName,
            storeSlug,
            storeDescription: businessDescription || null,
            businessName: businessName,
            businessCategory: businessCategory || null,
            businessEmail: email,
            businessPhone: phoneNumber || null,
            status: 'PENDING',
          },
        });
      }
    }

    // Log platform activity - notify super admins
    await prisma.platformActivity.create({
      data: {
        targetUserId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        description: `New user registration: ${name} (${email})${storeRequest ? ' with store request' : ''}`,
        metadata: JSON.stringify({
          businessName: businessName || null,
          businessCategory: businessCategory || null,
          storeRequestId: storeRequest?.id || null,
        }),
      },
    })

    // Notify all super admins about the new registration
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    })

    if (superAdmins.length > 0) {
      // If store request was created, notify about that (it's actionable)
      // Otherwise notify about user registration
      const notificationData = storeRequest ? {
        type: 'STORE_REQUEST_PENDING' as const,
        title: 'New Store Request',
        message: `New user "${name}" (${email}) has registered with store request "${businessName}".`,
        actionUrl: '/admin/stores/requests',
        actionLabel: 'Review Store Request',
      } : {
        type: 'NEW_USER_REGISTERED' as const,
        title: 'New User Registration',
        message: `New user "${name}" (${email}) has registered and is waiting for approval.`,
        actionUrl: '/admin/users/pending',
        actionLabel: 'Review',
      };

      await prisma.notification.createMany({
        data: superAdmins.map(admin => ({
          userId: admin.id,
          ...notificationData,
          data: JSON.stringify({
            userId: user.id,
            businessName: businessName || null,
            storeRequestId: storeRequest?.id || null,
          }),
        })),
      })
    }

    return {
      success: true,
      message: 'Account created successfully! Your account is pending approval. You will be notified once approved.',
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    }
  }
}

/**
 * Authenticate user with email and password
 * Note: This returns form state for use with useActionState
 * Actual sign-in still uses NextAuth client-side signIn()
 */
export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // Validate form fields
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If validation fails, return errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.passwordHash) {
      return {
        errors: {
          _form: ['Invalid email or password'],
        },
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return {
        errors: {
          _form: ['Invalid email or password'],
        },
      }
    }

    // Return success - actual sign-in happens client-side
    return {
      success: true,
      message: 'Login successful',
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    }
  }
}
