import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    '❌ فشل تحميل التطبيق: عنصر "#root" غير موجود في ملف index.html.\n' +
      'تأكد من وجود <div id="root"></div> داخل <body> في ملف index.html.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);