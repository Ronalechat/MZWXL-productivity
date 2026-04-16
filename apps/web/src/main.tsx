import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { TimeProvider } from "@mzwxl/ui";
import "./styles.css";
import { DashboardPage } from "./pages/dashboard/DashboardPage.js";
import { SkillsPage } from "./pages/SkillsPage.js";
import { WeekPage } from "./pages/WeekPage.js";
import { MonthPage } from "./pages/MonthPage.js";

function App() {
  const location = useLocation();
  return (
    <LayoutGroup>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<Navigate to="/" replace />} />
        <Route path="/calendar/week" element={<WeekPage />} />
        <Route path="/calendar/month" element={<MonthPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/skills/:id" element={<SkillsPage />} />
      </Routes>
    </AnimatePresence>
    </LayoutGroup>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <TimeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TimeProvider>
  </StrictMode>
);
