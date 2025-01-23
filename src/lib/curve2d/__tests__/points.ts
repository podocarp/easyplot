import { binSearchPointX } from "../points";

test("binSearchPointX works", () => {
  const points: number[] = [];
  for (let i = 0; i < 10; i++) {
    // y coordinate doesn't matter, give a random value
    points.push(i * 10, -1);
  }
  // array ends up 0, -1, 10, -1, 20, -1, ...

  for (let i = 0; i < 10; i++) {
    const index = binSearchPointX(points, i * 10);
    expect(index).toBe(i * 2);
  }

  let index = binSearchPointX(points, 4);
  expect(points[index]).toBe(0);
  index = binSearchPointX(points, 6);
  expect(points[index]).toBe(10);
  index = binSearchPointX(points, 100000);
  expect(points[index]).toBe(90);
});
