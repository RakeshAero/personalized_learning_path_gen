import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

function InstructorRoute({ children }){
    const { user } = useContext(AuthContext);

    if(user?.role !== 'instructor' && user?.role !== 'admin'){
        return <Navigate to="/dashboard" />;
    }

    return children;
}

export default InstructorRoute;