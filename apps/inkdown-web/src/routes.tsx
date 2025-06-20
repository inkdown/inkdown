import {
  createBrowserRouter,
  Outlet,
} from "react-router-dom"
import NotebookPage from "./pages/notebook/page"
import SettingsPage from "./pages/settings/page";
import SignUpPage from "./pages/signup/page";
import App from "./App";
import LoginPage from "./pages/login/page";
import SettingsLayout from "./pages/settings/layout";
import { ThemeProvider } from "./providers/theme-provider";
import NotebookLayout from "./pages/notebook/layout";
import NotFoundPage from "./pages/notefound-page";
import TextAreaWithLineCount from "./pages/teste/page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>
  },
  {
    path: "/notebook",
    element: <NotebookLayout/>,
    children: [
      {
        index: true,
        element: <NotebookPage/>
      }
    ]
  },
  {
    path: "/settings",
    element: <SettingsLayout/>,
    children: [
      {
        index: true,
        element: <SettingsPage />
      },
    ],
  },
  {
    path: "/signup",
    element: <SignUpPage/>
  },
  {
    path: "/login",
    element: <LoginPage/>
  },
  {
    path: "/notfound",
    element: <NotFoundPage/>
  },
  {
    path: "/test",
    element: <TextAreaWithLineCount/>
  }
]);