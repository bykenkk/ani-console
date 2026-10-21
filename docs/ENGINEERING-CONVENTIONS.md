# ANI Console 工程约定

本文档统一维护工程目录与命名、路由适配、公共适配层、浏览器兼容和验证规则；UI 实现与 API 对接细则由各自规范维护。

## 目录

- 本仓库根目录已经代表产品原型中的 Console 范围；路由、页面、组件及其文件或目录不得再使用 `console`、`console-*`、`*Console` 等重复表达 Console 层级的命名，应直接按业务领域或资源命名。
- `src/routes/`：仅保留 TanStack Router 薄入口，负责 `createFileRoute`、路由参数、search 校验、loader/beforeLoad 等路由编排；具体页面实现必须从 `src/components/<scope>/<PageName>/index.tsx` 导入，避免页面实现与文件路由生成耦合导致热更新失效。
- route component 是路由适配层：在入口内通过当前 `Route` 的 `useParams`、`useSearch` 或 loader 数据读取并整理路由输入，再以普通 props 传给 `src/components/<scope>/` 下的页面组件；不强制箭头函数语法，没有路由输入时也只组合页面组件，不在 route 文件内保留查询、业务状态或完整页面 JSX，领域页面不应仅为读取 path/search 而依赖 route 对象或 `getRouteApi`。
- 页面级组件的目录名与导出名必须以 `Page` 结尾（例如 `VmsPage`），普通业务组件不得使用 `Page` 后缀，以便从命名上明确区分路由页面与可复用组件。
- `src/layouts/`：应用级布局、导航与壳层组件，使用 `src/layouts/<LayoutName>/index.tsx`；布局专用组件与私有样式随所属布局维护。
- `src/components/`：页面与业务组件按 page scope 组织，组件必须使用 `<scope>/<ComponentName>/index.tsx`，子组件放在所属组件目录的 `<SubComponentName>/index.tsx`；私有样式使用组件同目录的 `index.{css,less}` 或 `index.module.{css,less}`。禁止在 scope 目录平铺组件或样式文件。
- 跨页面、跨领域复用的通用组件统一放在 `src/components/common/<ComponentName>/index.tsx`；业务组件放在对应 page scope。scope 级 `index.ts` 仅作为导出清单，不承载组件实现。
- 新建或改造的业务模态框统一放在 `src/components/<domain>/<ComponentName>Modal/index.tsx`，目录名与导出名保持一致；组件边界、挂载方式和复用接口遵循 [UI 开发约定](./UI-CONVENTIONS.md)。
- `src/api/`：按业务资源组织的 API 请求函数、静态类型与 Axios 公共请求基础设施。
- `src/stores/`：客户端状态。
- `src/lib/`、`src/hooks/`：共享逻辑。
- 禁止新增 `src/pages/`。

### 废弃接口组织

新增或调整迁移领域时，新旧接口按以下格式组织；旧接口在迁移完成前保留：

```text
src/api/<domain>/
  index.ts               # 新接口公开入口
  types.ts               # 新接口类型
  legacy.ts              # 旧接口统一公开入口，本身就是旧接口的 index
  types-legacy.ts        # 保留的旧接口类型
  <resource>-legacy.ts   # 旧资源请求模块，按需拆分，由 legacy.ts 汇总导出
```

- 少量旧请求可以直接实现在 `legacy.ts`；旧资源较多时拆入 `<resource>-legacy.ts`，不要增加 `index-legacy.ts`、`legacy/index.ts` 或额外的 `index/legacy` 层级。
- 新调用从 `@/api/<domain>` 导入，旧调用及旧类型从 `@/api/<domain>/legacy` 导入；调用方不得绕过该入口直接依赖资源级 `-legacy` 文件，新 `index.ts` 不转导出旧接口或旧接口命名空间。

## 开发参考内容

- `src/components/dev/`、`src/routes/**/dev/` 及其他明确限定为仅开发环境可达的内容，只用于开发阶段的效果参考、交互试验和实现验证，不代表正式产品功能。
- 项目进度统计、功能清单、隐藏功能盘点、功能或交付核对、验收说明及类似文档或输出必须排除开发参考内容；只有用户明确要求统计或审查开发参考内容本身时才可体现。
- 开发参考内容转为正式功能时，必须迁出 `dev` 范围、接入正式路由与构建，并按所属规范完成实现和验证；不得仅凭开发参考内容存在而认定对应功能已经实现。

## 关联规范

- UI 组件、页面组织、样式降级顺序、交互反馈和组件拆分统一遵循 [UI 开发约定](./UI-CONVENTIONS.md)，本文件不重复维护 UI 细则。
- API 模块、类型、请求层、幂等、SSE、预签名上传及页面接入统一遵循 [API 对接流程](./API-INTEGRATION.md)，本文件不重复维护 API 细则。

## 公共适配与类型

- 时间解析、校验与展示统一使用 `date-fns`，并先封装在 `src/lib` 公共适配层；业务组件、页面和领域 API 不得直接调用 `date-fns` 或原生日期格式化。
- `src` 下的全局类型、环境类型和第三方模块增强声明统一维护在 `src/vite-env.d.ts`，不得新增 `src/types` 或其他分散的 `.d.ts` 文件；领域类型仍跟随所属 API、组件或功能模块维护。

### 组件 Props 与表单类型

