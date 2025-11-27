require('dotenv').config();
const mailjet = require('./config/email');

const testEmail = async () => {
    console.log('Testing Mailjet configuration...');
    console.log('Public Key Present:', !!process.env.MJ_APIKEY_PUBLIC);
    console.log('Private Key Present:', !!process.env.MJ_APIKEY_PRIVATE);
    console.log('Sender Email:', process.env.MAIL_SENDER);

    try {
        const request = mailjet
            .post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": process.env.MAIL_SENDER,
                            "Name": "Test Sender"
                        },
                        "To": [
                            {
                                "Email": "ahmedabdelmoaty06@gmail.com", // Using the email from conversation history
                                "Name": "Test Recipient"
                            }
                        ],
                        "Subject": "Test Email from Script",
                        "TextPart": "This is a test email to verify Mailjet configuration.",
                        "HTMLPart": "<h3>This is a test email to verify Mailjet configuration.</h3>"
                    }
                ]
            });

        const result = await request;
        console.log('Email sent successfully!');
        console.log('Status:', result.response.status);
        console.log('Data:', JSON.stringify(result.body, null, 2));

    } catch (error) {
        console.error('Error sending email:');
        console.error('Status Code:', error.statusCode);
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('Response Body:', JSON.stringify(error.response.body, null, 2));
        }
    }
};

testEmail();
