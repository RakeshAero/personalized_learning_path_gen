import { useEffect, useState } from "react";
import API from "../api/axios";
import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";

function CourseList(){

    const [courselist, setCourseList] = useState(null);

    const { id } = useParams();

    useEffect(() => {
        fectchCourseList();
    },[]);

    const fectchCourseList = async () => {
        try{
            const response = await API.get(`courses/${id}/`);

            setCourseList(response.data);
        }
        catch(error){
            alert(error);
        }
        
    };

    if(!courselist){
        return <div>Loading...</div>;
    }

     return (

        <>
            <Navbar />

            <h2 className="text-2xl font-bold mt-10 mb-4">
               Modules
            </h2>

            <div className="grid gap-4">

                {
                
                courselist.modules.length == 0 ? (<p>No Modules Available</p>) : // Ternary Operator
                
                courselist.modules.map((module) => (

                <div
                    key={module.id}
                    className="border p-4 rounded"
                >
                
                    <h3 className="text-xl font-bold">
                        {module.title}
                    </h3>

                    <p>
                        {module.description}
                    </p>

                </div>
                ))}
            </div>
        </>
    );
}

export default CourseList;