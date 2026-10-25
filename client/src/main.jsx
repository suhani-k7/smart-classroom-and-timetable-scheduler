import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DatasetProvider } from "./context/DatasetContext";
import AdminPage from "./pages/AdminPage";
import TeacherPage from "./pages/TeacherPage";
import RunsPage from "./pages/RunsPage";


ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <DatasetProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/runs" element={<RunsPage />} />
      </Routes>
    </DatasetProvider>
  </BrowserRouter>
);