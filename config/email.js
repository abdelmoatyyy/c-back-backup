const Mailjet = require('node-mailjet');
require('dotenv').config();

// Initialize Mailjet with credentials from .env
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
);

module.exports = mailjet;