- 新增或调整组件时，Props、表单值与组件私有类型直接在所属组件或页面的实现文件中声明，不单独抽取到 `types.ts`。Props 类型使用 `<ComponentName>Props` 命名，例如 `CreateInferenceModalProps`，不在组件参数中使用匿名对象类型。
- 类型默认仅在本文件内使用，只有其他文件实际需要引用时才添加 `export`，调用方通过 `import type` 引用，不为私有类型添加多余的导出或转导出。常量、初始值和辅助函数按职责放在组件实现或独立的 `constants.ts`、`utils.ts` 等实现文件中。
- 表单值类型按业务或操作命名为 `<BusinessOrAction>FormValues`，例如 `CreateInferenceFormValues`，不得使用 `CreateValues` 等缺少业务含义的名称。表单实体独立声明实际字段，不通过继承、交叉、`Pick` 或 `Omit` 等方式从整个接口提交类型派生；提交时显式组装接口参数，处理单位转换及自动生成字段。
- 表单实体独立不代表字段类型重复定义。单个字段已有对应的领域类型、枚举或联合类型时必须直接引用，例如 `runtime_mode: InferenceRuntimeMode`；不复制其枚举值，也不为复用单字段类型而关联整个提交实体。

## 异步调用与返回值

- 不为普通方法调用、事件回调或 Promise 调用机械添加 `void` 前缀；仅在确需强制丢弃返回值或满足明确接口约束时使用。
- 需要等待完成的异步操作使用 `await` 或返回 Promise；不等待的操作应有明确的错误处理归属。`void` 不会处理 Promise 拒绝，不得用它代替错误处理。

## 浏览器能力与兼容性

### 基本原则

- 普通 DOM 渲染和事件 API 可以按需使用；受安全上下文、权限、浏览器策略或实现差异影响的能力必须通过 `src/lib` 适配层接入，业务组件、页面、Hook、Store 和 API 模块不得各自实现兼容分支。
- 不得仅依据 TypeScript DOM 类型存在就假定运行时可用。新增原生 Web API 前必须核对项目浏览器基线、是否要求 HTTPS/localhost、是否需要用户授权，以及缺失、拒绝或被浏览器拦截时的行为。
- 优先使用项目已经选定的开源库；没有合适库时，在 `src/lib` 提供最小公共实现。适配层必须包含能力检测、明确的失败语义、必要的资源清理，以及不改变业务数据语义的降级路径。
- 不为“清零原生 API”机械包装基础 DOM 操作。仅当 API 存在兼容性、安全上下文、权限、资源生命周期或浏览器策略风险时集中适配。

### 统一入口

| 能力 | 必须使用 | 禁止在业务代码中直接使用 |
|------|----------|--------------------------|
| SHA-256 等文件摘要 | `src/lib/hash.ts`，底层使用 `@noble/hashes` 并分块处理文件 | `crypto.subtle`、一次性读取大文件后自行转摘要 |
| UUID | 项目已有的 `uuid` 封装或所属公共工具 | `crypto.randomUUID`、手工随机字符串 |
| 剪贴板 | `src/lib/clipboard.ts` | `navigator.clipboard`、`document.execCommand("copy")` |
| 持久化与临时存储 | `src/lib/storage.ts` 的 localForage 实例；Zustand 通过异步 `StateStorage` 适配 | `localStorage`、`sessionStorage`、裸 `indexedDB` |
| WebSocket 地址 | `src/lib/browser.ts` 的 `resolveWebSocketUrl`，并在建立连接前检测 `WebSocket` | 直接使用后端 URL 创建连接、在 HTTPS 页面继续使用 `ws:` |
| Blob 下载 | `src/lib/browser.ts` 的 `downloadBlob` | 业务组件自行调用 `URL.createObjectURL` 而遗漏能力检测或 `revokeObjectURL` |
| 外部链接 | `src/lib/browser.ts` 的 `openExternalUrl`；异步获取地址时先在点击事件中调用 `reserveExternalWindow`，失败或取消时关闭预留窗口 | 未校验协议的 `window.open`、遗漏 `noopener noreferrer` |

旧版本数据迁移可以在公共存储模块内受控读取原生存储，但必须是一次性迁移：写入 localForage 成功后清理旧键，失败时不得阻断正常 hydration。业务模块不得复制这种例外。

### 能力检测与降级

- `matchMedia`、`ResizeObserver`、`IntersectionObserver`、通知、媒体设备、文件选择器等可选能力必须在调用前检测。仅用于视觉增强时应无功能损失地关闭增强；承载核心流程时应提供可操作的错误反馈。
- WebSocket、Streams、编码器和取消能力等无法由普通 polyfill 完整替代的底层能力，应结合项目浏览器基线判断。新增使用点仍须处理构造失败、权限/协议不满足和资源释放，不得让异常逃逸为白屏。
- localForage 操作均为异步调用，必须 `await` 或显式处理 Promise；临时数据必须在成功、失败和已完成分支清理，不能因 IndexedDB 的持久性无限保留。
- 新增公共适配器时应在本章节补充统一入口和禁止写法；评审时搜索对应原生 API，确认业务代码没有绕过适配层。

## 验证

### 纯文档修改

本次任务仅修改 Markdown 文档时，检查本次修改文档的链接与标题锚点、术语、规则归属及跨文档一致性，并运行 `git diff --check`。无需为纯文档修改运行 lint、全仓格式化、格式检查或 typecheck；同时涉及代码或工程配置时，执行下方完整清单。

### 代码或工程配置修改

```bash
pnpm lint
pnpm fmt
pnpm fmt:check
pnpm typecheck
git diff --check
```

新增或修改代码时，先对本次涉及的代码文件运行 Oxlint，再执行以上完整清单；`pnpm fmt` 必须对全仓运行项目内 oxfmt。

### 变更范围检查

纯文档修改与代码或工程配置修改均须执行 GitNexus `detect_changes`，使用方式与检测时机遵循 [AGENTS.md](../AGENTS.md#验证) 及其 [GitNexus 工具规则](../AGENTS.md#gitnexus)。回归审查统一与 `main` 分支比较。

当前快速迭代阶段不保留自动化测试资产，页面与交互由用户手动验证。
