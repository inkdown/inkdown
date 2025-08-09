import {
  createBrowserRouter,
} from "react-router-dom"
import { lazy, Suspense } from "react";

const NotFoundPage = lazy(() => import("./pages/notefound-page"));
const DocsPage = lazy(() => import("./pages/docs/page"));
const ReleasesPage = lazy(() => import("./pages/releases/page"));

import App from "./App";
import { Skeleton } from "./components/ui/skeleton";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/releases",
    element: <Suspense fallback={<Skeleton className="mx-20 my-8 w-full h-full" />}><ReleasesPage /></Suspense>
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
    path: "/docs",
    element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><DocsPage /></Suspense>,
    children: [
      {
        path: ":slug",
        element: <Suspense fallback={<Skeleton className="mx-20 my-8 wfull h-full" />}><DocsPage /></Suspense>,
      },
    ],
  },
]);

