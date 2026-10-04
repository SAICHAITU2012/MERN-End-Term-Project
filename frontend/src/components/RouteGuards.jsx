import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PillIcon } from "./icons.jsx";

export function FullPageLoader() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
            <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-brand-600 text-white">
                <PillIcon size={28} />
            </div>
            <p className="text-sm font-medium text-stone-400">Loading MedMate…</p>
        </div>
    );
}

export function ProtectedRoute({ children, caregiver = false, member = false }) {
    const { user, loading, onboardingNeeded } = useAuth();
    if (loading) return <FullPageLoader />;
    if (!user) return <Navigate to="/login" replace />;
    if (caregiver && user.role !== "caregiver") return <Navigate to="/my-meds" replace />;
    if (member && user.role !== "member") return <Navigate to="/dashboard" replace />;
    // first-run: caregivers must add a member + medication before the app makes sense
    if (onboardingNeeded && user.role === "caregiver" && !location.pathname.startsWith("/onboarding")) {
        return <Navigate to="/onboarding" replace />;
    }
    return children;
}

export function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <FullPageLoader />;
    if (user) return <Navigate to={user.role === "member" ? "/my-meds" : "/dashboard"} replace />;
    return children;
}
