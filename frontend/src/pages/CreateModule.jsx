import { useState } from "react";
import Navbar from "../components/navbar";
import API from "../api/axios";
import Input from "../components/Input";

function CreateModule(){

    const [courseId, setCourseId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [order, setOrder] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("Title required");
            return;
        }

        try{
            const response = await API.post('modules/', {
                course: courseId,
                title,
                description,
                content,
                difficulty,
                estimated_duration: estimatedDuration,
                order
            });

            alert("Module Created");

            setCourseId("");
            setTitle("");
            setDescription("");
            setContent("");
            setDifficulty("easy");
            setEstimatedDuration("");
            setOrder("");
        }
        catch(error){
            console.log(error);
            alert("Error Creating Module");
        }
    }

    return (
        <>
            <Navbar />
            <div className="max-w-xl mx-auto mt-10 border p-6 rounded">

                <h1 className="text-2xl font-bold mb-5">
                    Create Module
                </h1>   
                <form onSubmit={handleSubmit}>

                    <input
                        type="number"
                        placeholder="Course ID"
                        className="border p-2 w-full mb-4"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                    />

                    {/* Reusable Input Component */}
                    {Input({"type": "text", "placeholder": "Module Title", "value": title, "onChange": (e) => setTitle(e.target.value)})}
                    {Input({"type": "text", "placeholder": "Module Description", "value": description, "onChange": (e) => setDescription(e.target.value)})}

                    <textarea
                        placeholder="Module Content"
                        className="border p-2 w-full mb-4 rounded"
                        rows="5"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <select
                        className="border p-2 w-full mb-4 rounded"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>

                    {/* Reusable Input Component */}
                    {Input({"type": "number", "placeholder": "Estimated Duration", "value": estimatedDuration, "onChange": (e) => setEstimatedDuration(e.target.value)})}
                    {Input({"type": "number", "placeholder": "Order", "value": order, "onChange": (e) => setOrder(e.target.value)})}


                    <button
                        className="bg-black text-white px-4 py-2 rounded w-full"
                    >
                        Create Module
                    </button>
                </form>
            </div>
        </>
    );

}

export default CreateModule;