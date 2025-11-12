import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const currentYear = new Date().getFullYear();

// Helper to get logo URL - uses PNG for email compatibility
const getLogoUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/email-assets/nexus-logo-email.png`;
};

const buildEmailTemplate = ({
  preheader = '',
  heroTitle,
  heroSubtitle = '',
  intro = '',
  contentHtml = '',
  buttonText,
  buttonUrl,
  outroHtml = '',
  footerNote = `© ${currentYear} Nexus · Stories Worth Sharing`,
  unsubscribeUrl,
  showLogo = true,
}) => {
  const buttonMarkup =
    buttonText && buttonUrl
      ? `
        <div style="text-align:center;margin:36px 0 12px;">
          <a href="${buttonUrl}"
            style="display:inline-block;padding:14px 32px;background-color:#1A8917;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;letter-spacing:0.03em;box-shadow:0 12px 30px rgba(26,137,23,0.25);">
            ${buttonText}
          </a>
        </div>
      `
      : '';

  const unsubscribeMarkup = unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">Prefer fewer emails? <a href="${unsubscribeUrl}" style="color:#1A8917;text-decoration:none;">Unsubscribe</a></p>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <style>
        @media screen and (max-width: 640px) {
          .container { padding: 20px !important; }
          .card { border-radius: 20px !important; }
          .body { padding: 28px !important; }
          h1 { font-size: 26px !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f9f3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
      <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:0;line-height:0;">${preheader}</span>
      <div class="container" style="width:100%;max-width:640px;margin:0 auto;padding:32px 24px;">
        <div class="card" style="background-color:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 22px 55px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(140deg,#0f172a 0%,#1a8917 95%);padding:40px 36px;color:#ffffff;">
            ${
              showLogo
                ? `
            <div style="text-align:center;margin-bottom:24px;">
              <img src="${getLogoUrl()}" 
                   alt="Nexus - Stories Worth Sharing" 
                   width="180" 
                   height="auto"
                   style="max-width:180px;height:auto;display:block;margin:0 auto;"
                   border="0">
            </div>
            `
                : `
            <div style="font-size:18px;font-weight:600;letter-spacing:0.5em;text-transform:uppercase;margin-bottom:20px;display:inline-block;color:#ffffff;">
              <span style="letter-spacing:0.45em;color:#ffffff;">NE</span><span style="color:#ffffff;letter-spacing:0.45em;">X</span><span style="letter-spacing:0.45em;color:#ffffff;">US</span>
            </div>
            `
            }
            <h1 style="margin:0;font-size:30px;line-height:1.2;font-weight:700;text-align:center;color:#ffffff !important;">${heroTitle}</h1>
            ${
              heroSubtitle
                ? `<p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#ffffff;text-align:center;opacity:0.95;">${heroSubtitle}</p>`
                : ''
            }
          </div>
          <div class="body" style="padding:36px 36px 34px;">
            ${
              intro
                ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#1f2937;">${intro}</p>`
                : ''
            }
            ${
              contentHtml
                ? `<div style="font-size:15px;line-height:1.75;color:#1f2937;">${contentHtml}</div>`
                : ''
            }
            ${buttonMarkup}
            ${
              outroHtml
                ? `<div style="margin-top:24px;font-size:14px;line-height:1.7;color:#4b5563;">${outroHtml}</div>`
                : ''
            }
            <div style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(15,23,42,0.08);font-size:13px;line-height:1.7;color:#64748b;">
              ${footerNote}
              ${unsubscribeMarkup}
            </div>
          </div>
        </div>
        <p style="text-align:center;margin:22px 0 0;font-size:12px;color:#94a3b8;">Delivered by Nexus · Stories Worth Sharing</p>
      </div>
    </body>
    </html>
  `;
};

export const sendNewsletter = async (subscribers, subject, content) => {
  try {
    console.log(`📧 Preparing to send newsletter to ${subscribers.length} subscribers`);

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const msg = {
          to: subscriber.email,
          from: process.env.FROM_EMAIL || 'blog@example.com',
          subject: subject,
          html: buildEmailTemplate({
            preheader: subject,
            heroTitle: subject || 'Nexus Newsletter',
            heroSubtitle: 'Stories Worth Sharing from our community',
            intro:
              'Here is what the Nexus editorial team has curated for you this week. Settle in with a cup of curiosity and enjoy the latest highlights.',
            contentHtml: content,
            footerNote: `© ${currentYear} Nexus · Stories Worth Sharing`,
            unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(
              subscriber.email
            )}`,
          }),
        };

        await sgMail.send(msg);
        console.log(`Email sent successfully to: ${subscriber.email}`);
        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error.response?.body || error.message);
        return { success: false, email: subscriber.email, error: error.response?.body || error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    console.log(`Newsletter Results: ${successful} successful, ${failed} failed`);

    return { 
      successful, 
      failed, 
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason) 
    };
  } catch (error) {
    console.error('Error in sendNewsletter:', error);
    throw new Error('Failed to send newsletter');
  }
};

