import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsListPage } from "./pages/ProjectsListPage";
import { NewProjectPage } from "./pages/NewProjectPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GitHubCallbackPage } from "./pages/GitHubCallbackPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App min-h-screen bg-background">
          <BrowserRouter>
            <Navbar />
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              theme="system"
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <ProjectsListPage />
                </ProtectedRoute>
              } />
              <Route path="/projects/new" element={
                <ProtectedRoute>
                  <NewProjectPage />
                </ProtectedRoute>
              } />
              <Route path="/projects/:projectId" element={
                <ProtectedRoute>
                  <ProjectDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/github/callback" element={
                <ProtectedRoute>
                  <GitHubCallbackPage />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
