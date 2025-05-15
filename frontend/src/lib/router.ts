export type PageRenderer = (containers: ContainerMap) => void;
export type RedirectFn = (path: string) => string | null;
export type ContainerMap = { [key: string]: HTMLElement } & { app: HTMLElement, page: HTMLElement };

declare global {
  function visit(page: string): void;
  function isolateContainer(container: string): void;
}

interface RouterOptions {
  pages: Record<string, PageRenderer>;
  containers: ContainerMap;
  redirects?: RedirectFn[];
}

export class PageRouter {
  private pages: Record<string, PageRenderer>;
  private containers: ContainerMap;
  private redirects: RedirectFn[];

  constructor(options: RouterOptions) {
    this.pages = options.pages;
    this.containers = options.containers;
    this.redirects = options.redirects || [];

    // Bind methods to this instance
    this.handlePopState = this.handlePopState.bind(this);
    this.visit = this.visit.bind(this);
    this.isolateContainer = this.isolateContainer.bind(this);

    // Listen to browser navigation
    window.addEventListener('popstate', this.handlePopState);

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
        return target;
      }
    }
    return path;
  }

  // Handle browser URL change
  private handlePopState(): void {
    const fullPath = window.location.pathname;
    const path = fullPath
    const pageName = this.applyRedirects(path);
    this.render(pageName);
  }

  // Redirect to specific page in `pages`
  public visit(page: string): void {
    if (!this.pages[page]) {
      console.warn(`Page "${page}" not found, staying on current page.`);
      return;
    }
    history.pushState({}, '', `/${page}`);
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
    const renderer = this.pages[page];
    Object.entries(this.containers).forEach(([_, v]) => { v.innerHTML = ""; });

    if (!renderer) {
      this.containers.app.innerHTML = `<h1>404: Page '${page}' Not Found</h1>`;
      this.containers.nav.innerHTML = "";
      return;
    }

    renderer(this.containers);
  }
}