export const sendWelcomeEmail = async (email) => {
  try {
    console.log(`Sending welcome email to: ${email}`);

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'blog@example.com',
      subject: 'Welcome to our newsletter!',
      html: buildEmailTemplate({
        preheader: 'Thanks for subscribing to Nexus.',
        heroTitle: 'Welcome to Nexus',
        heroSubtitle: 'Stories Worth Sharing, delivered to your inbox',
        intro:
          "We're excited to share thoughtful stories, community highlights, and creative inspiration with you. Here's what you can expect:",
        contentHtml: `
          <ul style="padding-left:18px;margin:0 0 22px;">
            <li style="margin-bottom:10px;">📝 Fresh essays and deep dives from our authors</li>
            <li style="margin-bottom:10px;">💡 Curated ideas to spark your curiosity</li>
            <li style="margin-bottom:10px;">🎧 Occasional bonus content and behind-the-scenes notes</li>
            <li>🚀 Early access to new features and community experiments</li>
            </ul>
        `,
        buttonText: 'Start Reading',
        buttonUrl: `${process.env.FRONTEND_URL}/posts`,
        outroHtml:
          'We publish with care so every email feels like a worthwhile read. If there is ever a topic you would love to see, simply reply and let us know.',
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
      }),
    };

    await sgMail.send(msg);
    console.log('Welcome email sent successfully!');
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error.response?.body || error.message);
    throw new Error(`Failed to send welcome email: ${error.response?.body || error.message}`);
  }
};

