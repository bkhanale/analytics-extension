import { createRoot } from 'react-dom/client';
import { Overlay } from './Overlay';
import { matchesGlob } from '../common/url-matcher';
import { PageConfig } from '../common/types';

const STORAGE_KEY = 'network_tracker_config';

async function init() {
  const currentUrl = window.location.href;
  const { [STORAGE_KEY]: configs } = await chrome.storage.local.get([STORAGE_KEY]);

  if (!configs || !Array.isArray(configs)) return;

  const matchedConfig: PageConfig = configs.find(
    (c: PageConfig) => c.enabled && matchesGlob(currentUrl, c.pagePattern)
  );

  if (matchedConfig) {
    console.log('[Network Tracker] Monitoring active with config:', matchedConfig);

    // 1. Inject Config via Attribute (CSP safe)
    // We use a custom attribute on the document element to pass the config synchronously
    document.documentElement.dataset.ntRules = JSON.stringify(matchedConfig.rules);
    document.documentElement.dataset.ntConfigPattern = matchedConfig.pagePattern;

    // 2. Inject Interceptor
    const script = document.createElement('script');
    // Handle CRXJS ?script import behavior:
    // In dev (HMR), it might be a full URL (http://...).
    // In prod, it is likely a relative path (assets/...).
    // We need to ensure it resolves to the extension's resource, not relative to the page.
    script.src = chrome.runtime.getURL('hook.js');
    script.type = 'module';
    script.async = false; // Try to execute ASAP
    (document.head || document.documentElement).appendChild(script);

    // Clean up attribute after a short delay (optional, but hook reads it immediately)
    setTimeout(() => {
      delete document.documentElement.dataset.ntRules;
    }, 1000);

    // 3. Mount UI
    const mountUI = () => {
      const host = document.createElement('div');
      host.style.position = 'absolute';
      host.style.top = '0';
      host.style.left = '0';
      host.style.zIndex = '2147483647';
      host.style.pointerEvents = 'none'; // container shouldn't block, children will have pointer-events: auto

      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      // We need a root div inside shadow for React
      const root = document.createElement('div');
      // Reset pointer events for the app container
      root.style.pointerEvents = 'auto';
      shadow.appendChild(root);

      createRoot(root).render(<Overlay />);
    };

    if (document.body) {
      mountUI();
    } else {
      window.addEventListener('DOMContentLoaded', mountUI);
    }
  }
}

init();
