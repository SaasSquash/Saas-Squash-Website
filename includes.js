/* SaaS Squash — includes.js
   Lightweight HTML partial loader for GitHub Pages (static hosting).
*/

(function () {
  'use strict';

  function resolveIncludeUrl(spec) {
    const s = String(spec || '').trim();
    if (!s) return null;

    // Allow absolute URLs as-is (not expected for this site, but keeps the loader flexible).
    if (/^https?:\/\//i.test(s) || s.startsWith('//')) return s;

    // Resolve relative to the *page URL* (important for GitHub Project Pages, `/repo/` roots, etc.).
    try {
      return new URL(s, window.location.href).toString();
    } catch (e) {
      return s;
    }
  }

  async function loadPartial(hostEl) {
    const spec = hostEl.getAttribute('data-include');
    if (!spec) return;
    if (typeof window.fetch !== 'function') {
      const msg =
        'This browser does not support fetch(), which is required to load page partials. Please use a modern browser.';
      hostEl.innerHTML = renderError(spec, null, msg);
      hostEl.setAttribute('data-include-loaded', 'error');
      // eslint-disable-next-line no-console
      console.error('[includes] fetch() not available; cannot load', spec);
      return;
    }

    const url = resolveIncludeUrl(spec);

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      const html = await res.text();
      hostEl.innerHTML = html;
      hostEl.setAttribute('data-include-loaded', 'true');
    } catch (err) {
      const hint =
        url && url.startsWith('file:')
          ? 'You opened this page via file://. Most browsers block fetch() for local files. Run a local static server (for example: python -m http.server) or use GitHub Pages (https) where partials are fetched normally.'
          : 'If you are previewing locally, use a static web server. Opening index.html directly as file:// will usually fail to load partials in modern browsers.';
      hostEl.innerHTML = renderError(spec, url, hint, err);
      // eslint-disable-next-line no-console
      console.error('[includes] Failed to load', { spec, url, err });
      hostEl.setAttribute('data-include-loaded', 'error');
    }
  }

  function renderError(spec, resolvedUrl, hint, err) {
    const safeSpec = String(spec);
    const resolved = resolvedUrl ? String(resolvedUrl) : '';

    var errLine = '';
    if (err && (err.message || err.toString)) {
      errLine = '<div style="margin-top:8px;opacity:0.85;">' + escapeHtml(String(err.message || err)) + '</div>';
    }

    return (
      '<div style="padding:16px;border:1px solid #e2e2e2;border-radius:8px;font-family:system-ui,-apple-system,sans-serif;line-height:1.45;">' +
      '<strong>Failed to load partial</strong><div style="margin-top:6px;opacity:0.9;">' +
      '<div><code style="font-size:0.9em;">' +
      escapeHtml(safeSpec) +
      '</code></div>' +
      (resolved && resolved !== safeSpec
        ? '<div style="margin-top:6px;">Resolved to: <code style="font-size:0.9em;">' + escapeHtml(resolved) + '</code></div>'
        : '') +
      (hint
        ? '<div style="margin-top:10px;opacity:0.95;">' + escapeHtml(hint) + '</div>'
        : '') +
      errLine +
      '</div></div>'
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadAllPartials() {
    const hosts = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
    if (!hosts.length) {
      document.dispatchEvent(new Event('partials:loaded'));
      return;
    }

    // Browsers (for good reasons) generally cannot fetch() local file partials when the page is opened as file://.
    // GitHub Pages is served over https, so this path should not be hit in production.
    if (window.location.protocol === 'file:') {
      for (var i = 0; i < hosts.length; i++) {
        if (hosts[i].getAttribute('data-include-loaded') === 'true') continue;
        hosts[i].setAttribute('data-include-loaded', 'error');
        hosts[i].innerHTML = renderError(
          hosts[i].getAttribute('data-include'),
          hosts[i].getAttribute('data-include') ? new URL(hosts[i].getAttribute('data-include'), window.location.href).toString() : null,
          'This page was opened as file://. fetch() cannot reliably load `partials/*.html` in this mode. Please preview using a static server (e.g. python -m http.server) or use the deployed GitHub Pages URL.'
        );
      }
      document.dispatchEvent(new Event('partials:loaded'));
      return;
    }

    // Maintain document order (important if any partials rely on preceding markup).
    for (const host of hosts) {
      // Skip already-loaded hosts (in case of re-run).
      if (host.getAttribute('data-include-loaded') === 'true') continue;
      await loadPartial(host);
    }

    document.dispatchEvent(new Event('partials:loaded'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllPartials);
  } else {
    loadAllPartials();
  }
})();

