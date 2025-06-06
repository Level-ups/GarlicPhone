import { io, Socket } from "socket.io-client";
import { apiFetch } from "./fetch";

export type AlertCallback = (alert: any) => void; // TODO: Add types
export type AlertSubHelper = (listener: AlertCallback) => void;
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

export type Params = { [key: string]: any };

declare global {
  const router: PageRouter;
  function visit(page: string, params?: Params): void;
  function isolateContainer(container: string, permitReload?: boolean): void;
}

export interface RouterOptions {
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
  private socket: Socket | null = null;

  private globalState: GlobalState = {};

  // onUpdate subscribers
  private onUpdateSubs: Array<(alert: any) => void> = [];
  private onSubmitSubs: Array<(alert: any) => void> = [];

  constructor(options: RouterOptions) {
    this.pages = options.pages;
    this.containers = options.containers;
    this.redirects = options.redirects || [];
    this.globalState = {};

    // Obtain/Generate client id
    this.clientId = sessionStorage.getItem("clientId") ?? "";
    sessionStorage.setItem("clientId", `${this.clientId}`);

    // Bind methods to this instance
    this.handlePopState = this.handlePopState.bind(this);
    this.visit = this.visit.bind(this);
    this.isolateContainer = this.isolateContainer.bind(this);

    // Listen to browser navigation
    window.addEventListener("popstate", this.handlePopState);

    const ivl = setInterval(() => {
      if (this.socketInitialized()) { clearInterval(ivl); }
      else {
        debugLog("> Attempting socket init");
        this.initializeSocketIfAuthenticated();
      }
    }, 1000);

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

  private handlePopState(): void {
    const fullPath = window.location.pathname;
    const path = fullPath;
    const pageName = this.applyRedirects(path);
    this.render(pageName);
  }

  public socketInitialized(): boolean { return this.socket != null; }

  public visit(page: string, params: Params = {}): void {
    if (!this.pages[page]) {
      debugWarn(`Page "${page}" not found, staying on current page.`);
      return;
    }
    history.pushState({}, "", `/${page}`);
    this.render(page, params);
  }

  public isolateContainer(container: keyof ContainerMap | "all", permitReload = true) {

    for (let c in this.containers) {
      this.containers[c].style.display = container == "all" ? "block" : "none";
    }
    if (container != "all") {
      this.containers[container].style.display = "block";
    }
    window.onbeforeunload = permitReload ? null : () => "Warning: Reloading will lose game progress";

    // // Prevent opening multiple tabs
    // const bc = new BroadcastChannel('garlic_phone');
    // bc.onmessage = function (ev) {
    //   if(ev.data && ev.data.url===window.location.href) {
    //     alert("Garlic Phone does not support multi-tab gameplay");
    //   }
    // }
    // bc.postMessage(window.location.href);

  }

  private render(page: string, params: Params = {}): void {
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

  // Initializes the WebSocket connection if the user is authenticated
  public async initializeSocketIfAuthenticated() {
    const token = sessionStorage.getItem('google-id-token');

    if (token && !this.socket) {
      const res = await apiFetch("get", "/api/games/me", undefined);
      const { playerId, playerName } = await res?.json();
      // sessionStorage.setItem("clientId", `${playerId}`);

      debugLog("AUTHENTICATED -> INITIALIZING SOCKET CONNECTION");
      debugLog("CLIENT ID:", playerId);
      this.socket = io("/", {
        auth: { token },
        query: { clientId: playerId, playerName: playerName },
        transports: ["websocket"],
      });

      this.socket.on("error", (e) => {
        debugErr("SOCKET ERROR", e)
      });

      this.socket.on("connect", () => {
        debugLog("> SOCKET CONNECTED");
      });

      this.socket.on("disconnect", (reason) => {
        debugLog("> SOCKET DISCONNECTED", reason);
      });

      this.socket.on("update", (alert) => {
        debugLog("UPDATE ALERT:", alert);
        this.onUpdateSubs.forEach(fn => fn(alert));
      });

      this.socket.on("submission", (alert) => {
        debugLog("SUBMISSION ALERT:", alert);
        this.onSubmitSubs.forEach(fn => fn(alert));
      });

      this.socket.on("transition", (alert) => {
        debugLog("TRANSITION ALERT:", alert);
        this.visit(alert.phaseType, { alert });
      });
    }
  }

  public closeSocketConnection(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      debugLog("> SOCKET CONNECTION CLOSED");
    }
  }
}
