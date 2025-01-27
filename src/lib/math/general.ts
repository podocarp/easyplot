export function toExponential(x: number, base: number) {
  let exponent = 0;
  if (x === 0) return { mantissa: 0, exponent: 0 };
  if (x < 0) {
    x = -x;
  }

  while (x >= base) {
    x /= base;
    exponent++;
  }
  while (x < 1) {
    x *= base;
    exponent--;
  }
  return { mantissa: x, exponent };
}
