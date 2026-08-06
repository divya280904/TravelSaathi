export const generateOtpCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const validateCaptcha = (question, answer) => {
  if (!question || typeof answer !== 'number') return false;

  const normalized = question.trim();
  const match = normalized.match(/^(\d+)\s*([+\-*/])\s*(\d+)$/);
  if (!match) return false;

  const [, left, operator, right] = match;
  const a = Number(left);
  const b = Number(right);

  switch (operator) {
    case '+':
      return a + b === answer;
    case '-':
      return a - b === answer;
    case '*':
      return a * b === answer;
    case '/':
      return b !== 0 && a / b === answer;
    default:
      return false;
  }
};
