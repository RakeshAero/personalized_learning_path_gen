import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import API from "../api/axios";
function Dashboard(){

    const [courses, setCourses] = useState('');

    useEffect(() => {  //Handles sideffect of Outside component
        fetchCourses();
    },[]);

    const fetchCourses = async () => {
        try{
            const response = await API.get('courses/'); // GET Request to Django

            setCourses(response.data);
        }
        catch(error){
            alert(error);
        }
    }

    return (

        <>
            <Navbar />

            <div className="p-10">

                <h1 className="text-3xl font-bold mb-8">
                    Dashboard
                </h1>

                <div className="grid grid-cols-3 gap-6">

                    <div className="border p-6 rounded">

                        <h2 className="text-xl font-bold">
                            Total Courses
                        </h2>

                        <p className="text-4xl mt-4">
                            {courses.length}
                        </p>

                    </div>

                </div>

            </div>
        </>
    );
}

export default Dashboard;