import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards.jsx";
import Layout from "./components/Layout.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyMeds from "./pages/MyMeds.jsx";
import MemberDetail from "./pages/MemberDetail.jsx";
import Medications from "./pages/Medications.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* first-run wizard for caregivers */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* caregiver app (sidebar layout) */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/members/:id" element={<MemberDetail />} />
                <Route path="/medications" element={<Medications />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
            </Route>

            {/* member self-view — large, focused, no sidebar */}
            <Route path="/my-meds" element={<ProtectedRoute member><MyMeds /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
