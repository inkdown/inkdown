import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import "./themes/themes.css"
import { RouterProvider } from "react-router-dom"
import { router } from "./routes.tsx"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/react-query.ts"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </QueryClientProvider>
)
