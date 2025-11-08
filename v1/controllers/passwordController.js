import User from '../models/user.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/emailService.js';
import { validationResult } from 'express-validator';
import crypto from 'crypto';

export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Failed to process password reset request'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    user.password = password;
    user.clearResetToken();
    await user.save();

    try {
      await sendPasswordChangedEmail(user.email);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Failed to reset password'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    try {
      await sendPasswordChangedEmail(user.email);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password'
    });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      valid: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      valid: false,
      message: 'Failed to validate token'
    });
  }
};