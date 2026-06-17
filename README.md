# Browser Tool — 浏览器工具箱

纯前端开发者工具集。所有工具在浏览器本地运行，**数据不上传服务器**，无需安装、无需注册。

## 特性

- **隐私优先**：计算、转换、哈希均在本地 Web Crypto / DOM API 中完成
- **模块化架构**：每个工具独立组件，通过注册表统一管理，易于扩展
- **开箱即用工具**：JSON、Base64、UUID、时间戳、哈希、JWT 等
- **深色/浅色主题**：跟随系统偏好，可手动切换
- **响应式布局**：桌面侧边栏 + 移动端适配

## 快速开始

```bash
npm install
npm run dev      # 开发服务器，默认 http://localhost:5173
npm run build    # 生产构建，输出到 dist/
npm run preview  # 本地预览构建结果，默认 http://localhost:4173
```

## 开发端口说明

**为什么是 5173？**

本项目使用 [Vite](https://vite.dev/) 作为开发服务器。`5173` 是 Vite 的默认开发端口（预览模式默认端口为 `4173`），无需额外配置即可直接运行。

**如何自定义端口？**

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
npm run dev -- --port 3000
npm run preview -- --port 8080
```

**方式三：指定监听地址**

```bash
npm run dev -- --host 0.0.0.0 --port 3000
```

`--host 0.0.0.0` 。

## 部署

本项目是纯静态站点。执行 `npm run build` 后，`dist/` 目录即为可部署的完整产物。

### 部署前检查

```bash
npm run build
npm run preview   # 本地验证 dist/ 是否正常
```

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Lucide Icons

## License

MIT
