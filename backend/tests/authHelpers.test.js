import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOtpCode, validateCaptcha } from '../utils/authHelpers.js';

test('generateOtpCode returns a six digit code', () => {
  const otp = generateOtpCode();
  assert.match(otp, /^\d{6}$/);
});

test('validateCaptcha verifies simple arithmetic questions', () => {
  assert.equal(validateCaptcha('7 + 3', 10), true);
  assert.equal(validateCaptcha('7 - 3', 10), false);
  assert.equal(validateCaptcha('invalid', 0), false);
});
