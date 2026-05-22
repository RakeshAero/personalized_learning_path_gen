import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
}); 

API.interceptors.request.use((config) => {  //config contains the details of HTTP request that u'll send

    const token = localStorage.getItem('access');
    if(token){
        config.headers.Authorization = `Bearer ${token}`; // add Authorization Header to the HTTP request
    }

    return config;
});

export default API;

// Now instead of: axios.get("http://127.0.0.1:8000/api/courses/")
// We can use: API.get("/courses/")