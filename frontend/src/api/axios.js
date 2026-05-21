import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
}); 

export default API;

// Now instead of: axios.get("http://127.0.0.1:8000/api/courses/")
// We can use: API.get("/courses/")