import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import API from "../api/axios";
import Input from "../components/Input";

function CreateModule() {
    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [order, setOrder] = useState('');
    const [loadingCourses, setLoadingCourses] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await API.get('courses/');
            setCourses(response.data);
        } catch {
            alert('Failed to load courses');
        } finally {
            setLoadingCourses(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!courseId) {
            alert('Please select a course');
            return;
        }
        if (!title.trim()) {
            alert('Title is required');
            return;
        }
        try {
            await API.post('modules/', {
                course: courseId,
                title,
                description,
                content,
                difficulty,
                estimated_duration: estimatedDuration,
                order,
            });
            alert('Module Created');
            setCourseId('');
            setTitle('');
            setDescription('');
            setContent('');
            setDifficulty('easy');
            setEstimatedDuration('');
            setOrder('');
        } catch (error) {
            console.log(error);
            alert('Error Creating Module');
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-xl mx-auto mt-10 border p-6 rounded">
                <h1 className="text-2xl font-bold mb-5">Create Module</h1>

                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium mb-1">Course</label>
                    {loadingCourses ? (
                        <p className="text-sm text-gray-500 mb-4">Loading courses...</p>
                    ) : (
                        <select
                            className="border p-2 w-full mb-4 rounded"
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                        >
                            <option value="">-- Select a Course --</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    )}

                    {Input({ type: "text", placeholder: "Module Title", value: title, onChange: (e) => setTitle(e.target.value) })}
                    {Input({ type: "text", placeholder: "Module Description", value: description, onChange: (e) => setDescription(e.target.value) })}

                    <textarea
                        placeholder="Module Content"
                        className="border p-2 w-full mb-4 rounded"
                        rows="5"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                    <select
                        className="border p-2 w-full mb-4 rounded"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>

                    {Input({ type: "number", placeholder: "Estimated Duration (minutes)", value: estimatedDuration, onChange: (e) => setEstimatedDuration(e.target.value) })}
                    {Input({ type: "number", placeholder: "Order (e.g. 1, 2, 3...)", value: order, onChange: (e) => setOrder(e.target.value) })}

                    <button className="bg-black text-white px-4 py-2 rounded w-full">
                        Create Module
                    </button>
                </form>
            </div>
        </>
    );
}

export default CreateModule;
