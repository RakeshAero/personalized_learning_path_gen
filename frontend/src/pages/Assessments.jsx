import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";

function Assessments() {
    const [assessments, setAssessments] = useState(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const response = await API.get('assessments/');
            setAssessments(response.data);
        } catch {
            alert('Failed to load assessments');
        }
    };

    return (
        <>
            <Navbar />

            <div className="p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Assessments</h2>

                {!assessments ? (
                    <p>Loading...</p>
                ) : assessments.length === 0 ? (
                    <p className="text-gray-500">No assessments available.</p>
                ) : (
                    <div className="grid gap-4">
                        {assessments.map((assessment) => (
                            <Link to={`/questions/${assessment.id}`} key={assessment.id}>
                                <div className="border p-4 rounded hover:bg-gray-50 transition">
                                    <h2 className="text-xl font-bold">{assessment.title}</h2>
                                    {assessment.module_title && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Module: {assessment.module_title}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-400 mt-1">
                                        {assessment.questions?.length ?? 0} questions
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default Assessments;
