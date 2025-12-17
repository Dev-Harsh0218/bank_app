import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import Customers from "@/pages/Customers";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({
  element,
  allowedRoles,
}: {
  element: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // logged in but not allowed for this route
    return <Navigate to="/" replace />;
  }

  return element;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route
            path="/members"
            element={
              <ProtectedRoute
                element={<Members />}
                allowedRoles={["admin", "super-admin"]} // <- only these can access
              />
            }
          />
          <Route
            path="/customers"
            element={<ProtectedRoute element={<Customers />} />}
          />
          <Route
            path="/messages"
            element={<ProtectedRoute element={<Messages />} />}
          />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;