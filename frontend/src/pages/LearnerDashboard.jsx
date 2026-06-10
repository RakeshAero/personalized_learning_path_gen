import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";

function LearnerDashboard() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const response = await API.get("enrollments/");
            setEnrollments(response.data);
        } catch (error) {
            console.error("Failed to load enrollments", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center h-screen bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-10 px-6 sm:px-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Learner Dashboard</h1>
                            <p className="text-gray-500 mt-1">Track your progress and personalized learning paths.</p>
                        </div>
                        <Link
                            to="/courses"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            Explore Courses
                        </Link>
                    </header>

                    {enrollments.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm max-w-lg mx-auto">
                            <span className="text-5xl">🎓</span>
                            <h2 className="text-xl font-semibold text-gray-800 mt-4">No Courses Enrolled Yet</h2>
                            <p className="text-gray-500 mt-2">Browse our course offerings and start learning today!</p>
                            <Link
                                to="/courses"
                                className="mt-6 inline-block px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition"
                            >
                                Browse Courses
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {enrollments.map((item) => (
                                <div
                                    key={item.enrollment_id}
                                    className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                    {/* Card Header Color Ribbon */}
                                    <div className={`h-2 w-full ${item.has_onboarding && !item.onboarding_submitted ? "bg-amber-400" : "bg-emerald-500"}`}></div>
                                    
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{item.course_title}</h3>
                                            <p className="text-gray-500 text-sm mb-6 line-clamp-3">{item.course_description || "No description provided."}</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Onboarding Status Badge / Banner */}
                                            {item.has_onboarding && (
                                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                                                    item.onboarding_submitted 
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                                        : "bg-amber-50 text-amber-800 border border-amber-100"
                                                }`}>
                                                    <span>{item.onboarding_submitted ? "🎯 Onboarding Complete" : "⚠️ Onboarding Required"}</span>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            {item.has_onboarding && !item.onboarding_submitted ? (
                                                <button
                                                    onClick={() => navigate(`/onboarding/${item.onboarding_assessment_id}`)}
                                                    className="w-full py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 shadow-sm transition-all text-center text-sm block"
                                                >
                                                    Start Onboarding Assessment
                                                </button>
                                            ) : (
                                                <Link
                                                    to={`/courses/${item.course_id}`}
                                                    className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-all text-center text-sm block"
                                                >
                                                    Continue Learning
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default LearnerDashboard;
