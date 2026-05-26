import { createContext, useState, useEffect } from "react";
export const AuthContext = createContext();

function AuthProvider({ children }) {
    const [token, setToken] = useState(
        localStorage.getItem("access")
    );

    const login = (access, refresh) => {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        setToken(access);
    };

    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;