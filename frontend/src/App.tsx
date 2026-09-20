// React
import React from "react"
import {  BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
// Third Party
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "i18next";
import Backend from "i18next-http-backend";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { initReactI18next, useTranslation } from "react-i18next";

// Styles
import "@/App.css"

import ErrorLoader from "@/Components/Loader/ErrorLoader"
import AuthBase from "@/Pages/Base";
import Settings from "@/Pages/Settings";
import Calculator from "@/Pages/Calculator";
import Queue from "./Pages/Queue";
import RouteAdmin from "@/Pages/RouteAdmin";

const queryClient = new QueryClient();
export const AppName = "aa-fenrir";
export const ProjectName = "aafenrir";

// Read language directly from Django's LANGUAGE_CODE (set as lang="..." on root div)
const djangoLanguage = typeof document !== "undefined" ? document.getElementById(`${AppName}-root`)?.getAttribute("lang") ?? "en" : "en";

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: djangoLanguage,
    fallbackLng: "en",
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
    react: {
      useSuspense: false, //   <---- this will do the magic
    },
    backend: {
      loadPath: `/static/${ProjectName}/i18n/{{lng}}/{{ns}}.json`,
    },
  });

function App() {
  const { t } = useTranslation();
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NuqsAdapter>
            <Routes>
              <Route path={`/${ProjectName}/`} element={<AuthBase />}>
                <Route index element={<Calculator />} />
                <Route path="calculator/" element={<Calculator />} />
                <Route path="queue/" element={<Queue />} />
                <Route path="settings/" element={<Settings />} />
                <Route path="routes/admin/" element={<RouteAdmin />} />
                <Route path="admin/routes/" element={<RouteAdmin />} />
                <Route path="*" element={<ErrorLoader title={t("Error 404")} message={t("The page you are looking for does not exist.")} />} />
              </Route>
              <Route path="*" element={<Navigate to={`/${ProjectName}/`} replace />} />
            </Routes>
          </NuqsAdapter>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )
}

export default App