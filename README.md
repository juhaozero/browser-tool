# Browser Tool — 浏览器工具箱

![GitHub License](https://img.shields.io/github/license/juhaozero/browser-tool)

纯前端工具集。绝大多数工具在浏览器本地运行；少数工具（如 IP 查询）需联网访问第三方接口。

## 特性

- **隐私优先**：计算、转换、哈希均在本地 Web Crypto / DOM API 中完成（IP 查询等少数工具除外）
- **模块化架构**：每个工具独立组件，通过注册表统一管理，易于扩展
- **开箱即用工具**：JSON、Base64、UUID、时间戳、哈希、JWT 等
- **深色/浅色主题**：跟随系统偏好，可手动切换
- **响应式布局**：桌面侧边栏 + 移动端适配
- **桌面客户端**：基于 Tauri 2 打包安装包

## 快速开始

```bash
npm install -g pnpm
git clone --recurse-submodules <repo-url>
# 若已 clone 但未拉取 submodule：git submodule update --init --recursive
pnpm install
pnpm run dev      # 开发服务器，默认 http://localhost:5173
pnpm run build    # Web 生产构建，输出到 dist/
pnpm run preview  # 本地预览构建结果，默认 http://localhost:4173
```

### gitignore 模板（submodule）

`.gitignore 生成器` 的模板来自 [github/gitignore](https://github.com/github/gitignore)，以 submodule 形式放在 `vendor/gitignore/`。构建时会自动扫描并生成 `src/data/gitignore/` 下的 JSON 索引。

```bash
# 更新官方模板到最新
git submodule update --remote vendor/gitignore
pnpm run sync:gitignore
```

**自定义端口**

任选一种方式即可：

**方式一：修改配置文件（推荐，长期生效）**

编辑 `vite.config.ts`：

```typescript
export default defineConfig({
  server: {
    port: 3000,       // 开发端口
    strictPort: false // true = 端口被占用时报错；false = 自动尝试下一个可用端口
  },
  preview: {
    port: 8080,       // npm run preview 的端口
  },
})
```

**方式二：命令行临时指定（不改配置文件）**

```bash
pnpm run dev -- --port 3000
pnpm run preview -- --port 8080
```

**方式三：指定监听地址**

```bash
pnpm run dev -- --host 0.0.0.0 --port 3000
```


## Web 部署

本项目是纯静态站点。执行 `pnpm run build` 后，`dist/` 目录即为可部署的完整产物。

构建末尾会预渲染各工具页 HTML（`dist/tool/{id}/index.html`），写入：

- `<title>` / `<meta description>` / Open Graph / Twitter Card
- 结构化正文（介绍 / 要点 / FAQ）与相关工具内链
- JSON-LD（`WebApplication` + `BreadcrumbList` + 可选 `FAQPage`）
- 分享图 `dist/og/home.png` 与 `dist/og/tool-{id}.png`（无 CJK 字体时回退为 SVG）

增强文案维护在 `src/data/tool-seo.json`。部署时请上传**整个** `dist/`，不要只传首页。OG PNG 优先使用系统中文字体，也可将字体放到 `scripts/assets/fonts/` 或设置 `OG_FONT_PATH`。

### 子路径部署

默认部署在域名根路径（`/`）。若需挂到子路径（如 `https://example.com/app/`），修改 `.env`：

```bash
VITE_BASE_PATH=/app/
```

也可直接改 `src/config/base-path.ts` 中的 `DEFAULT_BASE_PATH`。构建后把 `dist/` 内容放到服务器的 `/app/` 目录，并配置 SPA 回退到 `/app/index.html`。

### 部署前检查

```bash
pnpm run build
pnpm run preview   # 本地验证 dist/ 是否正常
```

## Tauri 桌面端（Windows）

### 环境要求

| 依赖 | 说明 |
|------|------|
| [Node.js](https://nodejs.org/) | 与 Web 开发相同 |
| [pnpm](https://pnpm.io/) | 包管理 |
| [Rust](https://www.rust-lang.org/tools/install) | Tauri 后端编译 |
| [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) ||
| WebView2 | Windows 10/11 通常已内置 |

安装 Rust 后执行 `rustup default stable`。

### 开发

```bash
pnpm run tauri:dev
```


### 打包 Windows 安装包

```bash
pnpm run tauri:build
```

产物位于 `src-tauri/target/release/bundle/`：

- `nsis/` — NSIS 安装程序（`.exe`）
- `msi/` — MSI 安装包

### Tauri 与 Web 构建差异（重要）

| 项目 | Web (`pnpm run build`) | Tauri (`pnpm run tauri:build`) |
|------|------------------------|--------------------------------|
| `VITE_BASE_PATH` | 读取 `.env`，可设子路径 | **自动忽略**，强制 `base: './'` |
| 静态资源路径 | 绝对或子路径 | 相对路径 `./assets/...` |
| React Router | 可设 `basename` | `basename` 为空（根路由） |
| 联网请求 | 浏览器 `fetch` | Tauri 环境走 `@tauri-apps/plugin-http` |


## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Lucide Icons
- Tauri 2（桌面端）

## License

MIT
