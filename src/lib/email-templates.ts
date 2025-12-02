/**
 * Email Templates
 * 
 * HTML email templates for various notifications.
 * These can be used with any email provider (Resend, SendGrid, etc.)
 */

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
  .logo { font-size: 24px; font-weight: bold; color: #0070f3; }
  .content { padding: 30px 0; }
  .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
  .button:hover { background-color: #0060df; }
  .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  .status-approved { color: #16a34a; }
  .status-rejected { color: #dc2626; }
  .status-pending { color: #d97706; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
`;

interface EmailTemplateProps {
  userName: string;
  appUrl?: string;
}

interface ApprovalEmailProps extends EmailTemplateProps {
  storeName?: string;
}

interface RejectionEmailProps extends EmailTemplateProps {
  reason: string;
}

interface StoreCreatedEmailProps extends EmailTemplateProps {
  storeName: string;
  storeSlug: string;
}

/**
 * Welcome email sent when user signs up
 */
export function welcomeEmail({ userName, appUrl = 'https://stormcom.app' }: EmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>Welcome, ${userName}! 👋</h1>
      <p>Thank you for signing up for StormCom. Your application has been received and is currently being reviewed by our team.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">What happens next?</h3>
        <ul style="margin-bottom: 0;">
          <li><strong>Review Process:</strong> Our team will review your application within 24-48 hours</li>
          <li><strong>Email Notification:</strong> You'll receive an email once your application is approved</li>
          <li><strong>Store Setup:</strong> Once approved, we'll set up your store and you can start selling</li>
        </ul>
      </div>
      
      <p>If you have any questions, feel free to contact our support team.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}" class="button">Visit StormCom</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
      <p>You're receiving this email because you signed up for StormCom.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email sent when user is approved
 */
export function approvalEmail({ userName, storeName, appUrl = 'https://stormcom.app' }: ApprovalEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>🎉 Congratulations, ${userName}!</h1>
      <p>Great news! Your StormCom application has been <span class="status-approved"><strong>approved</strong></span>.</p>
      
      ${storeName ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">Your Store</h3>
        <p style="margin-bottom: 0;"><strong>${storeName}</strong> is now ready for you to set up!</p>
      </div>
      ` : `
      <div class="info-box">
        <h3 style="margin-top: 0;">Next Steps</h3>
        <p style="margin-bottom: 0;">Our team will set up your store shortly. You'll receive another email once it's ready.</p>
      </div>
      `}
      
      <p>You can now log in to your account and start managing your store.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/login" class="button">Log In to Your Account</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
      <p>Need help? Contact our support team at support@stormcom.app</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email sent when user is rejected
 */
export function rejectionEmail({ userName, reason, appUrl: _appUrl = 'https://stormcom.app' }: RejectionEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>Application Update</h1>
      <p>Dear ${userName},</p>
      <p>We've reviewed your StormCom application and unfortunately, we're unable to approve it at this time.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Reason</h3>
        <p style="margin-bottom: 0;">${reason}</p>
      </div>
      
      <p>If you believe this decision was made in error, or if you'd like to provide additional information, please contact our support team.</p>
      
      <p>You're welcome to reapply in the future with updated information.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="mailto:support@stormcom.app" class="button">Contact Support</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
      <p>If you have questions, please contact support@stormcom.app</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email sent when store is created for user
 */
export function storeCreatedEmail({ userName, storeName, storeSlug, appUrl = 'https://stormcom.app' }: StoreCreatedEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Store is Ready - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>🏪 Your Store is Ready!</h1>
      <p>Hi ${userName},</p>
      <p>Great news! Your store <strong>"${storeName}"</strong> has been created and is ready for you to set up.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Store Details</h3>
        <p><strong>Store Name:</strong> ${storeName}</p>
        <p><strong>Store URL:</strong> ${appUrl}/store/${storeSlug}</p>
        <p style="margin-bottom: 0;"><strong>Dashboard:</strong> ${appUrl}/dashboard</p>
      </div>
      
      <h3>Getting Started</h3>
      <ol>
        <li><strong>Add Products:</strong> Start by adding your products to your store</li>
        <li><strong>Configure Settings:</strong> Set up your store's payment and shipping options</li>
        <li><strong>Customize:</strong> Personalize your store's appearance</li>
        <li><strong>Go Live:</strong> Publish your store and start selling!</li>
      </ol>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard" class="button">Go to Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
      <p>Need help? Check out our <a href="${appUrl}/docs">documentation</a> or contact support.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email sent when account is suspended
 */
export function suspensionEmail({ userName, reason, appUrl: _appUrl = 'https://stormcom.app' }: RejectionEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>Account Suspended</h1>
      <p>Dear ${userName},</p>
      <p>Your StormCom account has been suspended.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Reason</h3>
        <p style="margin-bottom: 0;">${reason}</p>
      </div>
      
      <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="mailto:support@stormcom.app" class="button">Contact Support</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Staff invitation email
 */
export function staffInvitationEmail({ 
  userName, 
  storeName, 
  roleName, 
  inviterName,
  appUrl = 'https://stormcom.app' 
}: {
  userName: string;
  storeName: string;
  roleName: string;
  inviterName: string;
  appUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Invitation - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>👋 You're Invited!</h1>
      <p>Hi ${userName},</p>
      <p>${inviterName} has invited you to join <strong>"${storeName}"</strong> as a team member.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Invitation Details</h3>
        <p><strong>Store:</strong> ${storeName}</p>
        <p><strong>Role:</strong> ${roleName}</p>
        <p style="margin-bottom: 0;"><strong>Invited by:</strong> ${inviterName}</p>
      </div>
      
      <p>As a team member, you'll be able to help manage the store based on your assigned role and permissions.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard/notifications" class="button">View Invitation</a>
      </p>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        You can accept or decline this invitation from your dashboard notifications.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
      <p>You're receiving this email because someone invited you to join their store.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Staff invitation accepted email (sent to store owner)
 */
export function staffAcceptedEmail({ 
  ownerName, 
  staffName,
  storeName, 
  roleName, 
  appUrl = 'https://stormcom.app' 
}: {
  ownerName: string;
  staffName: string;
  storeName: string;
  roleName: string;
  appUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Invitation Accepted - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>✅ Invitation Accepted!</h1>
      <p>Hi ${ownerName},</p>
      <p>Great news! <strong>${staffName}</strong> has accepted your invitation to join <strong>"${storeName}"</strong>.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">New Team Member</h3>
        <p><strong>Name:</strong> ${staffName}</p>
        <p style="margin-bottom: 0;"><strong>Role:</strong> ${roleName}</p>
      </div>
      
      <p>They now have access to the store based on their assigned role and permissions.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard/stores" class="button">Manage Team</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Custom role request submitted email (sent to admin)
 */
export function roleRequestSubmittedEmail({ 
  adminName, 
  storeName, 
  roleName, 
  requestedBy,
  permissions,
  appUrl = 'https://stormcom.app' 
}: {
  adminName: string;
  storeName: string;
  roleName: string;
  requestedBy: string;
  permissions: string[];
  appUrl?: string;
}): string {
  const permissionList = permissions.slice(0, 5).join(', ') + (permissions.length > 5 ? ` and ${permissions.length - 5} more` : '');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Role Request - StormCom Admin</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom Admin</div>
    </div>
    <div class="content">
      <h1>📋 New Custom Role Request</h1>
      <p>Hi ${adminName},</p>
      <p>A new custom role request has been submitted and requires your review.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>Store:</strong> ${storeName}</p>
        <p><strong>Requested Role:</strong> ${roleName}</p>
        <p><strong>Submitted by:</strong> ${requestedBy}</p>
        <p style="margin-bottom: 0;"><strong>Permissions:</strong> ${permissionList}</p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/admin/roles/requests" class="button">Review Request</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom Admin Notification</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Custom role approved email (sent to store owner)
 */
export function roleApprovedEmail({ 
  userName, 
  storeName, 
  roleName, 
  appUrl = 'https://stormcom.app' 
}: {
  userName: string;
  storeName: string;
  roleName: string;
  appUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Role Approved - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>🎉 Role Approved!</h1>
      <p>Hi ${userName},</p>
      <p>Great news! Your custom role request for <strong>"${storeName}"</strong> has been <span class="status-approved"><strong>approved</strong></span>.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Approved Role</h3>
        <p style="margin-bottom: 0;"><strong>${roleName}</strong> is now available to assign to staff members in your store.</p>
      </div>
      
      <p>You can now use this role when inviting new staff members to your store.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard/stores" class="button">Manage Roles</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Custom role rejected email (sent to store owner)
 */
export function roleRejectedEmail({ 
  userName, 
  storeName, 
  roleName, 
  reason,
  appUrl = 'https://stormcom.app' 
}: {
  userName: string;
  storeName: string;
  roleName: string;
  reason: string;
  appUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Role Request Update - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>Role Request Update</h1>
      <p>Hi ${userName},</p>
      <p>Your custom role request "<strong>${roleName}</strong>" for <strong>"${storeName}"</strong> has been <span class="status-rejected"><strong>rejected</strong></span>.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Reason</h3>
        <p style="margin-bottom: 0;">${reason}</p>
      </div>
      
      <p>You can submit a new role request with modifications based on the feedback provided.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard/stores" class="button">Submit New Request</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Custom role modification requested email (sent to store owner)
 */
export function roleModificationRequestedEmail({ 
  userName, 
  storeName, 
  roleName, 
  feedback,
  appUrl = 'https://stormcom.app' 
}: {
  userName: string;
  storeName: string;
  roleName: string;
  feedback: string;
  appUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modification Requested - StormCom</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom</div>
    </div>
    <div class="content">
      <h1>⚠️ Modification Requested</h1>
      <p>Hi ${userName},</p>
      <p>Your custom role request "<strong>${roleName}</strong>" for <strong>"${storeName}"</strong> requires some modifications.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Admin Feedback</h3>
        <p style="margin-bottom: 0;">${feedback}</p>
      </div>
      
      <p>Please review the feedback and update your role request accordingly.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard/stores" class="button">Update Request</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Admin notification for new user signup
 */
export function adminNewUserEmail({ userName, userEmail, businessName, businessCategory }: {
  userName: string;
  userEmail: string;
  businessName: string;
  businessCategory: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Registration - StormCom Admin</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">StormCom Admin</div>
    </div>
    <div class="content">
      <h1>🆕 New User Registration</h1>
      <p>A new user has registered and is awaiting approval.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">User Details</h3>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p style="margin-bottom: 0;"><strong>Category:</strong> ${businessCategory}</p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://stormcom.app/admin/users/pending" class="button">Review Application</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StormCom Admin Notification</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
