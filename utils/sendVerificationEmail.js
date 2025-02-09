import nodemailer from 'nodemailer';
import { EMAIL_PORT, HOST, PASS, SECURE, SERVICE, USER } from '../config.js';

export const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: HOST,
            service: SERVICE,
            port: Number(EMAIL_PORT),
            secure: Boolean(SECURE),
            auth: {
                user: USER,
                pass: PASS
            }
        });

        await transporter.sendMail({
            from: USER,
            to: email,
            subject: subject,
            text: text
        });
    } catch (error) {
        console.error(error, "Unable to send email")
        return error;
    }
};