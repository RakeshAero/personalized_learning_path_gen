import { useEffect, useState } from "react";
import API from "../api/axios";

function Courses(){

    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {

        try {

            const response = await API.get("courses/");

            setCourses(response.data);

        } catch (error) {

            console.log(error);

        }
    };

    return (

        <div className="p-10">

            <h1 className="text-3xl font-bold mb-6">
                Courses
            </h1>

            <div className="grid gap-4">

                {courses.map((course) => (

                    <div
                        key={course.id}
                        className="border p-4 rounded"
                    >
                        <h2 className="text-xl font-bold">
                            {course.title}
                        </h2>

                        <p>
                            {course.description}
                        </p>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default Courses;