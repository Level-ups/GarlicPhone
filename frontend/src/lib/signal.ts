export class Signal<T> {
    private deps: Set<(v: T) => void> = new Set();
    private val: T;

    constructor(val: T) { this.val = val; }

    get() { return this.val; }

    set(setter: T | ((v: T) => T)) {
        const next = typeof setter === "function" ? (setter as (v: T) => T)(this.val) : setter;
        if (next !== this.val) {
            // Value changed
            this.val = next;
            this.notify();
        }
    }

    protected notify() { this.deps.forEach(d => d(this.val)); }

    protected addDep(dep: (v: T) => void) {
        this.deps.add(dep);
        dep(this.val); // Run immediately for initial sync
    }

    static effect<T>(signal: Signal<T>, fn: (val: T) => void) {
        signal.addDep(fn);
    }
}

class DerivedSignal<T> extends Signal<T> {
    constructor(computeFn: () => T, deps: Signal<any>[]) {
        super(computeFn()); // Set initial value

        for (const dep of deps) {
            dep.addDep(() => {
                this.set(computeFn());
            });
        }
    }

    // Override to block external sets
    override set(_: T | ((v: T) => T)): void {
        throw new Error("Cannot set value of a DerivedSignal directly");
    }
}

let x = new Signal(10);
x.set(20);


const a = new Signal(2);
const b = new Signal(3);
const sum = new DerivedSignal(() => a.get() + b.get(), [a, b]);

effect(sum, val => console.log("Sum is", val));
a.set(10);  // Logs: Sum is 13



// let silentRegisterCaller = (_: any) => {};
// function createGlobalReactiveState() {
//     const $state = new Proxy({}, {
//         get(target: { [key: string]: Signal<any> }, prop: string) {
//             if (typeof prop === "symbol") return;

//             // Silently add dependency when getting signal element
//             const signal = target[prop];
//             if (typeof silentRegisterCaller === "function") {
//                 signal.addDep(silentRegisterCaller);
//             }
//             return signal;
//         }
//     })
// }