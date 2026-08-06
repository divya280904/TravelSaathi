import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOtpEmailContent } from '../utils/emailService.js';

test('buildOtpEmailContent includes the OTP and reset instructions', () => {
  const mail = buildOtpEmailContent({ to: 'traveler@example.com', otp: '123456', username: 'travelbuddy' });
  assert.match(mail.subject, /OTP/i);
  assert.match(mail.text, /123456/);
  assert.match(mail.html, /123456/);
});
