export class LRUCache {
  constructor() {
    this.map = new Map();
  }
  get(key) {
    return this.map.get(key);
  }
  set(key, value) {
    this.map.set(key, value);
    return this;
  }
  delete(key) {
    return this.map.delete(key);
  }
  has(key) {
    return this.map.has(key);
  }
}
export default LRUCache;