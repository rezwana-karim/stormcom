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
    _form?: string[]
  }
  success?: boolean
  message?: string
} | undefined

/**
 * Register a new user with email and password
 * @param state - Previous form state
 * @param formData - Form data containing name, email, and password
 */
export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  // Validate form fields
  const validatedFields = SignupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If validation fails, return errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = validatedFields.data

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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    })

    if (!user) {
      return {
        errors: {
          _form: ['Failed to create account. Please try again.'],
        },
      }
    }

    return {
      success: true,
      message: 'Account created successfully! Please sign in.',
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
