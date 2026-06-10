import { useEffect, useState } from "react";
import API from "../api/axios";
import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";

function CourseList() {
    const [course, setCourse] = useState(null);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [marking, setMarking] = useState(null);
    const [pathData, setPathData] = useState(null);

    const { id } = useParams();

    useEffect(() => {
        fetchCourse();
        fetchProgress();
        fetchPersonalizedPath();
    }, []);

    const fetchCourse = async () => {
        try {
            const response = await API.get(`courses/${id}/`);
            setCourse(response.data);
        } catch (error) {
            alert('Failed to load course');
        }
    };

    const fetchProgress = async () => {
        try {
            const response = await API.get(`progress/course/?course_id=${id}`);
            const done = new Set(
                response.data
                    .filter(p => p.completed)
                    .map(p => p.module)
            );
            setCompletedIds(done);
        } catch {
            // No progress yet — start with empty set
        }
    };

    const fetchPersonalizedPath = async () => {
        try {
            const response = await API.get(`my-path/?course_id=${id}`);
            if (response.data.has_path) {
                setPathData(response.data.path_data);
            }
        } catch (err) {
            console.error("Failed to load personalized path", err);
        }
    };

    const markComplete = async (moduleId) => {
        setMarking(moduleId);
        try {
            await API.post('progress/complete/', { module_id: moduleId });
            setCompletedIds(prev => new Set([...prev, moduleId]));
        } catch (error) {
            alert('Failed to mark module complete');
        } finally {
            setMarking(null);
        }
    };

    if (!course) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center h-screen bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </>
        );
    }

    // Sort modules based on personalized path order if available
    let orderedModules = [...course.modules];
    if (pathData && pathData.length > 0) {
        const orderMap = {};
        pathData.forEach((item, index) => {
            orderMap[item.module_id] = index;
        });
        orderedModules.sort((a, b) => {
            const indexA = orderMap[a.id] !== undefined ? orderMap[a.id] : 9999;
            const indexB = orderMap[b.id] !== undefined ? orderMap[b.id] : 9999;
            return indexA - indexB;
        });
    }

    const totalModules = orderedModules.length;
    const completedCount = orderedModules.filter(m => completedIds.has(m.id)).length;
    const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return (
        <>
            <Navbar />

            <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{course.title}</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">{course.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-2">
                        <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                            <span>Your Progress</span>
                            <span>{completedCount} / {totalModules} modules — {progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {pathData && (
                    <div className="mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <span>✨ AI Personalized Path Active</span>
                        </h4>
                        <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                            Based on your onboarding assessment, the syllabus order and module recommendations have been customized to fit your experience.
                        </p>
                    </div>
                )}

                {/* Modules List */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">Modules</h3>

                {totalModules === 0 ? (
                    <p className="text-gray-500">No modules available yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {orderedModules.map((module, index) => {
                            const isDone = completedIds.has(module.id);
                            const isMarking = marking === module.id;
                            const pathItem = pathData?.find(item => item.module_id === module.id);
                            const shouldSkip = pathItem?.skip;
                            const aiReason = pathItem?.reason;

                            return (
                                <div
                                    key={module.id}
                                    className={`border rounded-2xl p-6 flex items-start justify-between gap-6 transition-all duration-200 ${
                                        isDone 
                                            ? 'bg-gray-50/70 border-gray-200 opacity-75' 
                                            : shouldSkip 
                                                ? 'bg-amber-50/30 border-amber-200' 
                                                : 'bg-white border-gray-200 shadow-sm hover:shadow'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2 py-0.5 rounded font-bold">
                                                Step {index + 1}
                                            </span>
                                            {isDone && (
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2 py-0.5 rounded font-bold">
                                                    ✓ Completed
                                                </span>
                                            )}
                                            {shouldSkip && !isDone && (
                                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                                    ⚡ Optional (Can Skip)
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`text-lg font-bold text-gray-900 mb-1 ${isDone ? 'line-through text-gray-400' : ''}`}>
                                            {module.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                                        
                                        {aiReason && (
                                            <div className="text-xs bg-gray-50 border border-gray-150 rounded-xl p-3 mb-4 text-gray-700">
                                                <span className="font-semibold text-gray-800">AI Recommendation:</span> {aiReason}
                                            </div>
                                        )}

                                        <div className="flex gap-3 text-xs text-gray-500">
                                            {module.difficulty && (
                                                <span className="border px-2 py-0.5 rounded capitalize bg-white">
                                                    {module.difficulty}
                                                </span>
                                            )}
                                            {module.estimated_duration && (
                                                <span className="flex items-center">
                                                    🕒 {module.estimated_duration} min
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => markComplete(module.id)}
                                        disabled={isDone || isMarking}
                                        className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all ${
                                            isDone
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                        }`}
                                    >
                                        {isMarking ? '...' : isDone ? 'Completed' : 'Mark Complete'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

export default CourseList;
