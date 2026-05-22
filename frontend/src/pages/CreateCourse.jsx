import { useState } from 'react';
import API from '../api/axios';
import Navbar from '../components/navbar';

function CreateCourse(){
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await API.post('courses/', {
                title,
                description
            });

            console.log(response.status);
            alert("Course Created");

            setTitle("");
            setDescription("");
        }
        catch(error){
            console.log(error);
            alert("Error Creating Courses");
        }
        
    }

    return (
        <>
            <Navbar />

            <div className="max-w-xl mx-auto mt-10 border p-6 rounded">

                <h1 className="text-2xl font-bold mb-5">
                    Create Course
                </h1>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        placeholder="Course Title"
                        className="border p-2 w-full mb-4"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <textarea
                        placeholder="Course Description"
                        className="border p-2 w-full mb-4"
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <button
                        className="bg-black text-white px-4 py-2 rounded w-full"
                    >
                        Create Course
                    </button>

                </form>

            </div>
        </>
    );
}

export default CreateCourse;