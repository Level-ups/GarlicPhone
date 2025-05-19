
import { PageRouter, type ContainerMap, type PageRenderer, type RedirectFn } from './lib/router';
import { demoPage } from './pages/demo';
import { drawPage } from './pages/draw';
import { guessPage } from './pages/guess';
import { homePage } from './pages/home';
import { lobbyPage } from './pages/lobby';
import { loginPage } from './pages/login';
import { menuGalleryPage } from './pages/menuGallery';
import { menuPlayGamePage } from './pages/menuPlayGame';
import { promptPage } from './pages/prompt';
import { reviewPage } from './pages/review';

//---------- Setup ----------//
const containers: ContainerMap = {
  "app": document.getElementById("app")!,
  "page": document.getElementById("page")!
};

(window as any).DEBUG = true;
(window as any).log = function(...params: any[])   { if (DEBUG) console.log(...params) };
(window as any).error = function(...params: any[]) { if (DEBUG) console.error(...params) };

declare global {
  const DEBUG: boolean;
  function log(...data: any[]): void;
  function error(...data: any[]): void;
};

//---------- Page routing ----------//
const pages: { [key: string]: PageRenderer } = {
  // "home":         homePage,
  "login":        loginPage,
  "menuGallery":  menuGalleryPage,
  "menuPlay":     menuPlayGamePage,
  "lobby":        lobbyPage,
  "prompt":       promptPage,
  "draw":         drawPage,
  "guess":        guessPage,
  "review":       reviewPage,
  "demo":         demoPage
};
 
const redirects: RedirectFn[] = [
  path => path === '/'        ? 'login' : null,
  // path => path === '/login'   ? 'login' : null,
  path => path === '/play'    ? 'menuPlay' : null,
  path => path === '/gallery' ? 'menuGallery' : null,

  path => path.startsWith('/lobby')   ? 'lobby' : null,
  path => path === '/prompt'          ? 'prompt' : null,
  path => path === '/guess'           ? 'guess' : null,
  path => path === '/draw'            ? 'draw' : null,

  path => path === '/review'          ? 'review' : null,

  path => path === '/demo'            ? 'demo' : null
];

const router = new PageRouter({ pages, redirects, containers });

// Make router accessible globally for token-based SSE initialization
(window as any).router = router;

// Trigger navigation via buttons:
document.getElementById('toAbout')?.addEventListener('click', () => visit('about'));
document.getElementById('toContact')?.addEventListener('click', () => visit('contact'));