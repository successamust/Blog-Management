import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Send newsletter to multiple subscribers
export const sendNewsletter = async (subscribers, subject, content) => {
  try {
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.FROM_EMAIL || 'Blog Newsletter <newsletter@yourdomain.com>',
          to: subscriber.email,
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
                .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                .unsubscribe { color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${subject}</h1>
              </div>
              <div class="content">
                ${content}
                <div class="footer">
                  <p>You're receiving this email because you subscribed to our newsletter.</p>
                  <p class="unsubscribe">
                    <a href="${process.env.BASE_URL}/api/newsletter/unsubscribe?email=${subscriber.email}" style="color: #666;">Unsubscribe from our newsletter</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (error) {
          console.error(`Error sending email to ${subscriber.email}:`, error);
          throw error;
        }

        return { success: true, email: subscriber.email, data };
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        return { success: false, email: subscriber.email, error };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    return { successful, failed, results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason) };
  } catch (error) {
    console.error('Error in sendNewsletter:', error);
    throw new Error('Failed to send newsletter');
  }
};

// Send welcome email to new subscribers
export const sendWelcomeEmail = async (email) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Blog Newsletter <newsletter@yourdomain.com>',
      to: email,
      subject: 'Welcome to Our Newsletter! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
            .button { background: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Our Newsletter! 🎉</h1>
          </div>
          <div class="content">
            <h2>Thank you for subscribing!</h2>
            <p>We're excited to have you join our community. You'll now receive:</p>
            <ul>
              <li>📝 Latest blog posts and updates</li>
              <li>💡 Exclusive tips and insights</li>
              <li>🎯 Curated content tailored for you</li>
              <li>🚀 Early access to new features</li>
            </ul>
            <p>Stay tuned for our next update - we promise to only send you valuable content!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.BASE_URL}/api/posts" class="button">Explore Our Blog</a>
            </div>
            <div class="footer">
              <p>If you change your mind, you can <a href="${process.env.BASE_URL}/api/newsletter/unsubscribe?email=${email}">unsubscribe</a> at any time.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

// Send new post notification
export const sendNewPostNotification = async (subscribers, post) => {
  try {
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.FROM_EMAIL || 'Blog Newsletter <newsletter@yourdomain.com>',
          to: subscriber.email,
          subject: `New Post: ${post.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .excerpt { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
                .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>New Blog Post! 📝</h1>
              </div>
              <div class="content">
                <h2>${post.title}</h2>
                ${post.excerpt ? `
                  <div class="excerpt">
                    <strong>Excerpt:</strong>
                    <p>${post.excerpt}</p>
                  </div>
                ` : ''}
                <p><strong>Author:</strong> ${post.author.username}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.BASE_URL}/api/posts/${post.slug}" class="button">Read Full Post</a>
                </div>
                <div class="footer">
                  <p>You're receiving this email because you subscribed to updates from our blog.</p>
                  <p>
                    <a href="${process.env.BASE_URL}/api/newsletter/unsubscribe?email=${subscriber.email}" style="color: #666;">Unsubscribe from notifications</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (error) {
          console.error(`Error sending new post notification to ${subscriber.email}:`, error);
          throw error;
        }

        return { success: true, email: subscriber.email, data };
      } catch (error) {
        console.error(`Failed to send new post notification to ${subscriber.email}:`, error);
        return { success: false, email: subscriber.email, error };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    return { successful, failed, results };
  } catch (error) {
    console.error('Error in sendNewPostNotification:', error);
    throw new Error('Failed to send new post notifications');
  }
};

export default resend;