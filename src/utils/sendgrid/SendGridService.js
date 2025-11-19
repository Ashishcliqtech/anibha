const Brevo = require('@getbrevo/brevo');
const { InternalServerError } = require('http-errors');
const logger = require('../logger');
const EmailTemplates = require('../constant/EmailTemplates');
const config = require('../../config/config');

class SendGridService {
  constructor() {
    const brevoClient = Brevo.ApiClient.instance;
    const apiKey = brevoClient.authentications['api-key'];
    apiKey.apiKey = config.BREVO_API_KEY;

    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.fromEmail = config.BREVO_FROM_EMAIL;
    this.toEmail = config.ADMIN_EMAIL_ENQUIRY;
  }

  async sendMail(to, subject, textContent, htmlContent) {
    const sendSmtpEmail = {
      sender: { email: this.fromEmail },
      to: [{ email: to }],
      subject: subject,
      textContent,
      htmlContent,
    };

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      logger.info(`✅ Email sent to ${to}`);
    } catch (error) {
      logger.error(`❌ Error sending email to ${to}: ${error.message}`);
      if (error.response?.body) {
        logger.error(
          `Brevo Error Response: ${JSON.stringify(error.response.body)}`
        );
      }
      throw new InternalServerError(`Error sending email to ${to}`);
    }
  }

  async sendOtp(userName, email, otp) {
    const subject = EmailTemplates.sendOtp.subject;
    const text = EmailTemplates.sendOtp.text(userName, otp);
    const html = EmailTemplates.sendOtp.html(userName, otp);
    await this.sendMail(email, subject, text, html);
  }

  async sendEnquiryEmail(fullName, email, phone, message) {
    const subject = `New Enquiry from ${fullName}`;
    const text = EmailTemplates.sendEnquiry.text(fullName, email, phone, message);
    const html = EmailTemplates.sendEnquiry.html(fullName, email, phone, message);
    await this.sendMail(this.toEmail, subject, text, html);
  }

  async sendAutoReplyToUser(fullName, email) {
    const subject = EmailTemplates.sendAutoReply.subject;
    const text = EmailTemplates.sendAutoReply.text(fullName, email);
    const html = EmailTemplates.sendAutoReply.html(fullName, email);
    await this.sendMail(email, subject, text, html);
  }
}

module.exports = new SendGridService();
