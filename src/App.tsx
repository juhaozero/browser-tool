import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import Home from '@/pages/Home'
import ToolPage from '@/pages/ToolPage'
import { appConfig } from '@/config/app'

/** 应用路由：Layout 包裹所有页面，提供顶栏与侧栏 */
export default function App() {
  return (
    <BrowserRouter basename={appConfig.routerBasename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tool/:toolId" element={<ToolPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
