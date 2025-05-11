export function deepCloneWithPrototype<T extends Object>(obj: T, hash = new WeakMap<any, any>()): T {
  // Return primitives or functions as-is
  if (Object(obj) !== obj || obj instanceof Function) {
    return obj;
  }

  // Return cached clone for circular references
  if (hash.has(obj)) {
    return hash.get(obj);
  }

  // Handle built-in types
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as any;
  }

  // Create a new object with the same prototype
  const clone = Object.create(Object.getPrototypeOf(obj));

  // Cache before recursion
  hash.set(obj, clone);

  // Clone and define all own properties (including symbols)
  for (const key of Reflect.ownKeys(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc) {
      if ('value' in desc) {
        desc.value = deepCloneWithPrototype(desc.value, hash);
      }
      Object.defineProperty(clone, key, desc);
    }
  }

  return clone;
}
