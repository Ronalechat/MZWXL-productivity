import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { TimeProvider } from "@mzwxl/ui";
import "./styles.css";
import { DashboardPage } from "./pages/DashboardPage.js";
import { SkillsPage } from "./pages/SkillsPage.js";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <TimeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/skills/:id" element={<SkillsPage />} />
        </Routes>
      </BrowserRouter>
    </TimeProvider>
  </StrictMode>
);
