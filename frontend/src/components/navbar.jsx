import { Link } from "react-router-dom";

function Navbar(){
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

            <Link to="/create-course">
                Create-Course
            </Link>

            <Link to="/create-module">
                Create-Module
            </Link>

            <button onClick={logout}>
                Logout
            </button>

        </div>
    );
}

export default Navbar;