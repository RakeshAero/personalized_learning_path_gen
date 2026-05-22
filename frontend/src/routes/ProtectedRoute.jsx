import { Navigate } from "react-router-dom";

//User cannot access dashboard without Token
//The <Dashboard /> component automatically becomes the {children} prop inside ProtectedRoute.
function ProtectedRoute({ children }){
    const token = localStorage.getItem('access');
    if(!token){
        return <Navigate to={'/'} />;
    }

    return children ;
}

export default ProtectedRoute;