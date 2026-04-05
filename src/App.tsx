import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/pages/HomePage";
import { DrawPage } from "@/pages/DrawPage";
import { VerifyPage } from "@/pages/VerifyPage";
import { AboutPage } from "@/pages/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/draw" element={<DrawPage />} />
          <Route path="/draw/:presetId" element={<DrawPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
