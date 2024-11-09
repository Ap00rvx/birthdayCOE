import fs from 'fs';
import csv from 'csv-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

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
    }
  });

  const mailOptions = {
    from: 'Team BDCOE <apoorvbraj@gmail.com>',  
    to: member.email,
    subject: 'Happy Birthday!',
    html: `
      <div style="text-align: center;">
        <h1>Happy Birthday ${member.name},</h1>
        <p>🎉🎂 Hope you have a wonderful day!</p>
        <p><strong>Team BDCoE</strong></p>
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
    const members = await readMembersData('./members.csv');
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
