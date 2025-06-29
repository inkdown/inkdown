import {
  createBrowserRouter,
} from "react-router-dom"
import { lazy, Suspense } from "react";

const NotebookPage = lazy(() => import("./pages/notebook/page"));
const SettingsPage = lazy(() => import("./pages/settings/page"));
const SignUpPage = lazy(() => import("./pages/signup/page"));
const LoginPage = lazy(() => import("./pages/login/page"));
const AuthPage = lazy(() => import("./pages/auth/page"));
const NotFoundPage = lazy(() => import("./pages/notefound-page"));

import App from "./App";
import SettingsLayout from "./pages/settings/layout";
import NotebookLayout from "./pages/notebook/layout";
import { Skeleton } from "./components/ui/skeleton";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/notebook",
    element: <NotebookLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><NotebookPage /></Suspense>
      }
    ]
  },
  {
    path: "/settings",
    element: <SettingsLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><SettingsPage /></Suspense>
      },
    ],
  },
  {
    path: "/signup",
    element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><SignUpPage /></Suspense>
  },
  {
    path: "/login",
    element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><LoginPage /></Suspense>
  },
  {
    path: "/notfound",
    element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><NotFoundPage /></Suspense>
  },
  {
    path: "*", 
    element: <NotFoundPage/>,
  },
  {
    path: "/auth-callback",
    element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><AuthPage /></Suspense>
  },
]);
