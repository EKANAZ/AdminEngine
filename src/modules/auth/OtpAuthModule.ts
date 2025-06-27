import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// Email configuration - supports multiple providers
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
};

const OTP_STORE: Record<string, { otp: string; expires: number }> = {};

function sendOtpEmail(to: string, otp: string) {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    return Promise.resolve();
  }

  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  return transporter.sendMail({
    from: EMAIL_CONFIG.auth.user,
    to,
    subject: 'Your OTP Code - AdminEngine',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from AdminEngine.</p>
      </div>
    `,
    text: `Your OTP code is: ${otp}. This code will expire in 5 minutes.`
  });
}

export class OtpAuthModule implements IModule {
  public router: Router;
  constructor() {
    this.router = Router();
  }
  initialize(): void {
    this.router.post('/auth/otp/request', async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
      OTP_STORE[email] = { otp, expires };
      
      if (EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
        try {
          await sendOtpEmail(email, otp);
          res.json({ message: 'OTP sent to email successfully' });
        } catch (error) {
          console.error('Email sending failed:', error);
          res.status(500).json({ error: 'Failed to send OTP email' });
        }
      } else {
        res.json({ 
          message: 'OTP generated (email not configured)', 
          otp,
          note: 'Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env for real email sending'
        });
      }
    });

    this.router.post('/auth/otp/verify', (req, res) => {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP required' });
      }
      
      const record = OTP_STORE[email];
      if (!record) {
        return res.status(400).json({ error: 'No OTP requested for this email' });
      }
      
      if (Date.now() > record.expires) {
        delete OTP_STORE[email];
        return res.status(400).json({ error: 'OTP has expired' });
      }
      
      if (otp !== record.otp) {
        return res.status(400).json({ error: 'Invalid OTP code' });
      }
      
      // OTP is valid
      delete OTP_STORE[email];
      res.json({ 
        message: 'OTP verified successfully',
        email: email
      });
    });
    // Dummy route to ensure router is always valid
    this.router.get('/__dummy', (req, res) => res.json({ ok: true }));
  }
} 