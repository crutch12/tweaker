import type { Plugin } from "vite";

export function pollReloadPlugin(): Plugin {
  let isWatchMode = false;
  const fileName = "poll-reload.js";

  return {
    name: "vite-plugin-build-watch-reload",

    configResolved(config) {
      // detect "vite build --watch"
      isWatchMode = !!config.build.watch;
    },

    async generateBundle() {
      if (!isWatchMode) return;

      this.emitFile({
        type: "asset",
        fileName,
        source: `
          (function() {
            let last = null;
            async function check() {
              try {
                const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' });
                const current = res.headers.get('etag') || res.headers.get('last-modified');
                if (last && current !== last) {
                  console.log('Build changed. Reloading...');
                  location.reload();
                }
                last = current;
              } catch (e) {}
              setTimeout(check, 1000);
            }
            check();
          })();
        `.trim(),
      });
    },

    transformIndexHtml(html) {
      if (!isWatchMode) return html;
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: { src: `/${fileName}` },
            injectTo: "body",
          },
        ],
      };
    },
  };
}
