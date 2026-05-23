import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";

function Courses(){

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {  //Handles sideffect of Outside component
        fetchCourses();
    }, []);

    const fetchCourses = async () => {

        try {

            const response = await API.get("courses/");  // GET Request to Django

            setCourses(response.data);

        } catch (error) {

            console.log(error);

        } finally {
            setLoading(false);
        }
    };

    if(loading){
        return <div>Loading...</div>;
    }

    return (
        <>
        <Navbar />
        <div className="p-10">
            
            <h1 className="text-3xl font-bold mb-6">
                Courses
            </h1>

            <div className="grid gap-4">

                {
                
                courses.length == 0 ? ( <p>No Course Available</p> ) :  // Ternary Operator

                courses.map((course) => (

                    <Link to={`/courses/${course.id}`} key={course.id} >

                    <div className="border p-4 rounded">
                        <h2 className="text-xl font-bold">
                            {course.title}
                        </h2>

                        <p>
                            {course.description}
                        </p>

                    </div>

                    </Link>

                ))}

            </div>

        </div>
        </>
    );
}

export default Courses;