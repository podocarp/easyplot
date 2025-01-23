/** binary search, but specialized for the x y x y format of `points`.
 * Returns the index of the closest x coordinate to `x`.
 */
export function binSearchPointX(points: number[], x: number) {
  // Think of us as grouping all elements into pairs. top bot mid are all
  // indices in terms of pairs, to simplify calculation. We just need to convert
  // mid to actual array indices by multiplying by 2.
  let top = points.length / 2 - 1;
  let bot = 0;

  while (bot <= top) {
    const mid = Math.trunc((top + bot) / 2);
    const elem = points[mid * 2];
    if (elem < x) {
      bot = mid + 1;
    } else if (elem > x) {
      top = mid - 1;
    } else {
      return mid * 2;
    }
  }

  // top is now pointing at the element to the left of x.
  // do a check to see which is closer to x, top or the element after top.
  const targetIndex = top * 2;
  if (targetIndex == points.length - 2) {
    return targetIndex;
  }

  if (x - points[targetIndex] < points[targetIndex + 2] - x) {
    return targetIndex;
  }
  return targetIndex + 2;
}
