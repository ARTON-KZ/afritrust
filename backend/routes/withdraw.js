const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { stmts } = require('../db');

function reference() {
  return 'AFT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Public withdrawal/payout request. Requires a valid single-use code from the
// Telegram admin; only then is the request saved and shown to the admin.
router.post('/', (req, res) => {
  try {
    const {
      full_name, contact, amount, currency, fee,
      beneficiary_bank_name, beneficiary_account_name, beneficiary_account_number,
      beneficiary_account_type, beneficiary_bank_country, routine_bank_code, otp,
    } = req.body;

    if (!full_name || !String(full_name).trim()) {
      return res.status(400).json({ error: 'Your name is required.' });
    }
    if (!beneficiary_bank_name || !beneficiary_account_name || !beneficiary_account_number) {
      return res.status(400).json({ error: 'Bank name, account name and account number are required.' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Enter a valid amount.' });
    }
    if (!otp) {
      return res.status(400).json({ error: 'A confirmation code is required.' });
    }

    // Validate the code — must exist and be unused. Nothing is saved otherwise.
    const code = String(otp).trim().toUpperCase();
    const otpRow = stmts.getActiveOtpByCode.get({ code });
    if (!otpRow) {
      return res.status(401).json({
        error: 'Invalid or already-used confirmation code. Please check the code from the Telegram admin.',
      });
    }
    stmts.markOtpUsed.run({ id: otpRow.id });

    const ref = reference();
    stmts.insertWithdrawal.run({
      reference: ref,
      full_name: String(full_name).trim(),
      contact: (contact || '').trim() || null,
      amount: amt,
      currency: (currency || 'NGN').trim().toUpperCase(),
      fee: Number(fee) || 0,
      beneficiary_bank_name: String(beneficiary_bank_name).trim(),
      beneficiary_account_name: String(beneficiary_account_name).trim(),
      beneficiary_account_number: String(beneficiary_account_number).trim(),
      beneficiary_account_type: (beneficiary_account_type || '').trim() || null,
      beneficiary_bank_country: (beneficiary_bank_country || '').trim() || null,
      routine_bank_code: (routine_bank_code || '').trim() || null,
      otp_code: code,
    });

    res.json({ success: true, reference: ref });
  } catch (err) {
    console.error('Withdraw error:', err.message);
    res.status(500).json({ error: 'Failed to submit your request.' });
  }
});

module.exports = router;
