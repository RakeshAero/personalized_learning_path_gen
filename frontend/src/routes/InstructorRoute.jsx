import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

function InstructorRoute({ children }) {
    const { user, loading } = useContext(AuthContext);

    // Wait for profile to load before deciding to redirect
    if (loading) return null;

    if (user?.role !== 'instructor' && user?.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }

    return children;
}

export default InstructorRoute;
