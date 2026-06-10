import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";
import { AuthContext } from "../context/AuthContext";

function Courses() {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingMap, setEnrollingMap] = useState({});
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, enrollmentsRes] = await Promise.all([
                API.get("courses/"),
                API.get("enrollments/").catch(() => ({ data: [] })) // fallback for non-learners
            ]);
            setCourses(coursesRes.data);
            setEnrollments(enrollmentsRes.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (e, courseId) => {
        e.preventDefault();
        e.stopPropagation();
        setEnrollingMap(prev => ({ ...prev, [courseId]: true }));
        try {
            const response = await API.post(`courses/${courseId}/enroll/`);
            const data = response.data;
            if (data.onboarding_assessment_id) {
                navigate(`/onboarding/${data.onboarding_assessment_id}`);
            } else {
                navigate(`/courses/${courseId}`);
            }
        } catch (error) {
            console.error("Failed to enroll", error);
            alert("Failed to enroll in the course.");
        } finally {
            setEnrollingMap(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const isEnrolled = (courseId) => {
        return enrollments.some(e => e.course_id === courseId);
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
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Courses</h1>
                            <p className="text-gray-500 mt-1">Browse available subjects and start learning.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {courses.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 col-span-2">
                                No courses available yet.
                            </div>
                        ) : (
                            courses.map((course) => {
                                const enrolled = isEnrolled(course.id);
                                const isInstructor = user?.role === 'instructor';

                                return (
                                    <div
                                        key={course.id}
                                        onClick={() => enrolled || isInstructor ? navigate(`/courses/${course.id}`) : null}
                                        className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                                            enrolled || isInstructor ? "cursor-pointer hover:shadow-md hover:border-indigo-200" : ""
                                        }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                                                    {course.title}
                                                </h2>
                                                {enrolled && (
                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2.5 py-1 rounded-full font-bold">
                                                        ✓ Enrolled
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                                                {course.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            {isInstructor ? (
                                                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                                    Instructor Access
                                                </span>
                                            ) : enrolled ? (
                                                <button
                                                    onClick={() => navigate(`/courses/${course.id}`)}
                                                    className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-all"
                                                >
                                                    Go to Course →
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleEnroll(e, course.id)}
                                                    disabled={enrollingMap[course.id]}
                                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all"
                                                >
                                                    {enrollingMap[course.id] ? "Enrolling..." : "Enroll Now"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Courses;