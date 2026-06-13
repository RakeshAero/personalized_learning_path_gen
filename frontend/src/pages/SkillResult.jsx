import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";

function SkillResult() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [courseInfo, setCourseInfo] = useState(null);

    useEffect(() => {
        fetchResult();
    }, [assessmentId]);

    const fetchResult = async () => {
        try {
            const response = await API.get(`assessments/${assessmentId}/my-submission/`);
            if (response.data.submitted) {
                setSubmission(response.data);
                
                // Fetch assessment detail to resolve the course.
                // Onboarding assessments link directly to a course; module-level
                // assessments resolve their course via the module.
                const assessResponse = await API.get(`assessments/${response.data.assessment}/`);
                const data = assessResponse.data;
                const resolvedCourseId = data.course || data.module?.course || null;
                setCourseInfo({
                    courseTitle: data.course_title || data.module_title || "Course",
                    courseActualId: resolvedCourseId,
                });
            } else {
                setSubmission(null);
            }
        } catch (error) {
            console.error("Failed to load submission result", error);
        } finally {
            setLoading(false);
        }
    };

    const getIndicator = (score) => {
        if (score >= 70) return { emoji: "✅", label: "Proficient", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
        if (score >= 40) return { emoji: "⚡", label: "Developing", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
        return { emoji: "⚠️", label: "Needs Practice", color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" };
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

    if (!submission) {
        return (
            <>
                <Navbar />
                <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border border-gray-100 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No submission found</h2>
                    <p className="text-gray-600">You haven't completed this assessment yet.</p>
                    <button
                        onClick={() => navigate("/learner-dashboard")}
                        className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 text-white text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                                <span className="text-3xl">🎯</span>
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Onboarding Assessment Results</h1>
                            <p className="text-indigo-100 mt-2">
                                We've analyzed your skillset for <span className="font-semibold underline">{courseInfo?.courseTitle || "your course"}</span>.
                            </p>
                        </div>

                        {/* Summary Score Card */}
                        <div className="p-8 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-2xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Overall Accuracy Score</h2>
                                    <p className="text-sm text-gray-500 mt-1">Based on correct answers vs. total questions.</p>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-5xl font-extrabold text-indigo-600">{submission.score}</span>
                                    <span className="text-2xl text-gray-400 font-medium"> points</span>
                                </div>
                            </div>
                        </div>

                        {/* Skill Domains Breakdown */}
                        <div className="p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                📊 Domain Breakdown
                            </h2>

                            {!submission.skill_scores || Object.keys(submission.skill_scores).length === 0 ? (
                                <p className="text-gray-500 italic">No per-skill tagging available for this assessment.</p>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(submission.skill_scores).map(([domain, score]) => {
                                        const indicator = getIndicator(score);
                                        return (
                                            <div key={domain} className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-gray-800">{domain}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${indicator.bg} ${indicator.text}`}>
                                                            {indicator.emoji} {indicator.label}
                                                        </span>
                                                        <span className="font-semibold text-gray-700">{score}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className={`h-3 rounded-full transition-all duration-1000 ${indicator.color}`}
                                                        style={{ width: `${score}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Tip Banner */}
                            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <span className="text-xl">💡</span>
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-900">How we personalize your path:</h4>
                                    <p className="text-xs text-blue-700 mt-0.5">
                                        Modules covering topics where you scored <span className="font-semibold">70% or higher</span> will be marked as optional, allowing you to skip them. Weak areas are moved to the front or given extra focus.
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        if (courseInfo?.courseActualId) {
                                            navigate(`/courses/${courseInfo.courseActualId}`);
                                        } else {
                                            navigate("/learner-dashboard");
                                        }
                                    }}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                                >
                                    Go to Personalized Path →
                                </button>
                                <button
                                    onClick={() => navigate("/learner-dashboard")}
                                    className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-all text-center"
                                >
                                    Dashboard
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

export default SkillResult;
