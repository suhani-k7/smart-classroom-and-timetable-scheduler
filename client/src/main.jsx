import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DatasetProvider } from "./context/DatasetContext";
import AdminPage from "./pages/AdminPage";
import TeacherPage from "./pages/TeacherPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <DatasetProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
      </Routes>
    </DatasetProvider>
  </BrowserRouter>
);