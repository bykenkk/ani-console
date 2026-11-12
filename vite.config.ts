import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

interface DevProxyRoute extends Omit<ProxyOptions, "target" | "rewrite"> {
  path: string;
  target?: string;
  upstreamPath?: string;
  exact?: boolean;
}

function createDevProxy(routes: DevProxyRoute[]): Record<string, ProxyOptions> {
  const proxy: Record<string, ProxyOptions> = {};
  for (const { path, target, upstreamPath, exact, ...options } of routes) {
    if (!target) continue;
    const pathPattern = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 独立上游未配置时，其业务路径也不回落到父级代理。
    const childScopes = routes
      .filter((route) => route.path !== path && route.path.startsWith(path))
      .map((route) => route.path.slice(path.length).split("/")[0])
      .map((scope) => scope.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const context = exact
      ? `^${pathPattern}(?:\\?|$)`
      : childScopes.length
        ? `^${pathPattern}(?!(?:${childScopes.join("|")})(?:/|\\?|$))`
        : path;
    proxy[context] = {
      ...options,
      target,
      ...(upstreamPath ? { rewrite: (url: string) => upstreamPath + url.slice(path.length) } : {}),
    };
  }
  return proxy;
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      tanstackRouter({
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
        autoCodeSplitting: true,
        // `src/routes/**/dev/**` is available through the dev server, but never enters a build graph.
        routeFileIgnorePattern: command === "build" ? "^dev$" : undefined,
      }),
      react(),
    ],
    resolve: {
      alias: {
        "@novnc/novnc/lib/rfb": path.resolve(
          import.meta.dirname,
          "./node_modules/@novnc/novnc/core/rfb.js",
        ),
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: createDevProxy([
        {
          path: "/api/console-sessions/",
          target: env.VITE_SESSION_GATEWAY_PROXY_TARGET,
          upstreamPath: "/api/v1/realtime/sessions/",
          ws: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (request) => request.removeHeader("cookie"));
            proxy.on("proxyReqWs", (request) => request.removeHeader("cookie"));
          },
        },
        {
          path: "/api/uploads/vm-images",
          exact: true,
          target: env.VITE_VM_IMAGE_UPLOAD_PROXY_TARGET,
          upstreamPath: "/v1beta1/upload-async",
          changeOrigin: true,
          secure: false,
          timeout: 3600000,
          proxyTimeout: 3600000,
          configure: (proxy) => {
            // 同源请求可能携带浏览器 Cookie，上传上游只接收票据 Token。
            proxy.on("proxyReq", (request) => request.removeHeader("cookie"));
          },
        },
        {
          path: "/api/",
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
        },
      ]),
    },
    optimizeDeps: {
      include: ["@novnc/novnc/lib/rfb"],
      rolldownOptions: {
        transform: {
          target: "esnext",
        },
      },
    },
    build: {
      target: "esnext",
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{ name: "vendor-tanstack", test: /node_modules.*@tanstack/ }],
          },
        },
      },
    },
  };
});
