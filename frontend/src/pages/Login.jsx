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
        }
        catch(error){
            console.log("Error ",error.message);
            setError('Invalid Credentials');
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Login Page</h1>
        </div>
    );
}

export default Login;