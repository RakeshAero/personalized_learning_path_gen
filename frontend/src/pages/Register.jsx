import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError('');
        setSuccess('');

        if (!username || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await API.post('users/register/', { username, email, password });
            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            const data = err.response?.data;
            if (data?.username) setError(`Username: ${data.username[0]}`);
            else if (data?.email) setError(`Email: ${data.email[0]}`);
            else if (data?.password) setError(`Password: ${data.password[0]}`);
            else setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="border p-8 rounded ">
                <h1 className="text-2xl font-bold mb-4">Create Account</h1>

                {error && (
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                )}
                {success && (
                    <p className="text-green-600 text-sm mb-3">{success}</p>
                )}

                <input
                    type="text"
                    className="border p-2 w-full mb-3"
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="email"
                    className="border p-2 w-full mb-3"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    className="border p-2 w-full mb-4"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    className="bg-black text-white px-4 py-2 rounded w-full mb-3"
                    onClick={handleRegister}
                >
                    Register
                </button>

                <p className="text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/" className="text-black font-semibold underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
