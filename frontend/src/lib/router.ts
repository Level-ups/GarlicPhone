export type PageRenderer = (container: HTMLElement) => void;
export type RedirectFn = (path: string) => string | null;

declare global {
  function visit(page: string): void;
}

interface RouterOptions {
  pages: Record<string, PageRenderer>;
  container: HTMLElement;
  redirects?: RedirectFn[];
}

export class PageRouter {
  private pages: Record<string, PageRenderer>;
  private container: HTMLElement;
  private redirects: RedirectFn[];

  constructor(options: RouterOptions) {
    this.pages = options.pages;
    this.container = options.container;
    this.redirects = options.redirects || [];

    // Bind methods to this instance
    this.handlePopState = this.handlePopState.bind(this);
    this.visit = this.visit.bind(this);

    // Listen to browser navigation
    window.addEventListener('popstate', this.handlePopState);

    (window as any).visit = this.visit; // Expose globally

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

  // Clear page content & render new page
  private render(page: string): void {
    const renderer = this.pages[page];
    if (!renderer) {
      this.container.innerHTML = `<h1>404: Page '${page}' Not Found</h1>`;
      return;
    }
    this.container.innerHTML = '';
    renderer(this.container);
  }
}