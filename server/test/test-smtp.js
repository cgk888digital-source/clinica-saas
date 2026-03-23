require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTPConnection() {
    console.log('🔄 Checking SMTP Configuration...');
    console.log(`- Host: ${process.env.SMTP_HOST}`);
    console.log(`- Port: ${process.env.SMTP_PORT}`);
    console.log(`- Secure Mode: ${process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'SSL' || parseInt(process.env.SMTP_PORT) === 465}`);
    console.log(`- Email auth user: ${process.env.SMTP_EMAIL}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'SSL' || parseInt(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    try {
        console.log('\n⏳ Attempting to verify connection to the mail server...');
        await transporter.verify();

        console.log('\n✅ SUCCESS: Connection established and authenticated successfully!');
        console.log('         Your SMTP backend configuration is ready to send emails.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR: Could not connect or authenticate to the SMTP server.');
        console.error('\nDetails:');
        console.error(error);
        process.exit(1);
    }
}

testSMTPConnection();
