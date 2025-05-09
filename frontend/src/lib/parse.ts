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
const body: ElemTree = {
  // Key names starting with alphanumeric characters are parsed as element types
  // # and . can be appended to set classnames and id's
  "|h1#mainHeader": {
        // _ Sets the element's innerHTML
        "_": "Header text content goes here"
  },

  "|p.content": {

    // $ allows CSS overrides to set styling
    "$": {
        "font-family": "Nuva Sans",
        "color": "red"
    },

    // %<event> allows calling functions on HTML element events
    "%click": (_: Event) => { console.log("Do something here"); },

    // @ allows arbitrary attribute overrides
    // Setting the `style`, `class`, and `id` attributes here is forbidden
    "@": {
        "attr": "value"
    },

    // Instead of {} objects, any value can be replaced with a function to make it reactive
    // redraw() appends the object to the `redraws` list, scheduling it for redrawing
    // "_": (redraw: Function) => {
    //     redraw();
    //     return "Hello world " + Date.now();
    // },

    // ...createParagraph()
  },

  "|div": {
    "_": "asdf",

    "|span": {
        "|p": {
            "|asdf": {},
            "_": "fdsa"
        }
    },
    "|span.1": {
    }
  }
};

type ElemTree = {
  "_"?: string | (() => string);
  "@"?: AttrDict | (() => AttrDict);
  "$"?: StyleDict | (() => StyleDict);
} &
{ [key in `%${keyof HTMLElementEventMap}`]?: (e: Event) => void; } &
{ [key in `${string}|${keyof HTMLElementTagNameMap}${string}`]?: ElemTree | (() => ElemTree); };

type ElemData = {
    tag: string;
    id: string;
    classList: string[];
    style: StyleDict;
    attributes: AttrDict;
    eventHandlers: EventHandlerDict;
    textContent: string;
};

type EventHandler = (e: Event) => void;
type StyleDict = { [property: string]: string };
type AttrDict = { [attribute: string]: string };
type EventHandlerDict = { [eventName: string]: EventHandler; }

// Parse an ElemTree and set it as the subtree of the given parent
// Any _,$,@,% set on the root of the tree are ignored
export function parseInto(parent: HTMLElement, tree: ElemTree) {
    parent.innerHTML = "";
    parse(tree).forEach(c => parent.appendChild(c));
}

// If the object is a function, call it
// Otherwise, return it's value
function tryCall<T>(x: T, args: any[] = []) {
    if (typeof x === "function") return x(...args);
    return x;
}

// Parse an ElemTree into a set of HTMLElements
export function parse(tree: ElemTree, par: ElemData = createEmptyElemData()): HTMLElement[] {
    const res: HTMLElement[] = [];

    for (let [k, v] of Object.entries(tree)) {
        const key = k as keyof ElemTree;
        switch(key[0]) {
            // Set parent properties
            case '_': par.textContent = tryCall(v);                        break; // content
            case '$': par.style       = tryCall(v);                        break; // style
            case '@': par.attributes  = tryCall(v);                        break; // attribute
            case '%': par.eventHandlers[key.slice(1)] = v as EventHandler; break; // event

            // Create new child
            default:                                                              // child
                const subtree : ElemTree = tryCall(tree[key]);

                // Create element data + physical HTML element
                const childData = createEmptyElemData();
                const tokData = parseElemToken(key);
                if (typeof tokData === "string") {
                    console.error(`Invalid element token:\n${key}\n${tokData}`);
                    break;
                }
                [childData.tag, childData.id, childData.classList] = tokData;

                const grandchildren = parse(subtree, childData);
                res.push(createDomElement(childData, grandchildren));
                break;
        }
    }

    return res;
}

const ID_MARKER = /\s*\#/g;
const CLASS_MARKER = /\s*\./g;
const SPACELESS_MARKER = /[#.]/g;
const WHITESPACE = /\s+/g;

type ElemTokenParseRes = [string, string, string[]];
// Format: "label | tag #id .class1 .class2"
// - Spaces between items are optional
// - Names cannot contain spaces
// Returns error string if something goes wrong
function parseElemToken(token: string): ElemTokenParseRes | string {
    // Remove label
    let [_, tok] = token.split("|").map(p => p.trim());

    // Remove redundant whitespace
    tok = tok.replaceAll(ID_MARKER, "#").replaceAll(CLASS_MARKER, ".")
    if (WHITESPACE.test(tok)) return "Names cannot have spaces";

    // Parse components
    let [tag, id, classes]: ElemTokenParseRes = ["", "", []];
    tok.split(SPACELESS_MARKER).forEach(part => {
        if (part === "") return "Names cannot be empty";
        switch(part[0]) {
            case ".": classes.push(part.slice(1)); break;
            case "#":
                if (id !== "") return "Cannot specify multiple id's";
                id = part.slice(1);
                break;
            default:
                if (tag !== "") return "Cannot specify multiple element tags";
                tag = part;
                break;
        }
    });

    return [tag, id, classes];
}

function createEmptyElemData(): ElemData {
    return {
        tag: "", id: "", classList: [],
        style: {}, attributes: {},
        eventHandlers: {}, textContent: ""
    };
}

// Construct HTML DOM element from PElem metadata
function createDomElement(meta: ElemData, children: HTMLElement[] = []): HTMLElement {
    const { tag, id, classList = [], style = {}, attributes: attrs = {}, eventHandlers: evnts = {} } = meta;

    const elem = document.createElement(tag);

    if (id !== "") { elem.id = id; }
    elem.classList.add(...classList);
    Object.entries(style).forEach(([key, val]) => { (elem.style as any)[key] = val; });
    Object.entries(attrs).forEach(([attr, val]) => { elem.setAttribute(attr, val); });
    Object.entries(evnts).forEach(([eventName, handler]) => { elem.addEventListener(eventName, handler); })
    children.forEach(c => elem.appendChild(c));

    return elem;
}