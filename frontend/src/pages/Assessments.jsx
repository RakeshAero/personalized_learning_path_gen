import { useEffect, useState } from "react";
import API from "../api/axios";
import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import { Link } from "react-router-dom";


function Assessments() {

    const [assessments, setAssessments] = useState(null);

    useEffect(() => {
        fetchAssessments();
    },[]);

    const fetchAssessments = async () => {
        try{
            const response = await API.get(`assessments/`);
            setAssessments(response.data);
        }
        catch(error){
            alert(error);
        }
    };



    return (
        <>
            <Navbar />

            <h2 className="text-2xl font-bold mt-10 mb-4">
               Assessments
            </h2>
            <div className="grid gap-4">
                {
                assessments && assessments.length > 0 ? (
                    assessments.map((assessment) => (
                        <   Link to={`/questions/${assessment.id}`} key={assessment.id} >

                        <div className="border p-4 rounded">
                            <h2 className="text-xl font-bold">
                                {assessment.title}
                            </h2>
                            <p>
                                {assessment.description}
                            </p>
                        </div>
                        </Link>
                    ))
                ) : (
                    <p>No assessments found.</p>
                )}
            </div>
        </>
    );
}

export default Assessments;