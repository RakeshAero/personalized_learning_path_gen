import { createContext, useState, useEffect } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

function AuthProvider({ children }) {

    const [token, setToken] = useState(
        localStorage.getItem("access")
    );

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {

        try {

            const response = await API.get(
                "users/profile/"
            );

            setUser(response.data);

        } catch (error) {

            console.error(
                "Failed to fetch user profile:",
                error
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {

        if (token) {

            fetchProfile();

        } else {

            setLoading(false);
        }

    }, [token]);

    const login = (access, refresh) => {

        localStorage.setItem(
            "access",
            access
        );

        localStorage.setItem(
            "refresh",
            refresh
        );

        setToken(access);
    };

    const logout = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        setToken(null);
        setUser(null);
    };

    return (

        <AuthContext.Provider
            value={{
                token,
                user,
                loading,
                login,
                logout,
                fetchProfile
            }}
        >
            {children}
        </AuthContext.Provider>

    );
}

export default AuthProvider;