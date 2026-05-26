import { useEffect, useState } from "react";
import API from "../api/axios";
import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";

function Questions() {
    const [questions, setQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const { id } = useParams();

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await API.get(`assessments/${id}/`);
            setQuestions(response.data.questions);
        } catch (error) {
            console.log(error);
            alert("Failed to load questions");
        }
    };

    // Handle answer selection
    const handleAnswerSelect = (questionId, answer) => {
        if (submitted) return;

        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    // Submit assessment
    const handleSubmit = () => {
        // Check if all questions answered
        if (Object.keys(selectedAnswers).length !== questions.length) {
            alert("Please answer all questions");
            return;
        }

        let totalScore = 0;

        questions.forEach((question) => {
            if (
                selectedAnswers[question.id] === question.correct_answer
            ) {
                totalScore++;
            }
        });

        setScore(totalScore);
        setSubmitted(true);
    };

    // Button color logic
    const getButtonClass = (question, option) => {
        const selected = selectedAnswers[question.id];

        // Before submit
        if (!submitted) {
            return selected === option
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white hover:bg-gray-100";
        }

        // After submit
        if (option === question.correct_answer) {
            return "bg-green-500 text-white border-green-500";
        }

        if (
            selected === option &&
            option !== question.correct_answer
        ) {
            return "bg-red-500 text-white border-red-500";
        }

        return "bg-white";
    };

    return (
        <>
            <Navbar />

            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">
                    MCQ Assessment
                </h1>

                {questions.map((question, index) => (
                    <div
                        key={question.id}
                        className="border p-5 rounded-lg mb-6 shadow-sm"
                    >
                        <h2 className="font-bold text-lg mb-4">
                            Q{index + 1}. {question.question_text}
                        </h2>

                        {[
                            question.option_1,
                            question.option_2,
                            question.option_3,
                            question.option_4,
                        ].map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() =>
                                    handleAnswerSelect(
                                        question.id,
                                        option
                                    )
                                }
                                className={`border p-3 rounded block w-full text-left mb-3 transition duration-200 ${getButtonClass(
                                    question,
                                    option
                                )}`}
                            >
                                {option}
                            </button>
                        ))}

                        {/* Correct Answer Text */}
                        {submitted && (
                            <div className="mt-3">
                                <p className="font-semibold">
                                    Correct Answer:
                                    <span className="text-green-600 ml-2">
                                        {question.correct_answer}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                ))}

                {/* Submit Button */}
                {!submitted && (
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                        Submit Assessment
                    </button>
                )}

                {/* Score */}
                {submitted && (
                    <div className="mt-6 border rounded-lg p-5 bg-gray-100">
                        <h2 className="text-2xl font-bold mb-2">
                            Assessment Completed 🎉
                        </h2>

                        <p className="text-xl">
                            Your Score:{" "}
                            <span className="font-bold text-blue-600">
                                {score} / {questions.length}
                            </span>
                        </p>

                        <p className="mt-2">
                            Percentage:{" "}
                            <span className="font-semibold">
                                {(
                                    (score / questions.length) *
                                    100
                                ).toFixed(0)}
                                %
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

export default Questions;