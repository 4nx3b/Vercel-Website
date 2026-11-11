import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// One flag for every CSS loop: pause them all while the tab is hidden.
const syncHidden = () => document.documentElement.toggleAttribute("data-hidden", document.hidden);
document.addEventListener("visibilitychange", syncHidden);
syncHidden();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
