import { type WritableKeys } from "./types.ts";

//---------- Global effect tracking ----------//
const effectStack: ((_: any) => void)[] = [];
let currSub: ((_: any) => void) | null = null;


//---------- Types ----------//
export type Signal<T> = {
  (): T;
  (newValue: T | ((v: T) => T)): void;
  get: () => T;
  set: (newValue: T | ((v: T) => T)) => void;
  sub: (fn: (v: T) => void) => void;
};

export type DerivedSignal<T> = { (): T; get: () => T; sub: (fn: (_: T) => void) => void };
export type Reactive<T> = Signal<T> | DerivedSignal<T>;
export type MaybeReactive<T> = T | Reactive<T>;

export function isReactive<T>(v: any): v is Reactive<T> {
  return [v, v.sub, v.get].every(x => typeof x === "function");
}

// Unpack a MaybeReactive<T> and just return it's current value
export function just<T>(v: MaybeReactive<T>): T {
  console.log(`JUST [${isReactive<T>(v) ? 1 : 0}]:`, v);
  return isReactive<T>(v) ? v.get() : v;
}

//---------- Signal creation utils ----------//
// Create stateful signal via closure
export function sig<T>(init: T): Signal<T> {
  let val = init;
  const subs = new Set<(v: T) => void>();

  // Set value & notify subs
  const setVal = (newVal: T | ((v: T) => T)) => {
    const next = typeof newVal === 'function' ? (newVal as (v: T) => T)(val) : newVal;
    if (next !== val) {
      val = next;
      subs.forEach(fn => fn(val));
    }
  };

  // Get value, adding a sub if called via eff() or der()
  const getVal = () => {
    if (currSub) subs.add(currSub);
    return val;
  };

  // Signal object
  const signal = ((newVal?: T | ((v: T) => T)) => {
    if (newVal === undefined) return getVal();
    setVal(newVal);
  }) as Signal<T>;

  signal.get = getVal;
  signal.set = setVal;

  // Subscribe to signal
  signal.sub = (fn: (val: T) => void) => {
    subs.add(fn);
    fn(val); // initial run
  };

  return signal;
}

// Create reactive effect wrapping signal
export function eff(fn: () => void) {
  const wrapped = () => {
    effectStack.push(wrapped);
    currSub = wrapped;

    try { fn(); }
    finally {
      effectStack.pop();
      currSub = effectStack[effectStack.length - 1] || null;
    }

  };
  wrapped();
}

// Create readonly derived signal
export function der<T>(compute: () => T): DerivedSignal<T> {
  const res = sig(compute());
  eff(() => res(compute()));

  const readOnly = () => res();
  readOnly.get = () => res();
  readOnly.sub = (fn: (_: T) => void) => res.sub(fn);
  return readOnly;
}

export function multiSub(sigs: Reactive<any>[], fn: (v: any) => void) {
  sigs.forEach(s => s.sub(fn));
}

export function maybeSub<T>(sig: MaybeReactive<T>, fn: (v: T) => void) {
  if (isReactive<T>(sig)) { sig.sub(fn); }
  else                    { fn(sig); }
}

// Bind object property to signal
export function bind<T, P extends WritableKeys<T>>(obj: T, prop: P, sig: Reactive<T[P]>) {
  sig.sub(val => { obj[prop] = val; });
}

// Bind object property to MaybeReactive if its a signal, otherwise just set the value
export function maybeBind<T, P extends WritableKeys<T>>(obj: T, prop: P, sig: MaybeReactive<T[P]>) {
  if (isReactive<T[P]>(sig)) { bind(obj, prop, sig); }
  else                       { obj[prop] = sig; }
}

//---------- Usage ----------//
// const count = sig(0);
// const doubled = der(() => 2 * count());
// const stringy = der(() => String(doubled()))

// const myObj = { someProp: "" };

// bind(myObj, "someProp", stringy);

// eff(() => console.log("Count:", count()));
// eff(() => console.log("Doubled:", doubled()));