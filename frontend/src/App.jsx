import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Policies from "./pages/Policies";
import Payments from "./pages/Payments";
import Claims from "./pages/Claims";
import Agents from "./pages/Agents";
import Surveyors from "./pages/Surveyors";
import Branches from "./pages/Branches";
import Hospitals from "./pages/Hospitals";
import Nominees from "./pages/Nominees";
import Documents from "./pages/Documents";
import Vehicles from "./pages/Vehicles";
import Properties from "./pages/Properties";
import Businesses from "./pages/Businesses";
import PolicyTypes from "./pages/PolicyTypes";
import AdminApprovals from "./pages/AdminApprovals";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes inside MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Role Dashboards */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customer/dashboard" element={<Dashboard />} />
            <Route path="/agent/dashboard" element={<Dashboard />} />
            <Route path="/surveyor/dashboard" element={<Dashboard />} />

            {/* Core Modules */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/surveyors" element={<Surveyors />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/nominees" element={<Nominees />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/policy-types" element={<PolicyTypes />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Governance */}
            <Route
              path="/admin/approvals"
              element={
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <AdminApprovals />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <UserManagement />
                </RoleBasedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;