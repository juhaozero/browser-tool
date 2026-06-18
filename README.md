# Browser Tool — 浏览器工具箱

![GitHub License](https://img.shields.io/github/license/juhaozero/browser-tool)

纯前端工具集。所有工具在浏览器本地运行，**数据不上传服务器**。

## 特性

- **隐私优先**：计算、转换、哈希均在本地 Web Crypto / DOM API 中完成
- **模块化架构**：每个工具独立组件，通过注册表统一管理，易于扩展
- **开箱即用工具**：JSON、Base64、UUID、时间戳、哈希、JWT 等
- **深色/浅色主题**：跟随系统偏好，可手动切换
- **响应式布局**：桌面侧边栏 + 移动端适配

## 快速开始

```bash
npm install -g pnpm
pnpm install
pnpm run dev      # 开发服务器，默认 http://localhost:5173
pnpm run build    # 生产构建，输出到 dist/
pnpm run preview  # 本地预览构建结果，默认 http://localhost:4173
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

`--host 0.0.0.0` 。

## 部署

本项目是纯静态站点。执行 `pnpm run build` 后，`dist/` 目录即为可部署的完整产物。

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

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Lucide Icons

## License

MIT 
