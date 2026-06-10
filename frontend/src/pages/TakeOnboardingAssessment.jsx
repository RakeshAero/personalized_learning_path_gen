import { useEffect, useState } from "react";
import API from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function TakeOnboardingAssessment() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAssessment();
    }, [id]);

    const fetchAssessment = async () => {
        try {
            const response = await API.get(`assessments/${id}/`);
            setAssessment(response.data);
        } catch (error) {
            console.error("Failed to fetch assessment", error);
            alert("Failed to load onboarding assessment.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, optionText) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionText,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check that all questions have answers
        const questions = assessment?.questions || [];
        if (questions.length === 0) return;

        const unanswered = questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            alert(`Please answer all questions before submitting. (${questions.length - unanswered.length}/${questions.length} answered)`);
            return;
        }

        setSubmitting(true);
        try {
            await API.post(`assessments/${id}/submit/`, {
                answers: answers
            });
            navigate(`/skill-result/${id}`);
        } catch (error) {
            console.error("Failed to submit assessment", error);
            alert(error.response?.data?.error || "Error submitting assessment. You may have already submitted this assessment.");
        } finally {
            setSubmitting(false);
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

    if (!assessment || !assessment.questions || assessment.questions.length === 0) {
        return (
            <>
                <Navbar />
                <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border border-gray-100 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Questions Found</h2>
                    <p className="text-gray-600">This assessment has no questions configured yet.</p>
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

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider mb-2">
                        <span>🎯 Onboarding Gate</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        {assessment.title}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        Course: <span className="font-semibold text-gray-800">{assessment.course_title || "My Course"}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {assessment.questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
                        >
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <h5 className="text-lg font-bold text-gray-800">
                                    Q{index + 1}. {question.question_text}
                                </h5>
                                {question.skill_tag && (
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                                        🏷️ {question.skill_tag}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {[
                                    question.option_1,
                                    question.option_2,
                                    question.option_3,
                                    question.option_4,
                                ].map((option, idx) => (
                                    <label
                                        key={idx}
                                        className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${
                                            answers[question.id] === option
                                                ? "bg-indigo-50 border-indigo-300"
                                                : "bg-white border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={option}
                                            checked={
                                                answers[question.id] === option
                                            }
                                            onChange={() =>
                                                handleAnswerChange(
                                                    question.id,
                                                    option
                                                )
                                            }
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                        />

                                        <span className="text-gray-850 font-medium">
                                            {option}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl shadow-lg transition-all hover:shadow-xl disabled:bg-indigo-300"
                        >
                            {submitting ? "Submitting..." : "Submit Assessment"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default TakeOnboardingAssessment;