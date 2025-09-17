export const mockThree = {
  Scene: class Scene {
    children: any[] = [];
    add = (obj: any) => this.children.push(obj);
    remove = (obj: any) => {
      this.children = this.children.filter((c) => c !== obj);
    };
  },
  PerspectiveCamera: class PerspectiveCamera {},
  Vector3: class Vector3 {
    constructor(public x = 0, public y = 0, public z = 0) {}
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    equals(v: any) {
      return this.x === v.x && this.y === v.y && this.z === v.z;
    }
  },
  Color: class Color {
    constructor(public hex: string | number) {}
    getHexString = () => this.hex.toString(16).padStart(6, '0');
  },
};
