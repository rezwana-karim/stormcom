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
export function rejectionEmail({ userName, reason, appUrl = 'https://stormcom.app' }: RejectionEmailProps): string {
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
export function suspensionEmail({ userName, reason, appUrl = 'https://stormcom.app' }: RejectionEmailProps): string {
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
