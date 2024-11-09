import fs from 'fs';
import csv from 'csv-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path' ;

dotenv.config();
const filePath = path.join(process.cwd(), 'public', 'members.csv');

const readMembersData = (filePath) => {
  return new Promise((resolve, reject) => {
    const members = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => members.push(row))
      .on('end', () => resolve(members))
      .on('error', (error) => reject(error));
  });
};


const sendBirthdayEmail = async (member) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    },
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  });
  

  const mailOptions = {
    from: 'Team BDCOE <apoorvbraj@gmail.com>',  
    to: member.email,
    subject: 'Happy Birthday!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: center; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
  <h1 style="color: #4CAF50;">🎉 Happy Birthday, ${member.name}! 🎉</h1>
  
  <p style="font-size: 1.1em; line-height: 1.6;">
    On behalf of everyone at <strong>BDCOE</strong>, we want to take this moment to celebrate you and all that you bring to our team.
  </p>
  
  <p style="font-size: 1.1em; line-height: 1.6;">
    We hope your day is filled with joy, laughter, and special moments. May the year ahead bring new opportunities, growth, and fulfillment, both personally and professionally.
  </p>

  <p style="font-size: 1.1em; line-height: 1.6;">
    Thank you for being such a valuable part of our community. Wishing you a fantastic birthday and a wonderful year ahead!
  </p>

  <p style="margin-top: 20px; font-weight: bold;">
    Cheers,<br>
    Team BDCOE 🎂🎈
  </p>
</div>

    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Birthday email sent to ${member.name}`);
};

const sendAdminAlert = async (members) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    },
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  });
  
  const mailOptions = {
    from: 'Team BDCOE <apoorvbraj@gmail.com>',
    to: 'apurvabraj@gmail.com',  
    subject: 'Birthday Alert',
    text: `Today is the birthday of: ${members.map(m => m.name).join(', ')}`,
  };

  await transporter.sendMail(mailOptions);
  console.log("Admin alert sent with today's birthdays");
};

export default async function handler(req, res) {
  try {
    const members = await readMembersData(filePath);
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const birthdayMembers = members.filter(member => {
      const [day, month, year] = member.birthday.split('-');
      return `${day}-${month}` === todayStr;
    });

    for (const member of birthdayMembers) {
      await sendBirthdayEmail(member);
    }

    if (birthdayMembers.length > 0) {
      await sendAdminAlert(birthdayMembers);
    }

    res.status(200).json({ message: 'Birthday emails sent successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}
