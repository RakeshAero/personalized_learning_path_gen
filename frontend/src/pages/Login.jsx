import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";


function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate(); //Redirect

    const handleLogin = async () => {
        try{
            if(!username || !password){
                setError('Please enter both username and password');
                return;
            }

            // POST Request
            const response = await API.post('users/login/',{
                username,
                password
            });
            
            //Access & Refresh Token
            const Tokens = response.data;

            //Login using Context
            login(Tokens.access, Tokens.refresh);

            //Redirect to Dashboard
            navigate('/dashboard');
        }
        catch(error){
            console.log("Error ",error.message);
            setError('Invalid Credentials');
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="border p-8 rounded">
                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">Login Page</h1>

                {/* Username */}
                <input 
                    type="text" 
                    className="border p-2 w-full mb-3" 
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                    />

                {/* Password */}
                <input 
                    type="password"
                    className="border p-2 w-full mb-3"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                <button className="bg-black text-white px-4 py-2 rounded w-full mb-3" onClick={handleLogin}>
                    Login
                </button>

                <p className="text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-black font-semibold underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
