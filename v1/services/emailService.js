import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send newsletter to multiple subscribers
export const sendNewsletter = async (subscribers, subject, content) => {
  try {
    console.log(`📧 Preparing to send newsletter to ${subscribers.length} subscribers`);

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const msg = {
          to: subscriber.email,
          from: process.env.FROM_EMAIL || 'blog@example.com',
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
                    <a href="${process.env.BASE_URL}/v1/newsletter/unsubscribe?email=${subscriber.email}" style="color: #666;">Unsubscribe from our newsletter</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await sgMail.send(msg);
        console.log(`✅ Email sent successfully to: ${subscriber.email}`);
        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`❌ Failed to send email to ${subscriber.email}:`, error.response?.body || error.message);
        return { success: false, email: subscriber.email, error: error.response?.body || error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    console.log(`📊 Newsletter Results: ${successful} successful, ${failed} failed`);

    return { 
      successful, 
      failed, 
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason) 
    };
  } catch (error) {
    console.error('❌ Error in sendNewsletter:', error);
    throw new Error('Failed to send newsletter');
  }
};

// Send welcome email to new subscribers
export const sendWelcomeEmail = async (email) => {
  try {
    console.log(`📧 Sending welcome email to: ${email}`);

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'blog@example.com',
      subject: 'Welcome to our newsletter!',
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
            <h1>Welcome to our newsletter! 🎉</h1>
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
              <a href="${process.env.BASE_URL}/v1/posts" class="button">Explore Our Blog</a>
            </div>
            <div class="footer">
              <p>If you change your mind, you can <a href="${process.env.BASE_URL}/v1/newsletter/unsubscribe?email=${email}">unsubscribe</a> at any time.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log('✅ Welcome email sent successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.response?.body || error.message);
    throw new Error(`Failed to send welcome email: ${error.response?.body || error.message}`);
  }
};

// Send new post notification
export const sendNewPostNotification = async (subscribers, post) => {
  try {
    console.log(`📧 Notifying ${subscribers.length} subscribers about new post: ${post.title}`);

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const msg = {
          to: subscriber.email,
          from: process.env.FROM_EMAIL || 'blog@example.com',
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
                  <a href="${process.env.BASE_URL}/v1/posts/${post.slug}" class="button">Read Full Post</a>
                </div>
                <div class="footer">
                  <p>You're receiving this email because you subscribed to updates from our blog.</p>
                  <p>
                    <a href="${process.env.BASE_URL}/v1/newsletter/unsubscribe?email=${subscriber.email}" style="color: #666;">Unsubscribe from notifications</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await sgMail.send(msg);
        console.log(`✅ New post notification sent to: ${subscriber.email}`);
        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`❌ Failed to send new post notification to ${subscriber.email}:`, error.response?.body || error.message);
        return { success: false, email: subscriber.email, error: error.response?.body || error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    console.log(`📊 New Post Notification Results: ${successful} successful, ${failed} failed`);

    return { successful, failed, results };
  } catch (error) {
    console.error('❌ Error in sendNewPostNotification:', error);
    throw new Error('Failed to send new post notifications');
  }
};


// Send welcome email to new users after signup
export const sendUserWelcomeEmail = async (user) => {
    try {
      console.log(`📧 Sending user welcome email to: ${user.email}`);
  
    //   const transporter = createTransporter();
  
      const msg = {
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: `Welcome to Our Blog, ${user.username}! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; }
              .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
              .content { padding: 40px 30px; }
              .welcome-text { font-size: 18px; margin-bottom: 25px; color: #555; }
              .features { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
              .feature-item { display: flex; align-items: center; margin-bottom: 15px; }
              .feature-icon { font-size: 20px; margin-right: 15px; width: 30px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .profile-info { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; padding: 25px; color: #666; font-size: 14px; border-top: 1px solid #eee; }
              .social-links { margin: 20px 0; }
              .social-link { display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">Welcome Aboard! 🚀</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">We're thrilled to have you join our community</p>
              </div>
              
              <div class="content">
                <div class="welcome-text">
                  <h2>Hello, ${user.username}! 👋</h2>
                  <p>Thank you for creating an account with us. Your blogging journey starts now!</p>
                </div>
  
                <div class="profile-info">
                  <h3 style="margin-top: 0; color: #667eea;">Your Account Details</h3>
                  <p><strong>Username:</strong> ${user.username}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <p><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
  
                <div class="features">
                  <h3 style="margin-top: 0; color: #764ba2;">What You Can Do Now:</h3>
                  
                  <div class="feature-item">
                    <span class="feature-icon">📝</span>
                    <div>
                      <strong>Read Amazing Content</strong>
                      <p style="margin: 5px 0 0; color: #666;">Explore our collection of blog posts and discover new perspectives.</p>
                    </div>
                  </div>
  
                  ${user.role === 'admin' ? `
                  <div class="feature-item">
                    <span class="feature-icon">✍️</span>
                    <div>
                      <strong>Create & Manage Posts</strong>
                      <p style="margin: 5px 0 0; color: #666;">As an admin, you can write, edit, and publish blog posts.</p>
                    </div>
                  </div>
                  ` : ''}
  
                  <div class="feature-item">
                    <span class="feature-icon">🔔</span>
                    <div>
                      <strong>Stay Updated</strong>
                      <p style="margin: 5px 0 0; color: #666;">Get notified about new posts and community updates.</p>
                    </div>
                  </div>
  
                  <div class="feature-item">
                    <span class="feature-icon">💬</span>
                    <div>
                      <strong>Join the Conversation</strong>
                      <p style="margin: 5px 0 0; color: #666;">Be part of our growing community of readers and writers.</p>
                    </div>
                  </div>
                </div>
  
                <div style="text-align: center;">
                  <a href="${process.env.BASE_URL}/api/posts" class="cta-button">Start Exploring Posts</a>
                </div>
  
                ${user.role === 'admin' ? `
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${process.env.BASE_URL}/admin/dashboard" class="cta-button" style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);">Go to Admin Dashboard</a>
                </div>
                ` : ''}
              </div>
  
              <div class="footer">
                <p><strong>Need Help?</strong></p>
                <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
                
                <div class="social-links">
                  <a href="#" class="social-link">Help Center</a> • 
                  <a href="#" class="social-link">Contact Support</a> • 
                  <a href="#" class="social-link">Community Forum</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #999;">
                  You're receiving this email because you recently created an account on our blog.<br>
                  If this wasn't you, please contact our support team immediately.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  
      await sgMail.send(msg);
      console.log('✅ User welcome email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send user welcome email:', error.message);
      throw new Error(`Failed to send user welcome email: ${error.message}`);
    }
  };

export default sgMail;
