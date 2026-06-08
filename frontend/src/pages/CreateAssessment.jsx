import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import API from "../api/axios";

function CreateAssessment() {
    const [modules, setModules] = useState([]);
    const [moduleId, setModuleId] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const response = await API.get('modules/');
            setModules(response.data);
        } catch {
            alert('Failed to load modules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!moduleId || !title.trim()) {
            alert('Please select a module and enter a title');
            return;
        }
        try {
            await API.post('assessments/', { module: moduleId, title });
            alert('Assessment Created');
            setModuleId('');
            setTitle('');
        } catch {
            alert('Error creating assessment');
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-xl mx-auto mt-10 border p-6 rounded">
                <h1 className="text-2xl font-bold mb-5">Create Assessment</h1>

                {loading ? (
                    <p>Loading modules...</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-medium mb-1">Module</label>
                        <select
                            className="border p-2 w-full mb-4 rounded"
                            value={moduleId}
                            onChange={(e) => setModuleId(e.target.value)}
                        >
                            <option value="">-- Select a Module --</option>
                            {modules.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.title}
                                </option>
                            ))}
                        </select>

                        <label className="block text-sm font-medium mb-1">Assessment Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Python Basics Onboarding Quiz"
                            className="border p-2 w-full mb-4"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <button className="bg-black text-white px-4 py-2 rounded w-full">
                            Create Assessment
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}

export default CreateAssessment;
