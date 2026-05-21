import { useState } from "react";
import API from "../api/axios";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try{
            if(!username || !password){
                setError('Please enter both username and password');
            }

            const response = await API.post('users/login/',{
                username,
                password
            });

            console.log(response.data);
        }
        catch(error){
            console.log("Error ",error.message);
            setError('Invalid Credentials');
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="border p-8 rounded">
                <h1 className="text-2xl font-bold mb-4">Login Page</h1>
            </div>

            <input 
                type="text" 
                className="border p-2 w-full mb-3" 
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                />
        </div>
    );
}

export default Login;


{/* <div className="flex items-center justify-center min-h-screen">

            <div className="border p-8 rounded">

                <h1 className="text-2xl font-bold mb-4">
                    Login
                </h1>

                <input
                    type="text"
                    placeholder="Username"
                    className="border p-2 w-full mb-3"
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 w-full mb-3"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={handleLogin}
                    className="bg-black text-white px-4 py-2 rounded w-full"
                >
                    Login
                </button>

            </div>

        </div> */}