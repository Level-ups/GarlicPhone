export function toCamelCase<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase<T>(v)) as any;
  } else if (typeof obj === 'object') {
    return Object.keys(obj).reduce((result: any, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
}