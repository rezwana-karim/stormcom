/**
 * Email Service
 * 
 * Centralized email sending service using Resend.
 * Handles all transactional emails for the platform.
 */

import { Resend } from 'resend';
import {
  welcomeEmail,
  approvalEmail,
  rejectionEmail,
  storeCreatedEmail,
  suspensionEmail,
  adminNewUserEmail,
  staffInvitationEmail,
  staffAcceptedEmail,
  roleRequestSubmittedEmail,
  roleApprovedEmail,
  roleRejectedEmail,
  roleModificationRequestedEmail,
} from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'StormCom <noreply@stormcom.app>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stormcom.app';
const APP_URL = process.env.NEXTAUTH_URL || 'https://stormcom.app';

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to StormCom - Application Received',
      html: welcomeEmail({ userName, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send approval email to user
 */
export async function sendApprovalEmail(
  to: string,
  userName: string,
  storeName?: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '🎉 Application Approved - Welcome to StormCom!',
      html: approvalEmail({ userName, storeName, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send approval email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send rejection email to user
 */
export async function sendRejectionEmail(
  to: string,
  userName: string,
  reason: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Application Update - StormCom',
      html: rejectionEmail({ userName, reason, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send rejection email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send store created email to user
 */
export async function sendStoreCreatedEmail(
  to: string,
  userName: string,
  storeName: string,
  storeSlug: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '🏪 Your Store is Ready - StormCom',
      html: storeCreatedEmail({ userName, storeName, storeSlug, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send store created email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send suspension email to user
 */
export async function sendSuspensionEmail(
  to: string,
  userName: string,
  reason: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Account Suspended - StormCom',
      html: suspensionEmail({ userName, reason, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send suspension email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send admin notification for new user registration
 */
export async function sendAdminNewUserNotification(
  userName: string,
  userEmail: string,
  businessName: string,
  businessCategory: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🆕 New User Registration: ${businessName}`,
      html: adminNewUserEmail({ userName, userEmail, businessName, businessCategory }),
    });

    if (error) {
      console.error('Failed to send admin notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send staff invitation email
 */
export async function sendStaffInvitationEmail(
  to: string,
  userName: string,
  storeName: string,
  roleName: string,
  inviterName: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `👋 You're invited to join ${storeName} - StormCom`,
      html: staffInvitationEmail({ userName, storeName, roleName, inviterName, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send staff invitation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send staff accepted email to store owner
 */
export async function sendStaffAcceptedEmail(
  to: string,
  ownerName: string,
  staffName: string,
  storeName: string,
  roleName: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `✅ ${staffName} joined ${storeName} - StormCom`,
      html: staffAcceptedEmail({ ownerName, staffName, storeName, roleName, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send staff accepted email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send role request submitted email to admin
 */
export async function sendRoleRequestSubmittedEmail(
  adminName: string,
  storeName: string,
  roleName: string,
  requestedBy: string,
  permissions: string[]
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📋 New Custom Role Request: ${roleName} - StormCom`,
      html: roleRequestSubmittedEmail({ adminName, storeName, roleName, requestedBy, permissions, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send role request email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send role approved email to store owner
 */
export async function sendRoleApprovedEmail(
  to: string,
  userName: string,
  storeName: string,
  roleName: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🎉 Custom Role Approved: ${roleName} - StormCom`,
      html: roleApprovedEmail({ userName, storeName, roleName, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send role approved email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send role rejected email to store owner
 */
export async function sendRoleRejectedEmail(
  to: string,
  userName: string,
  storeName: string,
  roleName: string,
  reason: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Custom Role Request Update: ${roleName} - StormCom`,
      html: roleRejectedEmail({ userName, storeName, roleName, reason, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send role rejected email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send modification requested email to store owner
 */
export async function sendRoleModificationRequestedEmail(
  to: string,
  userName: string,
  storeName: string,
  roleName: string,
  feedback: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `⚠️ Modification Requested: ${roleName} - StormCom`,
      html: roleModificationRequestedEmail({ userName, storeName, roleName, feedback, appUrl: APP_URL }),
    });

    if (error) {
      console.error('Failed to send modification requested email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
