import { toExponential } from "../general";

test("toExponential works", () => {
  for (let i = -10; i < 10; i++) {
    expect(toExponential(10 ** i, 10).exponent).toBe(i);
    expect(toExponential(1.2 * 10 ** i, 10).exponent).toBe(i);
    expect(toExponential(0.8 * 10 ** i, 10).exponent).toBe(i - 1);
  }
});
