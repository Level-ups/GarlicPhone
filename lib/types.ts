//----- Type utils -----//

export type Either<A, B> = [A, undefined?] | [undefined, B];

export type IfEquals<X, Y, A=X, B=never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B;

export type WritableKeys<T> = Exclude<{
  [K in keyof T]: IfEquals<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] },
    K
  >
}[keyof T], undefined>;


export type Generator<T, Args extends any[] = []> = T | ((...args: Args) => T);

//----- Value utils -----//

// If the object is a function, call it
// Otherwise, return it's value
export function tryCall<T>(x: T, args: any[] = []) {
  if (typeof x === "function") return x(...args);
  return x;
}

// Run generator with args if its a function, otherwise just return it's value
export function generate<T, Args extends any[]>(x: Generator<T, Args>, args: Args): T {
  return (typeof x === "function") ? (x as (_: Args) => T)(args) : x;
}

// Generate a random hexadecimal string of length `n`
export function randHex(n: number) {
  return [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}