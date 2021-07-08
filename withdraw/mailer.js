const nodemailer = require("nodemailer");
const config = require("@crypto-signals/config");
const mailer = nodemailer.createTransport({
  host: config.mailer_host,
  port: 465,
  secure: true,
  auth: {
    user: config.mailer_user,
    pass: config.mailer_password
  }
});

const sendMail = (message, retries = 0) => {
  return new Promise(async resolve => {
    try {
      console.log("message: ", message);
      const data = {
        from: config.email_from,
        to: config.email_to,
        subject: "Funds Withdrawal",
        "h:Reply-To": config.email_from,
        text: message
      };
      await mailer.sendMail(data);
      console.log("Email sent.");
      return resolve();
    } catch (error) {
      if (retries === 2) {
        console.log("Email not sent.");
        return resolve();
      }
      if (retries < 2) {
        console.log("Unable to send the email.");
        console.error(error);
        console.log(`Retrying (${retries + 1})...`);
        return resolve(await sendMail(message, retries + 1));
      }
    }
  });
};

module.exports = { sendMail };
