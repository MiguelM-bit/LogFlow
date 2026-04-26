function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isRepeatedSequence(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

function calculateCpfCheckDigit(cpfBase: string, factor: number): number {
  const total = cpfBase
    .split("")
    .reduce((sum, digit) => sum + Number(digit) * factor--, 0);

  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function calculateCnpjCheckDigit(cnpjBase: string, factors: number[]): number {
  const total = cnpjBase
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);

  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function normalizeDocument(value: string): string {
  return onlyDigits(value);
}

export function formatCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function validarCPF(cpf: string): boolean {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11) return false;
  if (isRepeatedSequence(digits)) return false;

  const base = digits.slice(0, 9);
  const firstDigit = calculateCpfCheckDigit(base, 10);
  const secondDigit = calculateCpfCheckDigit(`${base}${firstDigit}`, 11);

  return digits === `${base}${firstDigit}${secondDigit}`;
}

export function validarCNPJ(cnpj: string): boolean {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14) return false;
  if (isRepeatedSequence(digits)) return false;

  const base = digits.slice(0, 12);
  const firstDigit = calculateCnpjCheckDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCnpjCheckDigit(`${base}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits === `${base}${firstDigit}${secondDigit}`;
}

export const validators = {
  cpf: validarCPF,
  cnpj: validarCNPJ,
};