type Elem<T> = {
  data: T;
  priority: number;
};

export class Heap<T> {
  private elems: Elem<T>[] = [];

  pop() {
    const n = this.elems.length;
    if (n === 0) {
      return undefined;
    }

    const elem = this.elems[0];
    this.elems[0] = this.elems[n - 1];
    this.elems.pop();
    this.heapify(0);

    return elem.data;
  }

  peek() {
    const n = this.elems.length;
    if (n === 0) {
      return undefined;
    }

    const elem = this.elems[0];
    return elem.data;
  }

  push(data: T, priority: number) {
    const elem: Elem<T> = { data, priority };
    this.elems.push(elem);

    let n = this.elems.length - 1;
    while (n > 0) {
      const parent = this.parent(n);
      if (this.less(n, parent)) {
        this.swap(n, parent);
        n = parent;
      } else {
        break;
      }
    }
  }

  private heapify(i: number) {
    const left = this.left(i);
    const right = this.right(i);
    let largest = i;
    const len = this.elems.length;

    if (left < len && this.less(left, largest)) {
      largest = left;
    }
    if (right < len && this.less(right, largest)) {
      largest = right;
    }

    if (largest != i) {
      this.swap(i, largest);
      this.heapify(largest);
    }
  }

  private swap(i: number, j: number) {
    const temp = this.elems[j];
    this.elems[j] = this.elems[i];
    this.elems[i] = temp;
  }
  private less(i: number, j: number) {
    return this.elems[i].priority < this.elems[j].priority;
  }
  private left(i: number) {
    return 2 * i + 1;
  }
  private right(i: number) {
    return 2 * i + 2;
  }
  private parent(i: number) {
    return (i - 1) / 2;
  }
}
