// utils/sendEmail.js

import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

export const sendResetPasswordEmail = async (email, otp) => {
  const mailOptions = {
    from: `"AI Medical Voice Agent" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Password Reset OTP",

    html: `
      <div style="
        max-width:600px;
        margin:auto;
        padding:30px;
        font-family:Arial,sans-serif;
        background:#f5f7fb;
        border-radius:10px;
      ">
        
        <div style="
          background:white;
          padding:30px;
          border-radius:10px;
          text-align:center;
        ">
          
          <h1 style="
            color:#2563eb;
            margin-bottom:10px;
          ">
            AI Medical Voice Agent
          </h1>

          <p style="
            color:#555;
            font-size:16px;
          ">
            We received a request to reset your password.
          </p>

          <div style="
            margin:30px 0;
          ">
            <p style="
              font-size:14px;
              color:#777;
              margin-bottom:10px;
            ">
              Your OTP Code
            </p>

            <h2 style="
              letter-spacing:8px;
              background:#2563eb;
              color:white;
              display:inline-block;
              padding:15px 25px;
              border-radius:8px;
              font-size:32px;
            ">
              ${otp}
            </h2>
          </div>

          <p style="
            color:#666;
            font-size:14px;
          ">
            This OTP will expire in 
            <strong>5 minutes</strong>.
          </p>

          <p style="
            margin-top:25px;
            color:#999;
            font-size:13px;
          ">
            If you did not request a password reset,
            you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
