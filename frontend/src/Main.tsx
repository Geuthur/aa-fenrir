/*
 * The global stylesheet must load before the CSS modules of the app, otherwise its classes
 * (e.g. fenrir-border-500) win over module classes of equal specificity. Vite orders the CSS
 * by import order, so this file keeps the stylesheet in front of the @/ imports.
 */
/* eslint-disable import-headings/import-headings */
// React
import React from 'react'
import ReactDOM from "react-dom/client";

// Third Party
import { initI18n } from "aa-geuthur-react";

// Styles
import '@/Styles/index.css';

// AA Fenrir
import { AppName, ProjectName } from '@/constants';
import Routing from '@/Routing';
export { AppName, ProjectName };

// Language from Django's LANGUAGE_CODE (lang="..." on the root div), texts of the app from static/<ProjectName>/i18n
initI18n(ProjectName, `${AppName}-root`);

const container = typeof document !== "undefined" ? document.getElementById(`${AppName}-root`) : null;

if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <Routing />
    </React.StrictMode>,
  );
}
