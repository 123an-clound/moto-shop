export function calculateInstallment(
  price: number,
  downPercent: number,
  months: number,
  annualRate: number,
) {
  const downPayment = Math.round((price * downPercent) / 100);
  const principal = Math.max(0, price - downPayment);
  const rate = annualRate / 100 / 12;
  const monthlyPayment =
    principal === 0
      ? 0
      : rate === 0
        ? principal / months
        : (principal * rate * Math.pow(1 + rate, months)) /
          (Math.pow(1 + rate, months) - 1);
  return {
    downPayment,
    principal,
    monthlyPayment: Math.ceil(monthlyPayment),
    totalInterest: Math.max(0, Math.round(monthlyPayment * months - principal)),
  };
}
