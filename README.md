# ANI Console

ANI Console 前端。

## 开发环境

- Node.js 版本以 [.nvmrc](./.nvmrc) 为准。
- pnpm 版本以 [package.json](./package.json) 的 `packageManager` 声明为准。

Node.js 26 不内置 Corepack，无需额外安装。已有 Corepack 时可用其选择 pnpm 版本；否则在项目根目录执行以下命令，直接安装项目声明的 pnpm：

```bash
npm install --global "$(node -p 'require("./package.json").packageManager')"
```

## 开发

```bash
pnpm install
pnpm dev
```

开发服务默认访问 `http://localhost:5173`。

环境变量参考 [.env.example](./.env.example)，本地配置写入不提交的 `.env.local`。

| 环境变量 | 用途 |
| --- | --- |
| `VITE_API_PROXY_TARGET` | 本地开发的 API 代理地址。 |
| `VITE_VM_IMAGE_UPLOAD_PROXY_TARGET` | 本地开发的虚拟机镜像上传代理地址。 |
| `VITE_SESSION_GATEWAY_PROXY_TARGET` | 本地开发的会话网关 WebSocket 代理地址。 |

## 常用命令

```bash
pnpm lint
pnpm fmt
pnpm fmt:check
pnpm typecheck
pnpm build
pnpm preview
```

## 技术栈

React、TypeScript、Vite、TanStack Router、TanStack Query、Arco Design React、Tailwind CSS、Zustand、Axios、ECharts。

## 文档

- [文档索引](./docs/README.md)
- [工程约定](./docs/ENGINEERING-CONVENTIONS.md)
- [UI 开发约定](./docs/UI-CONVENTIONS.md)
- [API 对接流程](./docs/API-INTEGRATION.md)
- [Agent 执行约定](./AGENTS.md)
