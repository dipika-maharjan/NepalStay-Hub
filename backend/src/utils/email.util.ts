import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"NepalStay-Hub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your NepalStay-Hub account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">NepalStay-Hub Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="color: #1f2937; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not create an account, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: `"NepalStay-Hub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your NepalStay-Hub password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Click below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Reset Password
          </a>
        </div>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};

export const sendAccountLockedEmail = async (
  email: string,
  lockoutMinutes: number,
): Promise<void> => {
  await transporter.sendMail({
    from: `"NepalStay-Hub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "NepalStay-Hub: Account temporarily locked",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Account Temporarily Locked</h2>
        <p>Your account has been locked due to multiple failed login attempts.</p>
        <p>Please try again in <strong>${lockoutMinutes} minutes</strong>.</p>
        <p>If this was not you, contact support immediately.</p>
      </div>
    `,
  });
};
