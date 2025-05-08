class Signal<T> {
    val: T;
    deps: any[];

    constructor(val: T, deps: any[] = []) {
        this.val = val;
        this.deps = deps;
    }

    set(setter: T | ((v: T) => T)) {
        this.val = typeof setter === "function" ? (setter as Function)(this.val) : setter;
        this.notify();
    }

    notify() { this.deps.forEach(x => x()); }
    addDep(dep: (v: T) => void){ this.deps.push(dep); }
}

let x = new Signal(10);
x.set(20);

let silentRegisterCaller = (_: any) => {};

function init() {
    const $state = new Proxy({}, {
        get(target: { [key: string]: Signal<any> }, prop: string) {
            if (typeof prop === "symbol") return;

            // Silently add dependency when getting signal element
            const signal = target[prop];
            if (typeof silentRegisterCaller === "function") {
                signal.addDep(silentRegisterCaller);
            }
            return signal;
        }
    })
}

//-------------------- Spec --------------------//
const body = {
  // Key names starting with alphanumeric characters are parsed as element types
  // # and . can be appended to set classnames and id's
  "h1#mainHeader": {
        // _ Sets the element's innerHTML
        "_": "Header text content goes here"
  },

  // <h1 id="mainHeader">
  //   Header text content goes here
  // </h1>

  "p.content": {

    // $ allows CSS overrides to set styling
    "$": {
        "font-family": "Nuva Sans",
        "color": "red"
    },

    // %<event> allows calling functions on HTML element events
    "%onclick": (_: Event) => { console.log("Do something here"); },

    // @ allows arbitrary attribute overrides
    // Setting the `style`, `class`, and `id` attributes here is forbidden
    "@": {
        "attr": "value"
    },

    // Instead of {} objects, any value can be replaced with a function to make it reactive
    // redraw() appends the object to the `redraws` list, scheduling it for redrawing
    "_": (redraw: Function) => {
        redraw();
        return "Hello world " + Date.now();
    },

    // ...createParagraph()
  }
}

export function parse(tag: string, tree: PTree) {
    const el : PElem = { tag };

    const x = tree["@"]

    for (let [k, v] of Object.entries(tree)) {
        switch(k.trim()[0]) {
            case '_': el.textContent = v; break;
            case '$': el.style = v; break;
            case '@': break;
        }
    }
}

type PTree = (
    { [key: string]: PTree | ( () => PTree ) } &
    {
        "_": string,
        "@": AttrDict,
        "$": StyleDict,
        [key: `%${string}`]: ( (_: Event) => {} ) 
    }
);
type PElem = {
    tag: string;
    id?: string;
    classList?: string[];
    style?: StyleDict;
    attributes?: AttrDict;
    eventHandlers?: EventHandlerDict;
    textContent?: string;
    children?: PElem[];
};

type StyleDict = { [property: string]: string };
type AttrDict = { [attribute: string]: string };
type EventHandlerDict = { [eventName: string]: (e: Event) => void };

// Construct HTML DOM element from PElem metadata
function createDomElement(meta: PElem): HTMLElement {
    const { tag, id, classList = [], style = {}, attributes: attrs = {}, eventHandlers: evnts = {} } = meta;

    const elem = document.createElement(tag);

    if (id) { elem.id = id; }
    elem.classList.add(...classList);
    Object.entries(style).forEach(([key, val]) => { (elem.style as any)[key] = val; });
    Object.entries(attrs).forEach(([attr, val]) => { elem.setAttribute(attr, val); });
    Object.entries(evnts).forEach(([eventName, handler]) => { elem.addEventListener(eventName, handler); })

    return elem;
}

// Add the given element to the DOM as a child of the #<parentId> element
function appendToElementById(parentId: string, child: HTMLElement): boolean {
    return document.getElementById(parentId)?.appendChild(child) != null;
}

// export function createParagraph() {
//   return parse({ "p.content": {...} });
// }