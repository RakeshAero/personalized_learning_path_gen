import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

function Navbar() {
    const { user } = useContext(AuthContext);

    const isAdmin = user?.role === 'admin' || user?.role === 'instructor';

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/';
    };

    return (
        <div className="bg-black text-white p-4 flex gap-6 items-center flex-wrap">

            <Link to="/dashboard">Dashboard</Link>
            <Link to="/courses">Courses</Link>

            {isAdmin && <Link to="/create-course">Create Course</Link>}
            {isAdmin && <Link to="/create-module">Create Module</Link>}
            {isAdmin && <Link to="/create-assessment">Create Assessment</Link>}
            {isAdmin && <Link to="/create-question">Create Question</Link>}

            {user?.role === 'student' && (
                <Link to="/assessments">Assessments</Link>
            )}

            {user && (
                <span className="ml-auto">Welcome, {user.username}!</span>
            )}

            <button onClick={logout}>Logout</button>
        </div>
    );
}

export default Navbar;
