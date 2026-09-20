// React
import React from 'react'
import ReactDOM from "react-dom/client";

import App from '@/App.tsx';

const container = document.getElementById('aa-fenrir-root')

if (!container) {
  throw new Error('Belt Radar React mount point was not found.')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
