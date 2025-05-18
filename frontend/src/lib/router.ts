import { randHex } from "./parse";
import { createSSESource, type SSEHandlers } from "./sse";

export type AlertCallback = (alert: any) => void; // TODO: Add types
export type AlertSubHelper = (listener: AlertCallback) => void
export type GlobalState = { [key: string]: any };
export type PageRenderer = (
  containers: ContainerMap,
  other: { globalState: GlobalState, onUpdate: AlertSubHelper, onSubmit: AlertSubHelper }
) => void;

export type RedirectFn = (path: string) => string | null;
export type ContainerMap = { [key: string]: HTMLElement } & {
  app: HTMLElement;
  page: HTMLElement;
};

declare global {
  function visit(page: string): void;
  function isolateContainer(container: string): void;
}

interface RouterOptions {
  pages: Record<string, PageRenderer>;
  containers: ContainerMap;
  redirects?: RedirectFn[];
  state?: Record<string, any>;
}

export class PageRouter {
  private pages: Record<string, PageRenderer>;
  private containers: ContainerMap;
  private redirects: RedirectFn[];
  private clientId: string;
  private sseSource: EventSource;

  private globalState: GlobalState = {};

  // onUpdate subscribers
  private onUpdateSubs: Array<(alert: any) => void> = [];
  private onSubmitSubs: Array<(alert: any) => void> = [];

  private sseHandlers: SSEHandlers = {
    "update": (alert) =>     { this.onUpdateSubs.forEach(fn => fn(alert)); },
    "submission": (alert) => { this.onSubmitSubs.forEach(fn => fn(alert)); },
    "transition": (alert) => { visit(alert.phaseType); }
  };


  constructor(options: RouterOptions) {
    this.pages = options.pages;
    this.containers = options.containers;
    this.redirects = options.redirects || [];
    this.globalState = {};

    // Obtain/Generate client id
    this.clientId = localStorage.getItem("clientId") ?? randHex(20);
    localStorage.setItem("clientId", `${this.clientId}`);

    // Bind methods to this instance
    this.handlePopState = this.handlePopState.bind(this);
    this.visit = this.visit.bind(this);
    this.isolateContainer = this.isolateContainer.bind(this);

    // Create SSE source & bind handlers
    this.sseSource = createSSESource(`/api/games/connect`, this.sseHandlers);

    // Listen to browser navigation
    window.addEventListener("popstate", this.handlePopState);

    // Global exposures
    (window as any).visit = this.visit;
    (window as any).isolateContainer = this.isolateContainer;

    // Initial route handling
    this.handlePopState();
  }

  private applyRedirects(path: string): string {
    for (const redir of this.redirects) {
      const target = redir(path);
      if (target && this.pages[target]) {
        if (target !== "login") {
          // return localStorage.getItem("google-id-token") ? target : "login";
          return target;
        } else {
          return target;
        }
      }
    }
    return path;
  }

  // Handle browser URL change
  private handlePopState(): void {
    const fullPath = window.location.pathname;
    const path = fullPath;
    const pageName = this.applyRedirects(path);
    this.render(pageName);
  }

  // Redirect to specific page in `pages`
  public visit(page: string): void {
    if (!this.pages[page]) {
      console.warn(`Page "${page}" not found, staying on current page.`);
      return;
    }
    history.pushState({}, "", `/${page}`);
    this.render(page);
  }

  public isolateContainer(container: keyof ContainerMap | "all") {
    for (let c in this.containers) {
      this.containers[c].style.display = container == "all" ? "block" : "none";
    }
    if (container != "all") {
      this.containers[container].style.display = "block";
    }
  }

  // Clear page content & render new page
  private render(page: string): void {
    // Remove subscribers from previous page
    this.onUpdateSubs = [];
    this.onSubmitSubs = [];

    const renderer = this.pages[page];
    Object.entries(this.containers).forEach(([_, v]) => {
      v.innerHTML = "";
    });

    if (!renderer) {
      this.containers.app.innerHTML = `<h1>404: Page '${page}' Not Found</h1>`;
      this.containers.nav.innerHTML = "";
      return;
    }

    // Construct subscription functions
    const onUpdate = (listener: (alert: any) => void) => { this.onUpdateSubs.push(listener); };
    const onSubmit = (listener: (alert: any) => void) => { this.onUpdateSubs.push(listener); };
    const globalState = this.globalState;

    renderer(this.containers, { globalState, onUpdate, onSubmit });
  }

  public updateState(state: Record<string, any>) {
    this.globalState = {
      ...this.globalState,
      ...state,
    };
  }

  public getState() {
    return this.globalState;
  }
}
