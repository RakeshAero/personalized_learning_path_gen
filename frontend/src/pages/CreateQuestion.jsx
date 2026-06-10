import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import API from "../api/axios";

function CreateQuestion() {
    const [assessments, setAssessments] = useState([]);
    const [assessmentId, setAssessmentId] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [option3, setOption3] = useState('');
    const [option4, setOption4] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [skillTag, setSkillTag] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const response = await API.get('assessments/');
            setAssessments(response.data);
        } catch {
            alert('Failed to load assessments');
        } finally {
            setLoading(false);
        }
    };

    const filledOptions = [option1, option2, option3, option4].filter(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!assessmentId || !questionText.trim() || !option1 || !option2 || !option3 || !option4 || !correctAnswer) {
            alert('Please fill in all fields and select the correct answer');
            return;
        }
        try {
            await API.post('questions/', {
                assessment: assessmentId,
                question_text: questionText,
                option_1: option1,
                option_2: option2,
                option_3: option3,
                option_4: option4,
                correct_answer: correctAnswer,
                difficulty,
                skill_tag: skillTag,
            });
            alert('Question Created');
            setAssessmentId('');
            setQuestionText('');
            setOption1('');
            setOption2('');
            setOption3('');
            setOption4('');
            setCorrectAnswer('');
            setDifficulty('easy');
            setSkillTag('');
        } catch {
            alert('Error creating question');
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-xl mx-auto mt-10 border p-6 rounded shadow bg-white">
                <h1 className="text-2xl font-bold mb-5">Create Question</h1>

                {loading ? (
                    <p>Loading assessments...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Assessment</label>
                            <select
                                className="border p-2 w-full rounded"
                                value={assessmentId}
                                onChange={(e) => setAssessmentId(e.target.value)}
                            >
                                <option value="">-- Select an Assessment --</option>
                                {assessments.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Question</label>
                            <textarea
                                placeholder="Enter your question..."
                                className="border p-2 w-full rounded"
                                rows="3"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Options</label>
                            <div className="space-y-2">
                                {[
                                    ['Option A', option1, setOption1],
                                    ['Option B', option2, setOption2],
                                    ['Option C', option3, setOption3],
                                    ['Option D', option4, setOption4],
                                ].map(([label, value, setter]) => (
                                    <input
                                        key={label}
                                        type="text"
                                        placeholder={label}
                                        className="border p-2 w-full rounded"
                                        value={value}
                                        onChange={(e) => {
                                            setter(e.target.value);
                                            if (correctAnswer === value) setCorrectAnswer('');
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Correct Answer</label>
                            <select
                                className="border p-2 w-full rounded"
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                            >
                                <option value="">-- Select Correct Answer --</option>
                                {filledOptions.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Difficulty</label>
                                <select
                                    className="border p-2 w-full rounded"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Skill Tag (e.g. Arrays, Recursion)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Arrays"
                                    className="border p-2 w-full rounded"
                                    value={skillTag}
                                    onChange={(e) => setSkillTag(e.target.value)}
                                />
                            </div>
                        </div>

                        <button className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition">
                            Create Question
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}

export default CreateQuestion;
