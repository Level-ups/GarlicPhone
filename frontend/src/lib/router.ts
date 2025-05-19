import { randHex } from "./parse";
import { createSSESource, type SSEHandlers } from "./sse";

export type AlertCallback = (alert: any) => void; // TODO: Add types
export type AlertSubHelper = (listener: AlertCallback) => void
export type GlobalState = { [key: string]: any };
export type PageRenderer = (
  containers: ContainerMap,
  other: {
    params: Params,
    globalState: GlobalState,
    onUpdate: AlertSubHelper,
    onSubmit: AlertSubHelper
  }
) => void;

export type RedirectFn = (path: string) => string | null;
export type ContainerMap = { [key: string]: HTMLElement } & {
  app: HTMLElement;
  page: HTMLElement;
};

type Params = { [key: string]: any };

declare global {
  function visit(page: string, params?: Params): void;
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
  public sseSource: EventSource | null = null;

  private globalState: GlobalState = {};

  // onUpdate subscribers
  private onUpdateSubs: Array<(alert: any) => void> = [];
  private onSubmitSubs: Array<(alert: any) => void> = [];

  private sseHandlers: SSEHandlers = {
    "update": (alert) =>     { console.log("update alert:", alert); this.onUpdateSubs.forEach(fn => fn(alert)); },
    "submission": (alert) => { console.log("submission alert:", alert); this.onSubmitSubs.forEach(fn => fn(alert)); },
    "transition": (alert) => { console.log("transition alert:", alert); this.visit(alert.phaseType, { alert }); }
  };


  constructor(options: RouterOptions) {
    this.pages = options.pages;
    this.containers = options.containers;
    this.redirects = options.redirects || [];
    this.globalState = {};

    // Obtain/Generate client id
    this.clientId = sessionStorage.getItem("clientId") ?? randHex(20);
    sessionStorage.setItem("clientId", `${this.clientId}`);

    // Bind methods to this instance
    this.handlePopState = this.handlePopState.bind(this);
    this.visit = this.visit.bind(this);
    this.isolateContainer = this.isolateContainer.bind(this);
    
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
          // return sessionStorage.getItem("google-id-token") ? target : "login";
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
  public visit(page: string, params: Params = {}): void {
    if (!this.pages[page]) {
      console.warn(`Page "${page}" not found, staying on current page.`);
      return;
    }
    history.pushState({}, "", `/${page}`);
    this.render(page, params);
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
  private render(page: string, params: Params = {}): void {
    // Remove subscribers from previous page
    // this.onUpdateSubs = [];
    // this.onSubmitSubs = [];

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

    renderer(this.containers, { params, globalState, onUpdate, onSubmit });
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
  
  /**
   * Initializes the SSE connection if the user is authenticated (has a JWT token)
   * This should be called after successful login
   */
  public initializeSSEIfAuthenticated(): void {
    const token = sessionStorage.getItem('google-id-token');
    
    if (token && !this.sseSource) {
      const queryParams = new URLSearchParams({
        authorization: token
      });
      this.sseSource = createSSESource(`/api/sse/games/connect?${queryParams.toString()}`, this.sseHandlers);
      console.log('SSE connection established after authentication');
    }
  }

  public closeSSEConnection(): void {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
      console.log('SSE connection closed');
    }
  }
}
