import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.web' // .web.js 파일을 명시적으로 import

const root = ReactDOM.createRoot(document.getElementById('app'))
root.render(<App />)