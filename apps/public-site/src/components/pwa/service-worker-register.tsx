'use client';

import { useEffect } from 'react';

/** PRODUCT_SPEC section 2 — registers `public/sw.js` once the page has loaded. Silently no-ops where unsupported (older browsers, some in-app webviews). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js');
  }, []);

  return null;
}
