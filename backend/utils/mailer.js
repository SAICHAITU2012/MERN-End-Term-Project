import nodemailer from "nodemailer";

// Email alerts are an optional extra channel — the product works fully
// with in-app + browser notifications when SMTP is not configured.

const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transporter = null;
if (isConfigured()) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}

export const sendMail = async ({ to, subject, text }) => {
    if (!transporter) return false;
    try {
        await transporter.sendMail({
            from: process.env.MAIL_FROM || "MedMate <no-reply@medmate.app>",
            to,
            subject,
            text,
        });
        return true;
    } catch (error) {
        console.error("[mailer] failed:", error.message);
        return false;
    }
};

export default sendMail;
