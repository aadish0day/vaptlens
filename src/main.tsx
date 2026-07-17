import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { MotionConfig } from "framer-motion";
import App from "./App";
import { useDashboardStore as useStore } from "./store/useDashboardStore";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>
);

if (typeof window !== "undefined") {
  (window as unknown as { __store: typeof useStore }).__store = useStore;
}
