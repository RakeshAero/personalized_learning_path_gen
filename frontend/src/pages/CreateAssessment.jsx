import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import API from "../api/axios";

function CreateAssessment() {
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]);
    const [courseId, setCourseId] = useState('');
    const [moduleId, setModuleId] = useState('');
    const [title, setTitle] = useState('');
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [coursesRes, modulesRes] = await Promise.all([
                API.get('courses/'),
                API.get('modules/')
            ]);
            setCourses(coursesRes.data);
            setModules(modulesRes.data);
        } catch {
            alert('Failed to load courses or modules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }
        if (!courseId && !moduleId) {
            alert('Please select either a course or a module');
            return;
        }
        try {
            await API.post('assessments/', {
                course: courseId || null,
                module: moduleId || null,
                title,
                is_onboarding: isOnboarding
            });
            alert('Assessment Created');
            setCourseId('');
            setModuleId('');
            setTitle('');
            setIsOnboarding(false);
        } catch (err) {
            console.error(err);
            alert('Error creating assessment');
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-xl mx-auto mt-10 border p-6 rounded shadow bg-white">
                <h1 className="text-2xl font-bold mb-5">Create Assessment</h1>

                {loading ? (
                    <p>Loading data...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Course (Recommended for Onboarding)</label>
                            <select
                                className="border p-2 w-full rounded"
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                            >
                                <option value="">-- Select a Course (Optional) --</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Module (Optional)</label>
                            <select
                                className="border p-2 w-full rounded"
                                value={moduleId}
                                onChange={(e) => setModuleId(e.target.value)}
                            >
                                <option value="">-- Select a Module (Optional) --</option>
                                {modules.filter(m => !courseId || m.course === parseInt(courseId)).map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Assessment Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Python Basics Onboarding Quiz"
                                className="border p-2 w-full rounded"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="is_onboarding"
                                checked={isOnboarding}
                                onChange={(e) => setIsOnboarding(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                            />
                            <label htmlFor="is_onboarding" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Mark as Onboarding Assessment
                            </label>
                        </div>

                        <button className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition">
                            Create Assessment
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}

export default CreateAssessment;