export const sendNewPostNotification = async (subscribers, post) => {
  try {
    console.log(`Notifying ${subscribers.length} subscribers about new post: ${post.title}`);

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const msg = {
          to: subscriber.email,
          from: process.env.FROM_EMAIL || 'blog@example.com',
          subject: `New Post: ${post.title}`,
          html: buildEmailTemplate({
            preheader: `${post.title} by ${post.author.username}`,
            heroTitle: post.title,
            heroSubtitle: 'Fresh from the Nexus community',
            intro: `Written by ${post.author.username}. Immerse yourself in a new perspective crafted for curious minds.`,
            contentHtml: `
              ${
                post.excerpt
                  ? `<div style="background:rgba(26,137,23,0.08);padding:18px 20px;border-radius:16px;margin-bottom:24px;border:1px solid rgba(26,137,23,0.12);">
                      <strong style="display:block;margin-bottom:6px;color:#0f172a;">In this story:</strong>
                      <p style="margin:0;color:#1f2937;">${post.excerpt}</p>
                    </div>`
                  : ''
              }
              <p style="margin-bottom:0;">Set aside a moment to read and reflect — we’d love to hear what you think.</p>
            `,
            buttonText: 'Read the full story',
            buttonUrl: `${process.env.FRONTEND_URL}/posts/${post.slug}`,
            outroHtml: 'Thanks for being part of Nexus. Your curiosity keeps this space vibrant.',
            unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(
              subscriber.email
            )}`,
          }),
        };

        await sgMail.send(msg);
        console.log(`New post notification sent to: ${subscriber.email}`);
        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`Failed to send new post notification to ${subscriber.email}:`, error.response?.body || error.message);
        return { success: false, email: subscriber.email, error: error.response?.body || error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    console.log(`New Post Notification Results: ${successful} successful, ${failed} failed`);

    return { successful, failed, results };
  } catch (error) {
    console.error('Error in sendNewPostNotification:', error);
    throw new Error('Failed to send new post notifications');
  }
};

export const sendUserWelcomeEmail = async (user) => {
    try {
      console.log(`Sending user welcome email to: ${user.email}`);
  
      const msg = {
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: `Welcome to Our Blog, ${user.username}! 🎉`,
        html: buildEmailTemplate({
          preheader: `Welcome to Nexus, ${user.username}`,
          heroTitle: `Welcome, ${user.username}!`,
          heroSubtitle: 'Your Nexus profile is ready',
          intro:
            'Thanks for creating an account. Nexus is your space to discover ideas, follow thoughtful voices, and share your own perspective.',
          contentHtml: `
            <div style="background:rgba(26,137,23,0.08);padding:18px 20px;border-radius:16px;margin-bottom:26px;border:1px solid rgba(26,137,23,0.12);">
              <strong style="display:block;margin-bottom:8px;color:#0f172a;">Your account</strong>
              <p style="margin:0;">Username: <strong>${user.username}</strong><br>Email: <strong>${user.email}</strong><br>Joined: ${new Date().toLocaleDateString()}</p>
            </div>
            <ul style="padding-left:18px;margin:0;">
              <li style="margin-bottom:12px;">🗂️ Save stories you love and build your personal library.</li>
              <li style="margin-bottom:12px;">🔔 Follow authors to get notified when they publish.</li>
              <li style="margin-bottom:12px;">💬 Join conversations and share your take in the comments.</li>
              ${
                user.role === 'admin'
                  ? '<li style="margin-bottom:12px;">🛠️ Access the admin dashboard to manage posts and oversee the community.</li>'
                  : ''
              }
              <li>🌱 Grow with a community that values thoughtful storytelling.</li>
            </ul>
          `,
          buttonText: 'Explore Nexus',
          buttonUrl: `${process.env.FRONTEND_URL}/posts`,
          outroHtml:
            "Need help getting started? Reply to this email or visit our help center anytime — the team is here for you.",
        }),
      };
  
      await sgMail.send(msg);
      console.log('User welcome email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('Failed to send user welcome email:', error.message);
      throw new Error(`Failed to send user welcome email: ${error.message}`);
    }
  };



export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const msg = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Password Reset Request - Nexus',
      html: buildEmailTemplate({
        preheader: 'Use this link to reset your Nexus password.',
        heroTitle: 'Reset your password',
        heroSubtitle: 'This link expires in 1 hour',
        intro:
          'We received a request to reset the password for your Nexus account. If that was you, use the secure link below to set a new password.',
        buttonText: 'Reset password',
        buttonUrl: resetUrl,
        contentHtml: `
          <p style="margin-top:0;">If the button does not work, copy and paste this link into your browser:</p>
          <div style="background:rgba(15,23,42,0.06);padding:12px 16px;border-radius:12px;font-family:'Roboto Mono',monospace;color:#0f172a;font-size:13px;word-break:break-all;">${resetUrl}</div>
        `,
        outroHtml:
          'If you did not request a password reset, you can safely ignore this email — your password will remain the same.',
        footerNote: `Need help? Contact support at ${process.env.SUPPORT_EMAIL || 'support@nexus.blog'}.`,
      }),
    };

    await sgMail.send(msg);
    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

export const sendPasswordChangedEmail = async (email) => {
  try {
    const msg = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Password Changed Successfully - Nexus',
      html: buildEmailTemplate({
        preheader: 'Your Nexus password was just updated.',
        heroTitle: 'Password updated',
        heroSubtitle: 'Your account security matters to us',
        intro:
          'This is a confirmation that your Nexus password has been changed successfully. No further action is required if you made this update.',
        contentHtml: `
          <div style="background:rgba(26,137,23,0.09);padding:16px 18px;border-radius:16px;margin-bottom:24px;border:1px solid rgba(26,137,23,0.12);">
            <strong style="display:block;margin-bottom:6px;color:#0f172a;">Security snapshot</strong>
            <p style="margin:0;color:#1f2937;">Time: ${new Date().toLocaleString()}<br>Location: Account activity</p>
          </div>
          <p style="margin:0 0 14px;">If this wasn’t you, please reset your password immediately and let our team know so we can help secure your account.</p>
          <ul style="padding-left:18px;margin:0;">
            <li style="margin-bottom:10px;">Reset your password using the “Forgot password” option.</li>
            <li style="margin-bottom:10px;">Contact support so we can assist you.</li>
            <li>Review your account activity for anything unexpected.</li>
            </ul>
        `,
        footerNote: `This is an automated security notice from Nexus.`,
      }),
    };

    await sgMail.send(msg);
    console.log('Password changed notification sent to:', email);
    return true;
  } catch (error) {
    console.error('Failed to send password changed email:', error);
  }
};

export default sgMail;
