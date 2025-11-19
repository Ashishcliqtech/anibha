const axios = require('axios');
const config = require('../config/config');

const INSTAMOJO_ENDPOINT = config.INSTAMOJO_MODE === 'live'
  ? 'https://www.instamojo.com/api/1.1/payment-requests/'
  : 'https://test.instamojo.com/api/1.1/payment-requests/';

const headers = () => ({
  'X-Api-Key': config.INSTAMOJO_API_KEY,
  'X-Auth-Token': config.INSTAMOJO_AUTH_TOKEN,
  'Content-Type': 'application/json'
});

async function createPaymentRequest({ purpose, amount, buyer_name, email, phone, redirect_url, webhook }) {
  const payload = {
    purpose,
    amount: amount.toFixed ? amount.toFixed(2) : amount,
    buyer_name,
    email,
    phone,
    redirect_url,
    webhook
  };

  const resp = await axios.post(INSTAMOJO_ENDPOINT, payload, { headers: headers() });
  // Instamojo returns data under resp.data
  return resp.data;
}

module.exports = { createPaymentRequest };
