import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Boolean(process.env.SMTP_SECURE === 'true'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const buildOtpEmailContent = ({ to, otp, username }) => ({
    to,
    subject: "TravelSaathi Password Reset OTP",
    text: `Hi ${username || "there"},

Use the following OTP to reset your password: ${otp}

This code expires in 10 minutes.`,
    html: `
    <p>Hi ${username || "there"},</p>
    <p>Use the following OTP to reset your password:</p>
    <h2>${otp}</h2>
    <p>This code expires in <strong>10 minutes</strong>.</p>
  `,
});

export const sendOtpEmail = async ({ to, otp, username }) => {
    if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
    ) {
        console.warn("SMTP credentials are not configured. OTP email was not sent.");
        return { ok: false, skipped: true };
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        ...buildOtpEmailContent({ to, otp, username }),
    };

    await transporter.sendMail(mailOptions);

    await transporter.sendMail(mailOptions);

    return { ok: true };
};
