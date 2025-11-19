exports.sendOtp = {
  subject: "Aspencask - OTP Verification",

  text: (firstName, otp) =>
    `Dear ${firstName},\n\nYour One Time Password (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nAspencask Team`,

  html: (firstName, otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        <h2 style="color: #1a73e8;">🔐 OTP Verification</h2>
        <p style="font-size: 16px;">Dear <strong>${firstName}</strong>,</p>
        <p style="font-size: 16px;">Your One Time Password (OTP) for Aspencask is:</p>
        <div style="margin: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: bold; color: #1a73e8;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #555;">This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
        <p style="font-size: 16px; margin-top: 30px;">Best regards,<br><strong>Team Aspencask</strong></p>
      </div>
      <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
        If you did not request this OTP, please ignore this email.
      </p>
    </div>
  `,
};

exports.sendEnquiry = {
  text: (fullName, email, phone, message) =>
    `New enquiry received:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,

  html: (fullName, email, phone, message) => `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #1a73e8;">📩 New Enquiry Received</h2>
      <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Full Name</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Message</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${message}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">Login to the admin panel to manage this enquiry.</p>
    </div>
  `,
};

exports.sendAutoReply = {
  subject: "Thank you for contacting Aspencask",

  text: (fullName) =>
    `Hello ${fullName},\n\nThank you for reaching out to Aspencask.\n\nWe’ve received your enquiry and our team will get back to you as soon as possible.\n\nIn the meantime, feel free to explore our software solutions or contact us if your enquiry is urgent.\n\nWarm regards,\nTeam Aspencask`,

  html: (fullName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        <h2 style="color: #1a73e8;">Hello ${fullName},</h2>
        <p style="font-size: 16px;">Thank you for contacting <strong>Aspencask</strong>.</p>
        <p style="font-size: 16px;">We’ve received your enquiry and our team will get back to you as soon as possible.</p>
        <p style="font-size: 16px;">In the meantime, feel free to explore our software solutions or reach out to us again if it’s urgent.</p>
        <p style="font-size: 16px; margin-top: 30px;">Warm regards,<br><strong>Team Aspencask</strong></p>
      </div>
      <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
        This is an automated response. Please do not reply to this email.
      </p>
    </div>
  `,
};
