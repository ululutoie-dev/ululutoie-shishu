import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/app.css'
import { defaultTheme, applyTheme } from './lib/theme.js'
import App from './App.jsx'
applyTheme(defaultTheme) // 初回描画前に既定デザインを適用（保存済みの設定は読み込み後に上書き）
createRoot(document.getElementById('root')).render(<App />)
