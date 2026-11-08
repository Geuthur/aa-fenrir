// React
import React from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

// Third Party
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AaReactProvider, AuthBase, ErrorPage } from "aa-geuthur-react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";

import { AppName, ProjectName } from "@/constants";
import Administration from "@/Pages/Administration";
import Calculator from "@/Pages/Calculator";
import Queue from "@/Pages/Queue";
import RouteAdmin from "@/Pages/RouteAdmin";
import Settings from "@/Pages/Settings";

const queryClient = new QueryClient();

function Routing() {
  return (
    <React.StrictMode>
      <AaReactProvider projectName={ProjectName} appName={AppName}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <NuqsAdapter>
              <Routes>
                <Route path={`/${ProjectName}/`} element={<AuthBase fluidOnSmallScreens />}>
                  <Route index element={<Calculator />} />
                  <Route path="calculator/" element={<Calculator />} />
                  <Route path="queue/" element={<Queue />} />
                  <Route path="settings/" element={<Settings />} />
                  <Route path="administration/" element={<Administration />} />
                  <Route path="routes/admin/" element={<RouteAdmin />} />
                  <Route path="admin/routes/" element={<RouteAdmin />} />
                  <Route path="*" element={<ErrorPage />} />
                </Route>
                <Route path="*" element={<Navigate to={`/${ProjectName}/`} replace />} />
              </Routes>
            </NuqsAdapter>
          </BrowserRouter>
        </QueryClientProvider>
      </AaReactProvider>
    </React.StrictMode>
  )
}

export default Routing
