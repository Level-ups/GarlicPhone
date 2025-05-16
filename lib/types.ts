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