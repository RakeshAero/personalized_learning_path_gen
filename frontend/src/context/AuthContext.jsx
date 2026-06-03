import { createContext, useState, useEffect } from "react";
export const AuthContext = createContext();



function AuthProvider({ children }) {
    const [token, setToken] = useState(
        localStorage.getItem("access")
    );

    const [user, setUser] = useState(null);

    const login = async (access, refresh) => {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        setToken(access);

        await fetchProfile();
    };

    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setToken(null);
        setUser(null);
    }

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile/");
            setUser(response.data);
        }
        catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    }

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;