import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";

const DIFFICULTIES = ["easy", "medium", "hard"];

function GenerateCurriculum() {
    const { id: courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [step, setStep] = useState("form"); // form | generating | preview | saving | done
    const [error, setError] = useState("");

    // Form inputs
    const [numModules, setNumModules] = useState(4);
    const [targetAudience, setTargetAudience] = useState("");

    // AI-generated preview (editable)
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        API.get(`courses/${courseId}/`).then(r => setCourse(r.data)).catch(() => setError("Course not found."));
    }, [courseId]);

    // ── Generate ────────────────────────────────────────────────────────────
    const handleGenerate = async (e) => {
        e.preventDefault();
        setError("");
        setStep("generating");
        try {
            const res = await API.post(`courses/${courseId}/generate_curriculum/`, {
                num_modules: numModules,
                target_audience: targetAudience || "general learners",
            });
            setPreview(res.data);
            setStep("preview");
        } catch (err) {
            setError(err.response?.data?.error || "AI generation failed. Please try again.");
            setStep("form");
        }
    };

    // ── Inline editing helpers ───────────────────────────────────────────────
    const updateModule = (idx, field, value) => {
        setPreview(prev => {
            const modules = [...prev.modules];
            modules[idx] = { ...modules[idx], [field]: value };
            return { ...prev, modules };
        });
    };

    const updateSubtopic = (modIdx, stIdx, value) => {
        setPreview(prev => {
            const modules = [...prev.modules];
            const subtopics = [...modules[modIdx].subtopics];
            subtopics[stIdx] = { ...subtopics[stIdx], title: value };
            modules[modIdx] = { ...modules[modIdx], subtopics };
            return { ...prev, modules };
        });
    };

    const removeModule = (idx) => {
        setPreview(prev => ({
            ...prev,
            modules: prev.modules.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })),
        }));
    };

    const updateQuestion = (idx, field, value) => {
        setPreview(prev => {
            const questions = [...prev.onboarding_assessment.questions];
            questions[idx] = { ...questions[idx], [field]: value };
            return { ...prev, onboarding_assessment: { ...prev.onboarding_assessment, questions } };
        });
    };

    const removeQuestion = (idx) => {
        setPreview(prev => ({
            ...prev,
            onboarding_assessment: {
                ...prev.onboarding_assessment,
                questions: prev.onboarding_assessment.questions.filter((_, i) => i !== idx),
            },
        }));
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setStep("saving");
        setError("");
        try {
            await API.post(`courses/${courseId}/save-curriculum/`, preview);
            setStep("done");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to save. Please try again.");
            setStep("preview");
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
                            ← Back
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">AI Curriculum Generator</h1>
                        {course && <p className="text-gray-500 mt-1">Course: <span className="font-semibold text-gray-700">{course.title}</span></p>}
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* ── STEP: Form ── */}
                    {step === "form" && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Configure Generation</h2>
                            <form onSubmit={handleGenerate} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Number of Modules <span className="font-normal text-gray-400">(1–10)</span>
                                    </label>
                                    <input
                                        type="number" min="1" max="10" value={numModules}
                                        onChange={e => setNumModules(Number(e.target.value))}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Target Audience</label>
                                    <input
                                        type="text" value={targetAudience}
                                        onChange={e => setTargetAudience(e.target.value)}
                                        placeholder="e.g. beginner Python developers, CS students"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <button type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow transition-all">
                                    Generate with AI
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ── STEP: Generating ── */}
                    {step === "generating" && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-indigo-500 mx-auto mb-6"></div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Generating Curriculum…</h2>
                            <p className="text-gray-500 text-sm">Gemini is designing your modules, subtopics, and assessment questions. This takes 10–20 seconds.</p>
                        </div>
                    )}

                    {/* ── STEP: Preview ── */}
                    {step === "preview" && preview && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">Review and edit below, then click <strong>Save Curriculum</strong>.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep("form")}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">
                                        Regenerate
                                    </button>
                                    <button onClick={handleSave}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow text-sm transition-all">
                                        Save Curriculum
                                    </button>
                                </div>
                            </div>

                            {/* Modules */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-4">
                                    Modules <span className="text-gray-400 font-normal text-sm">({preview.modules.length})</span>
                                </h2>
                                <div className="space-y-4">
                                    {preview.modules.map((mod, mi) => (
                                        <div key={mi} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                            <div className="flex gap-3 mb-3">
                                                <span className="text-xs font-bold text-gray-400 mt-2.5 w-6 text-center">{mi + 1}</span>
                                                <div className="flex-1 space-y-3">
                                                    <input value={mod.title}
                                                        onChange={e => updateModule(mi, 'title', e.target.value)}
                                                        className="w-full font-bold text-gray-800 text-base border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-1 bg-transparent"
                                                    />
                                                    <textarea value={mod.description} rows={2}
                                                        onChange={e => updateModule(mi, 'description', e.target.value)}
                                                        className="w-full text-sm text-gray-600 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
                                                    />
                                                    <div className="flex flex-wrap gap-3 items-center">
                                                        <select value={mod.difficulty}
                                                            onChange={e => updateModule(mi, 'difficulty', e.target.value)}
                                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                                                            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                                                        </select>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <input type="number" min="1" value={mod.estimated_duration}
                                                                onChange={e => updateModule(mi, 'estimated_duration', Number(e.target.value))}
                                                                className="w-14 border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
                                                            /> min
                                                        </span>
                                                        <button onClick={() => removeModule(mi)}
                                                            className="ml-auto text-xs text-red-400 hover:text-red-600">Remove</button>
                                                    </div>

                                                    {/* Subtopics */}
                                                    <div className="mt-2 pl-2 border-l-2 border-indigo-100 space-y-1.5">
                                                        <p className="text-xs font-semibold text-gray-400 mb-1">Subtopics</p>
                                                        {(mod.subtopics || []).map((st, si) => (
                                                            <input key={si} value={st.title}
                                                                onChange={e => updateSubtopic(mi, si, e.target.value)}
                                                                className="w-full text-xs text-gray-600 border border-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Assessment */}
                            {preview.onboarding_assessment && (
                                <section>
                                    <h2 className="text-lg font-bold text-gray-800 mb-1">
                                        Onboarding Assessment
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {preview.onboarding_assessment.title} — {preview.onboarding_assessment.questions?.length} questions
                                    </p>
                                    <div className="space-y-4">
                                        {preview.onboarding_assessment.questions.map((q, qi) => (
                                            <div key={qi} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                                <div className="flex gap-2 mb-3 items-start">
                                                    <span className="text-xs font-bold text-gray-400 mt-1 w-5">Q{qi + 1}</span>
                                                    <div className="flex-1 space-y-2">
                                                        <input value={q.question_text}
                                                            onChange={e => updateQuestion(qi, 'question_text', e.target.value)}
                                                            className="w-full font-semibold text-gray-800 text-sm border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-1 bg-transparent"
                                                        />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {["option_1","option_2","option_3","option_4"].map(opt => (
                                                                <div key={opt} className="relative">
                                                                    <input value={q[opt]}
                                                                        onChange={e => updateQuestion(qi, opt, e.target.value)}
                                                                        className={`w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 ${q.correct_answer === q[opt] ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold' : 'border-gray-100'}`}
                                                                    />
                                                                    {q.correct_answer === q[opt] && (
                                                                        <span className="absolute right-1.5 top-1.5 text-emerald-500 text-xs">✓</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 items-center">
                                                            <span>Correct:
                                                                <select value={q.correct_answer}
                                                                    onChange={e => updateQuestion(qi, 'correct_answer', e.target.value)}
                                                                    className="ml-1 border border-gray-200 rounded px-1 py-0.5 focus:outline-none max-w-[120px] truncate">
                                                                    {["option_1","option_2","option_3","option_4"].map(opt => (
                                                                        <option key={opt} value={q[opt]}>{q[opt]}</option>
                                                                    ))}
                                                                </select>
                                                            </span>
                                                            <span className="flex items-center gap-1">Skill:
                                                                <input value={q.skill_tag}
                                                                    onChange={e => updateQuestion(qi, 'skill_tag', e.target.value)}
                                                                    className="ml-1 border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none w-24"
                                                                />
                                                            </span>
                                                            <select value={q.difficulty}
                                                                onChange={e => updateQuestion(qi, 'difficulty', e.target.value)}
                                                                className="border border-gray-200 rounded px-1 py-0.5 focus:outline-none">
                                                                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                                                            </select>
                                                            <button onClick={() => removeQuestion(qi)}
                                                                className="ml-auto text-red-400 hover:text-red-600">Remove</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <div className="flex justify-end pb-10">
                                <button onClick={handleSave}
                                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow text-sm transition-all">
                                    Save Curriculum to Course
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP: Saving ── */}
                    {step === "saving" && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-5"></div>
                            <h2 className="text-lg font-bold text-gray-800">Saving…</h2>
                        </div>
                    )}

                    {/* ── STEP: Done ── */}
                    {step === "done" && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                            <div className="text-5xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Curriculum Saved!</h2>
                            <p className="text-gray-500 mb-8 text-sm">Modules, subtopics, and the onboarding assessment have been added to the course.</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => navigate(`/courses/${courseId}`)}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow text-sm transition-all">
                                    View Course
                                </button>
                                <button onClick={() => { setStep("form"); setPreview(null); }}
                                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">
                                    Generate More
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default GenerateCurriculum;
