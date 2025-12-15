const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1️⃣ Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // your Gmail address
      pass: process.env.EMAIL_PASS, // your App Password (not your real password!)
    },
  });

  // 2️⃣ Email details
  const mailOptions = {
    from: `"RentAway" <${process.env.EMAIL_USER}>`,
    to: options.email, // recipient email
    subject: options.subject,
    html: options.message, // email body (HTML)
  };

  // 3️⃣ Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
