import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useContext } from "react";

//User cannot access dashboard without Token
//The <Dashboard /> component automatically becomes the {children} prop inside ProtectedRoute.
function ProtectedRoute({ children }){
    const { token } = useContext(AuthContext);
    if(!token){
        return <Navigate to={'/'} />;
    }

    return children ;
}

export default ProtectedRoute;