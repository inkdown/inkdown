import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { router } from "./routes.tsx"
import { ThemeProvider } from "./contexts/theme-context.tsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="inkdown-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </React.StrictMode>
)
