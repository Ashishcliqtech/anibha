const axios = require('axios');
const nodemailer = require('nodemailer');
const logger = require('../logger');
const config = require('../../config/config');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const API_KEY = process.env.BREVO_API_KEY || config.BREVO_API_KEY;
const FROM_NAME = process.env.SENDER_NAME || config.BREVO_FROM_NAME || 'No Reply';
const FROM_EMAIL = process.env.SENDER_EMAIL || config.BREVO_FROM_EMAIL || config.BREVO_FROM_EMAIL;
const ADMIN_ENQUIRY_EMAIL = process.env.ADMIN_EMAIL_ENQUIRY || config.ADMIN_EMAIL_ENQUIRY;

async function sendEmail({ to, subject, htmlContent }) {
  try {
    const payload = {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    const res = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    logger.info('Email sent successfully', { to, messageId: res.data.messageId || 'via-api' });
    return res.data;
  } catch (error) {
    // Log full response body if available for debugging
    const brevoResp = error.response?.data || error.response?.body || null;
    logger.error('Error sending email via Brevo API', {
      to,
      message: error.message,
      brevoResponse: brevoResp,
    });

    // Attempt SMTP fallback using nodemailer if SMTP config present
    const smtpHost = process.env.EMAIL_HOST || config.EMAIL_HOST;
    const smtpUser = process.env.EMAIL_USER || config.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS || config.EMAIL_PASS;
    const smtpPort = process.env.EMAIL_PORT || config.EMAIL_PORT;
    const smtpSecure = (process.env.EMAIL_SECURE || config.EMAIL_SECURE) === 'true' || false;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort) || 465,
          secure: smtpSecure, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to,
          subject,
          html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent via SMTP fallback', { to, messageId: info.messageId });
        return { via: 'smtp', info };
      } catch (smtpErr) {
        logger.error('SMTP fallback failed', { to, error: smtpErr.message || smtpErr });
      }
    } else {
      logger.warn('SMTP fallback not configured; skipping SMTP send');
    }

    // If we reach here, both HTTP API and SMTP (if attempted) failed
    throw new Error('Could not send email via Brevo HTTP API or SMTP fallback');
  }
}

async function sendOtp(userName, email, otp) {
  const emailHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #555; text-align: center;">Your One-Time Password</h2>
      <p style="text-align: center;">Hello ${userName || ''}, use the following OTP to complete your verification (valid for 5 minutes):</p>
      <p style="font-size: 28px; font-weight: bold; color: #fff; background-color: #007BFF; padding: 12px 20px; border-radius: 5px; display: inline-block; margin: 20px auto; text-align: center;">
        ${otp}
      </p>
      <p style="text-align: center;">If you did not request this code, please ignore this email.</p>
    </div>
  </div>`;

  return sendEmail({ to: email, subject: 'Your Verification OTP', htmlContent: emailHtml });
}

async function sendPasswordReset(email, token) {
  const resetLink = `${process.env.FRONTEND_URL || config.FRONTEND_URL}/reset-password?token=${token}`;
  const emailHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #555; text-align: center;">Password Reset Request</h2>
      <p style="text-align: center;">Click the button below to set a new password (valid for 15 minutes):</p>
      <div style="text-align:center;">
        <a href="${resetLink}" style="display:inline-block; padding:12px 24px; margin:20px 0; font-size:16px; color:#fff; background-color:#007BFF; text-decoration:none; border-radius:5px;">
          Reset Your Password
        </a>
      </div>
      <p style="font-size: 12px; color: #777; text-align:center;">
        If the button above doesn't work, copy and paste this link:<br>
        <a href="${resetLink}" style="color:#007BFF;">${resetLink}</a>
      </p>
    </div>
  </div>`;

  return sendEmail({ to: email, subject: 'Reset Your Password', htmlContent: emailHtml });
}

async function sendEnquiryEmail(fullName, email, phone, message) {
  const subject = `New Enquiry from ${fullName}`;
  const html = `
    <h3>New Enquiry</h3>
    <p><strong>Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
    <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
  `;

  const to = ADMIN_ENQUIRY_EMAIL || FROM_EMAIL;
  return sendEmail({ to, subject, htmlContent: html });
}

async function sendAutoReplyToUser(fullName, email) {
  const subject = 'Thanks for contacting us';
  const html = `
    <div style="font-family:Arial, sans-serif;">
      <p>Hi ${fullName || ''},</p>
      <p>Thanks for reaching out. We have received your enquiry and will get back to you shortly.</p>
      <p>— Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, htmlContent: html });
}

async function sendSupportEmail(to, subject, textContent) {
  const htmlContent = `<p>${(textContent || '').replace(/\n/g, '<br/>')}</p>`;
  return sendEmail({ to, subject, htmlContent });
}

module.exports = {
  sendOtp,
  sendPasswordReset,
  sendEnquiryEmail,
  sendAutoReplyToUser,
  sendSupportEmail,
};
