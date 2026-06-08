import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

function Navbar(){
    const { user } = useContext(AuthContext);
    console.log("User in Navbar:", user);
    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');

        window.location.href = '/';
    }
    return (
        <div className="bg-black text-white p-4 flex gap-6">

            <Link to="/dashboard">
                Dashboard
            </Link>

            <Link to="/courses">
                Courses
            </Link>

            {user && user.role === 'admin' && (
                <Link to="/create-course">
                    Create-Course
                </Link>
            )}

            {user && user.role === 'admin' && (
                <Link to="/create-module">
                    Create-Module
                </Link>
            )}

            {user && user.role === 'student' && (
                <Link to="/assessments">
                    Assessments
                </Link>
            )}

            {user && (
                <span>Welcome, {user.username}!</span>
            )}

            <button onClick={logout}>
                Logout
            </button>

        </div>
    );
}

export default Navbar;