import { randHex } from "./parse";
import type { ContainerMap, GlobalState, PageRenderer, Params, RedirectFn, RouterOptions } from "./router";


export class PageRouterWS {
  private pages: Record<string, PageRenderer>;
  private containers: ContainerMap;
  private redirects: RedirectFn[];
  private clientId: string;
  public socket: WebSocket | null = null;

  private globalState: GlobalState = {};

  // onUpdate subscribers
  private onUpdateSubs: Array<(alert: any) => void> = [];
  private onSubmitSubs: Array<(alert: any) => void> = [];

  private wsHandlers: Record<string, (alert: any) => void> = {
    "update": (alert) =>     { debugLog("update alert:", alert); this.onUpdateSubs.forEach(fn => fn(alert)); },
    "submission": (alert) => { debugLog("submission alert:", alert); this.onSubmitSubs.forEach(fn => fn(alert)); },
    "transition": (alert) => { debugLog("transition alert:", alert); this.visit(alert.phaseType, { alert }); }
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
      debugWarn(`Page "${page}" not found, staying on current page.`);
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
    const onSubmit = (listener: (alert: any) => void) => { this.onSubmitSubs.push(listener); };
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

  // Initializes the WebSocket connection if the user is authenticated (has a JWT token)
  // This should be called after successful login
  public initializeWSIfAuthenticated(): void {
    const token = sessionStorage.getItem('google-id-token');

    if (token && !this.socket) {
      // Build ws:// URL from current origin
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const query = new URLSearchParams({
        id: this.clientId,
        authorization: token
      }).toString();

      this.socket = new WebSocket(`${wsProtocol}//${host}/api/ws/games/connect?${query}`);
      debugLog('WebSocket connection establishing');

      this.socket.onopen = () => {
        debugLog('WebSocket connection established');
      };

      this.socket.onmessage = ({ data }) => {
        try {
          const { event, data: payload } = JSON.parse(data);
          const handler = this.wsHandlers[event];
          if (handler) handler(payload);
        } catch (err) {
          debugErr('Failed to parse WS message', err);
        }
      };

      this.socket.onclose = () => {
        debugLog('WebSocket connection closed');
        this.socket = null;
      };

      this.socket.onerror = (err) => {
        debugErr('WebSocket error', err);
      };
    }
  }

  public closeWSConnection(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      debugLog('WebSocket connection closed by client');
    }
  }
}
