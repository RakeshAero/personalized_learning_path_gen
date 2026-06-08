import { useEffect, useState } from "react";
import API from "../api/axios";
import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";

function CourseList() {
    const [course, setCourse] = useState(null);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [marking, setMarking] = useState(null);

    const { id } = useParams();

    useEffect(() => {
        fetchCourse();
        fetchProgress();
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
        return <div className="p-10">Loading...</div>;
    }

    const totalModules = course.modules.length;
    const completedCount = course.modules.filter(m => completedIds.has(m.id)).length;
    const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return (
        <>
            <Navbar />

            <div className="p-8 max-w-3xl mx-auto">

                <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                <p className="text-gray-600 mb-6">{course.description}</p>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm font-medium mb-1">
                        <span>Your Progress</span>
                        <span>{completedCount} / {totalModules} modules — {progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-black h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Modules List */}
                <h3 className="text-xl font-bold mb-4">Modules</h3>

                {totalModules === 0 ? (
                    <p className="text-gray-500">No modules available yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {course.modules.map((module) => {
                            const isDone = completedIds.has(module.id);
                            const isMarking = marking === module.id;

                            return (
                                <div
                                    key={module.id}
                                    className={`border p-4 rounded flex items-start justify-between gap-4 ${isDone ? 'bg-gray-50 border-gray-300' : 'bg-white'}`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isDone && (
                                                <span className="text-green-600 font-bold text-lg">✓</span>
                                            )}
                                            <h3 className={`text-lg font-bold ${isDone ? 'text-gray-400 line-through' : ''}`}>
                                                {module.title}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-2">{module.description}</p>
                                        <div className="flex gap-3 text-xs text-gray-500">
                                            {module.difficulty && (
                                                <span className="border px-2 py-0.5 rounded capitalize">
                                                    {module.difficulty}
                                                </span>
                                            )}
                                            {module.estimated_duration && (
                                                <span>{module.estimated_duration} min</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => markComplete(module.id)}
                                        disabled={isDone || isMarking}
                                        className={`text-sm px-3 py-1.5 rounded whitespace-nowrap ${
                                            isDone
                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                : 'bg-black text-white hover:bg-gray-800'
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
