import './lobbyStyle.css'
import { PageRouter, type ContainerMap, type PageRenderer, type RedirectFn } from './lib/router'
import { loginPage } from './pages/login';
import { menuGalleryPage } from './pages/menuGallery';
import { drawPage } from './pages/draw';
import { menuPlayPage } from './pages/menuPlay';
import { lobbyPage } from './pages/lobby';
import { promptPage } from './pages/prompt';
import { guessPage } from './pages/guess';
import { reviewPage } from './pages/review';
import { homePage } from './pages/home';
import { menuPlayGamePage } from './pages/menuPlayGame';
import { demoPage } from './pages/demo';

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
  "home":         homePage,
  "login":        loginPage,
  "menuGallery":  menuGalleryPage,
  "menuPlay":     menuPlayPage,
  "menuPlayGame": menuPlayGamePage,
  "lobby":        lobbyPage,
  "prompt":       promptPage,
  "draw":         drawPage,
  "guess":        guessPage,
  "review":       reviewPage,
  "demo":         demoPage
};
 
const redirects: RedirectFn[] = [
  path => path === '/'                ? 'home' : null,
  path => path === '/login'           ? 'login' : null,
  // path => path === '/play'            ? 'menuPlay' : null,
  path => path === '/playgame'        ? 'menuPlayGame' : null,
  path => path === '/gallery'         ? 'menuGallery' : null,

  path => path === '/game'            ? 'menuPlay' : null,

  path => path.startsWith('/lobby')   ? 'lobby' : null,
  path => path === '/prompt'          ? 'prompt' : null,
  path => path === '/guess'           ? 'guess' : null,
  path => path === '/draw'            ? 'draw' : null,

  path => path === '/review'          ? 'review' : null,

  path => path === '/demo'            ? 'demo' : null
];

const router = new PageRouter({ pages, redirects, containers });

// Trigger navigation via buttons:
document.getElementById('toAbout')?.addEventListener('click', () => visit('about'));
document.getElementById('toContact')?.addEventListener('click', () => visit('contact'));