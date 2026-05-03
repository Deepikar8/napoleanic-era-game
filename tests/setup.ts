import '@testing-library/jest-dom/vitest';

// Node 25 exposes a broken native `localStorage` global when
// --localstorage-file is not configured with a valid path.
// vitest's jsdom environment creates a proper storage on jsdom.window,
// but the Node 25 native getter takes precedence on globalThis.
// Fix: grab jsdom's working storage from (globalThis as any).jsdom.window
// and install it over the broken Node 25 one on globalThis.
const _jsdomWindow = (globalThis as any).jsdom?.window;
if (_jsdomWindow) {
  const _jsdomLsDesc = Object.getOwnPropertyDescriptor(_jsdomWindow, 'localStorage');
  if (_jsdomLsDesc?.get) {
    const _jsdomLs = _jsdomLsDesc.get.call(_jsdomWindow);
    if (_jsdomLs && typeof _jsdomLs.clear === 'function') {
      // Override both globalThis.localStorage and globalThis.window.localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        get: () => _jsdomLsDesc.get!.call(_jsdomWindow),
        configurable: true,
        enumerable: true,
      });
    }
  }
  const _jsdomSsDesc = Object.getOwnPropertyDescriptor(_jsdomWindow, 'sessionStorage');
  if (_jsdomSsDesc?.get) {
    const _jsdomSs = _jsdomSsDesc.get.call(_jsdomWindow);
    if (_jsdomSs && typeof _jsdomSs.clear === 'function') {
      Object.defineProperty(globalThis, 'sessionStorage', {
        get: () => _jsdomSsDesc.get!.call(_jsdomWindow),
        configurable: true,
        enumerable: true,
      });
    }
  }
}
