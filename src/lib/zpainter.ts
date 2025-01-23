type RenderFunc = () => void;
type RenderFuncFactory<T> = (a: T) => RenderFunc;

type KeyZ = {
  key: string;
  zindex: number;
};

/** A simple class implementing the painter's algorithm. Factories producing a
 * render function are registered with the `register` function. Factories will
 * be called with an argument of `FactoryArgT` when creating the render function.
 * Render functions are called from the lowest z-index to the highest.
 */
export class ZPainter<FactoryArgT> {
  private renderFactories: Map<string, RenderFuncFactory<FactoryArgT>> =
    new Map();
  private renderFunctions: Map<string, RenderFunc> = new Map();
  private keyzs: KeyZ[] = [];

  public register(
    key: string,
    zindex: number,
    factory: RenderFuncFactory<FactoryArgT>
  ) {
    this.renderFactories.set(key, factory);
    this.keyzs.push({ key, zindex });
    // we are not expecting a large number of elements or frequent additions, so
    // simply sorting works fine
    this.keyzs.sort((a, b) => a.zindex - b.zindex);
  }

  render(arg: FactoryArgT) {
    for (let i = 0; i < this.keyzs.length; i++) {
      const { key } = this.keyzs[i];
      let func = this.renderFunctions.get(key);
      if (func) {
        func();
        continue;
      }

      const factory = this.renderFactories.get(key);
      if (!factory) {
        console.error("Missing render factory at key", key);
        continue;
      }
      func = factory(arg);
      this.renderFunctions.set(key, func);
      func();
    }
  }

  clear() {
    this.renderFactories.clear();
    this.renderFunctions.clear();
    this.keyzs = [];
  }
}
