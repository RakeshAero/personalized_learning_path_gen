import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/navbar";
import { AuthContext } from "../context/AuthContext";

function CourseList() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);

    // Core States
    const [course, setCourse] = useState(null);
    const [pathData, setPathData] = useState(null);
    const [introContent, setIntroContent] = useState("");
    const [completedSubtopics, setCompletedSubtopics] = useState(new Set());
    const [loading, setLoading] = useState(true);

    // Selected Navigation state
    // selectedItem: { type: 'intro' } or { type: 'subtopic', id: number }
    const [selectedItem, setSelectedItem] = useState({ type: 'intro' });

    // Accordion sidebar expansion states
    const [expandedModules, setExpandedModules] = useState(new Set());

    // Instructor state
    const [newSubtopicTitleMap, setNewSubtopicTitleMap] = useState({});
    const [addingSubtopicModuleId, setAddingSubtopicModuleId] = useState(null);
    const [editingContent, setEditingContent] = useState([]); // list of {type: 'header'|'paragraph', value: ''}
    const [savingContent, setSavingContent] = useState(false);
    const [markingProgress, setMarkingProgress] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        setLoading(true);
        try {
            // Fetch Course, Personalized Path, Subtopic Progress, and Course Intro parallelly
            const [courseRes, pathRes, progressRes, introRes] = await Promise.all([
                API.get(`courses/${id}/`),
                API.get(`my-path/?course_id=${id}`).catch(() => ({ data: { has_path: false } })),
                API.get(`subtopic-progress/?course_id=${id}`).catch(() => ({ data: [] })),
                API.get(`courses/${id}/intro/`).catch(() => ({ data: { intro_content: "" } }))
            ]);

            setCourse(courseRes.data);
            console.log(course);
            if (pathRes.data?.has_path) {
                setPathData(pathRes.data.path_data);
            }
            const completedIds = new Set(
                (progressRes.data || [])
                    .filter(p => p.completed)
                    .map(p => p.subtopic_id)
            );
            setCompletedSubtopics(completedIds);
            setIntroContent(introRes.data?.intro_content || "");

            // Expand all modules by default
            if (courseRes.data?.modules) {
                setExpandedModules(new Set(courseRes.data.modules.map(m => m.id)));
            }

        } catch (error) {
            console.error("Failed to load course details", error);
            alert("Failed to load course details.");
        } finally {
            setLoading(false);
        }
    };

    // Sort modules based on personalized path order if available
    let orderedModules = [];
    if (course && course.modules) {
        orderedModules = [...course.modules];
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
    }

    // Build chronological flat list of learning objects
    // First item is intro, followed by all subtopics of modules in order
    const chronologicalItems = [{ type: 'intro' }];
    orderedModules.forEach(mod => {
        const sortedSubtopics = [...(mod.subtopics || [])].sort((a, b) => a.order - b.order);
        sortedSubtopics.forEach(sub => {
            chronologicalItems.push({
                type: 'subtopic',
                id: sub.id,
                subtopic: sub,
                module: mod
            });
        });
    });

    // Determine current index in chronological path
    const currentIndex = chronologicalItems.findIndex(item => {
        if (selectedItem.type === 'intro' && item.type === 'intro') return true;
        if (selectedItem.type === 'subtopic' && item.type === 'subtopic' && item.id === selectedItem.id) return true;
        return false;
    });

    const activeItem = chronologicalItems[currentIndex] || { type: 'intro' };

    // Set editing content state when subtopic changes
    useEffect(() => {
        if (selectedItem.type === 'subtopic' && activeItem.subtopic) {
            setEditingContent(activeItem.subtopic.content || []);
        } else {
            setEditingContent([]);
        }
    }, [selectedItem, currentIndex]);

    const handleRegeneratePath = async () => {
        setRegenerating(true);
        try {
            const res = await API.post(`courses/${id}/regenerate-path/`);
            setPathData(res.data.path_data);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to regenerate path.');
        } finally {
            setRegenerating(false);
        }
    };

    // Handle Module Accordion Toggling
    const toggleModule = (modId) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(modId)) {
                next.delete(modId);
            } else {
                next.add(modId);
            }
            return next;
        });
    };

    // Navigate to Prev
    const handlePrev = () => {
        if (currentIndex > 0) {
            const prevItem = chronologicalItems[currentIndex - 1];
            setSelectedItem(prevItem);
        }
    };

    // Navigate to Next
    const handleNext = () => {
        if (currentIndex < chronologicalItems.length - 1) {
            const nextItem = chronologicalItems[currentIndex + 1];
            setSelectedItem(nextItem);
        }
    };

    // Mark as Completed and Auto-advance
    const handleMarkComplete = async () => {
        if (activeItem.type !== 'subtopic') return;
        setMarkingProgress(true);
        try {
            await API.post('subtopic-progress/complete/', { subtopic_id: activeItem.id });
            setCompletedSubtopics(prev => new Set([...prev, activeItem.id]));

            // Auto advance
            if (currentIndex < chronologicalItems.length - 1) {
                const nextItem = chronologicalItems[currentIndex + 1];
                setSelectedItem(nextItem);
            }
        } catch (error) {
            console.error("Failed to complete subtopic", error);
            alert("Failed to mark subtopic as complete.");
        } finally {
            setMarkingProgress(false);
        }
    };

    // Add new subtopic under module
    const handleAddSubtopic = async (modId) => {
        const title = newSubtopicTitleMap[modId]?.trim();
        if (!title) return;

        try {
            const currentMod = course.modules.find(m => m.id === modId);
            const nextOrder = (currentMod?.subtopics?.length || 0) + 1;

            const response = await API.post('subtopics/', {
                module: modId,
                title,
                order: nextOrder,
                content: []
            });

            // Update course state locally
            setCourse(prev => {
                const updatedModules = prev.modules.map(m => {
                    if (m.id === modId) {
                        return {
                            ...m,
                            subtopics: [...(m.subtopics || []), response.data]
                        };
                    }
                    return m;
                });
                return { ...prev, modules: updatedModules };
            });

            // Clear input field & close adding input
            setNewSubtopicTitleMap(prev => ({ ...prev, [modId]: "" }));
            setAddingSubtopicModuleId(null);
            
            // Select the newly created subtopic immediately
            setSelectedItem({ type: 'subtopic', id: response.data.id });

        } catch (error) {
            console.error("Failed to create subtopic", error);
            alert("Failed to add subtopic.");
        }
    };

    // Save edited blocks of content for a subtopic
    const handleSaveContent = async () => {
        if (activeItem.type !== 'subtopic') return;
        setSavingContent(true);
        try {
            const response = await API.patch(`subtopics/${activeItem.id}/`, {
                content: editingContent
            });

            // Update local course modules subtopic content
            setCourse(prev => {
                const updatedModules = prev.modules.map(m => {
                    const updatedSubtopics = (m.subtopics || []).map(sub => {
                        if (sub.id === activeItem.id) {
                            return { ...sub, content: response.data.content };
                        }
                        return sub;
                    });
                    return { ...m, subtopics: updatedSubtopics };
                });
                return { ...prev, modules: updatedModules };
            });

            alert("Content saved successfully!");
        } catch (error) {
            console.error("Failed to save subtopic content", error);
            alert("Failed to save content.");
        } finally {
            setSavingContent(false);
        }
    };

    // Render simple markdown blocks safely
    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n\n').map((block, i) => {
            const trimmed = block.trim();
            if (trimmed.startsWith('# ')) {
                return <h1 key={i} className="text-3xl font-extrabold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2">{trimmed.replace('# ', '')}</h1>;
            }
            if (trimmed.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold text-gray-800 mt-5 mb-3">{trimmed.replace('## ', '')}</h2>;
            }
            if (trimmed.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-bold text-gray-700 mt-4 mb-2">{trimmed.replace('### ', '')}</h3>;
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n');
                return (
                    <ul key={i} className="list-disc pl-6 space-y-2 text-gray-600 my-4">
                        {items.map((item, idx) => (
                            <li key={idx}>{item.replace(/^[-*]\s+/, '')}</li>
                        ))}
                    </ul>
                );
            }
            return <p key={i} className="text-gray-600 leading-relaxed my-3">{trimmed}</p>;
        });
    };

    // Render structured JSON content inside isolated container
    const renderSubtopicContent = (contentArray) => {
        if (!contentArray || contentArray.length === 0) {
            return <p className="text-gray-500 italic">No content added yet.</p>;
        }
        return (
            <div className="subtopic-content-container space-y-4">
                {contentArray.map((block, i) => {
                    if (block.type === 'header') {
                        return <h2 key={i} className="text-2xl font-bold text-gray-950 mt-6 mb-3">{block.value}</h2>;
                    }
                    if (block.type === 'paragraph') {
                        return <p key={i} className="text-gray-600 leading-relaxed whitespace-pre-wrap">{block.value}</p>;
                    }
                    return null;
                })}
            </div>
        );
    };

    if (loading || !course) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const isInstructor = user?.role === 'instructor';

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 text-gray-800 font-sans">
            {/* Top Header */}
            <Navbar />
            {/* <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold tracking-wider text-indigo-600">
                        LEARNIFY
                    </span>
                </div>
                <div className="flex-1 max-w-lg mx-auto text-center hidden md:block">
                    <h2 className="font-bold text-gray-800 truncate">{course.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    
                </div>
            </header> */}

            {/* Split Middle Section */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar (Left Column) */}
                <aside className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Syllabus Outline</h3>
                        {pathData && (
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-50 text-indigo-650 text-xs px-2 py-0.5 rounded font-bold border border-indigo-200">
                                    AI Path
                                </span>
                                <button
                                    onClick={handleRegeneratePath}
                                    disabled={regenerating}
                                    title="Regenerate your personalised path"
                                    className="text-[10px] text-indigo-500 hover:text-indigo-700 disabled:opacity-40 font-semibold underline underline-offset-2"
                                >
                                    {regenerating ? '...' : '↻ Regenerate'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {/* Course Introduction Navigation Item */}
                        <button
                            onClick={() => setSelectedItem({ type: 'intro' })}
                            className={`w-full text-left p-3 rounded transition-all font-semibold flex items-center gap-3 ${
                                selectedItem.type === 'intro'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span>Course Introduction</span>
                        </button>

                        <div className="h-px bg-gray-200 my-2" />

                        {/* Modules Accordion list */}
                        {orderedModules.map((mod, modIdx) => {
                            const isExpanded = expandedModules.has(mod.id);
                            const pathItem = pathData?.find(item => item.module_id === mod.id);
                            const shouldSkip = pathItem?.skip;

                            return (
                                <div key={mod.id} className="border border-gray-200 rounded overflow-hidden bg-white">
                                    {/* Module Header Accordion Trigger */}
                                    <div
                                        onClick={() => toggleModule(mod.id)}
                                        className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] uppercase font-bold text-indigo-600">Module {modIdx + 1}</span>
                                                {shouldSkip && (
                                                    <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                                        Optional
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800 truncate">{mod.title}</h4>
                                            {pathItem?.reason && (
                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">
                                                    {pathItem.reason}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </div>

                                    {/* Subtopics of the Module */}
                                    {isExpanded && (
                                        <div className="p-2 bg-white space-y-1 border-t border-gray-100">
                                            {(mod.subtopics || []).map(sub => {
                                                const isActive = selectedItem.type === 'subtopic' && selectedItem.id === sub.id;
                                                const isDone = completedSubtopics.has(sub.id);

                                                return (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => setSelectedItem({ type: 'subtopic', id: sub.id })}
                                                        className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-all flex items-center justify-between ${
                                                            isActive
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="truncate pr-2">{sub.title}</span>
                                                        {isDone && <span className="text-emerald-500 font-bold text-xs">✓</span>}
                                                    </button>
                                                );
                                            })}

                                            {/* Instructor: Add Subtopic Button & Input */}
                                            {isInstructor && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    {addingSubtopicModuleId === mod.id ? (
                                                        <div className="space-y-1.5 p-1.5 bg-gray-50 rounded">
                                                            <input
                                                                type="text"
                                                                value={newSubtopicTitleMap[mod.id] || ""}
                                                                onChange={(e) => setNewSubtopicTitleMap(prev => ({ ...prev, [mod.id]: e.target.value }))}
                                                                placeholder="Subtopic Title..."
                                                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-indigo-600"
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => setAddingSubtopicModuleId(null)}
                                                                    className="px-2 py-0.5 text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAddSubtopic(mod.id)}
                                                                    className="px-2 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold"
                                                                >
                                                                    Add
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAddingSubtopicModuleId(mod.id)}
                                                            className="w-full text-center py-1.5 rounded border border-dashed border-gray-300 text-indigo-600 hover:text-indigo-700 hover:bg-gray-50 transition-all text-xs font-semibold"
                                                        >
                                                            + Add Subtopic
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Viewport (Right Column) */}
                <main className="flex-1 bg-gray-50 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto bg-white border border-gray-200 p-6 md:p-8 rounded shadow-sm">
                        
                        {/* Rendering Introduction Screen */}
                        {activeItem.type === 'intro' && (
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 pb-4">
                                    <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Welcome Note</span>
                                    <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Course Introduction</h1>
                                </div>
                                <div className="prose max-w-none">
                                    {renderMarkdown(introContent)}
                                </div>
                            </div>
                        )}

                        {/* Rendering Subtopic Content (Learner or Instructor Edit Mode) */}
                        {activeItem.type === 'subtopic' && activeItem.subtopic && (
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                                            {activeItem.module.title}
                                        </span>
                                        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
                                            {activeItem.subtopic.title}
                                        </h1>
                                    </div>

                                    {completedSubtopics.has(activeItem.id) && (
                                        <span className="bg-emerald-50 text-emerald-750 border border-emerald-200 text-xs px-2.5 py-1 rounded font-bold">
                                            ✓ Completed
                                        </span>
                                    )}
                                </div>

                                {/* Content Render Panel */}
                                <div className="p-4 bg-white border border-gray-200 rounded">
                                    {renderSubtopicContent(activeItem.subtopic.content)}
                                </div>

                                {/* Instructor Edit Controls */}
                                {isInstructor && (
                                    <div className="mt-8 border-t border-gray-200 pt-6">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🛠️</span>
                                            <span>Instructor Content Editor</span>
                                        </h3>

                                        <div className="space-y-4">
                                            {editingContent.map((block, idx) => (
                                                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded relative group">
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingContent(prev => prev.filter((_, i) => i !== idx));
                                                            }}
                                                            className="text-red-600 hover:text-red-700 text-[10px] bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>

                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                        {block.type === 'header' ? 'Header Block' : 'Paragraph Block'}
                                                    </label>

                                                    {block.type === 'header' ? (
                                                        <input
                                                            type="text"
                                                            value={block.value}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setEditingContent(prev => prev.map((b, i) => i === idx ? { ...b, value: val } : b));
                                                            }}
                                                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-indigo-600 text-sm"
                                                            placeholder="Enter header text..."
                                                        />
                                                    ) : (
                                                        <textarea
                                                            value={block.value}
                                                            rows={4}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setEditingContent(prev => prev.map((b, i) => i === idx ? { ...b, value: val } : b));
                                                            }}
                                                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-indigo-600 text-sm"
                                                            placeholder="Enter paragraph text..."
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-3 mt-4 justify-between">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingContent(prev => [...prev, { type: 'header', value: '' }])}
                                                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-indigo-600 hover:text-indigo-700 rounded text-xs font-bold transition-all border border-gray-300 shadow-sm"
                                                >
                                                    + Add Header
                                                </button>
                                                <button
                                                    onClick={() => setEditingContent(prev => [...prev, { type: 'paragraph', value: '' }])}
                                                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-indigo-600 hover:text-indigo-700 rounded text-xs font-bold transition-all border border-gray-300 shadow-sm"
                                                >
                                                    + Add Paragraph
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleSaveContent}
                                                disabled={savingContent}
                                                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded text-xs font-bold transition-all"
                                            >
                                                {savingContent ? "Saving..." : "✓ Save Subtopic Content"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Bottom Control Bar */}
            <footer className="h-16 border-t border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
                {/* Previous Button */}
                <button
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    className="px-4 py-2 text-sm font-semibold rounded border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ← Previous
                </button>

                {/* Mark as Completed */}
                {activeItem.type === 'subtopic' ? (
                    <button
                        onClick={handleMarkComplete}
                        disabled={completedSubtopics.has(activeItem.id) || markingProgress}
                        className={`px-5 py-2 text-sm font-bold rounded ${
                            completedSubtopics.has(activeItem.id)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                    >
                        {markingProgress ? 'Saving...' : completedSubtopics.has(activeItem.id) ? '✓ Completed' : 'Mark as Completed'}
                    </button>
                ) : (
                    <div className="text-xs text-gray-400 font-medium italic">Introduction Page</div>
                )}

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    disabled={currentIndex >= chronologicalItems.length - 1}
                    className="px-4 py-2 text-sm font-semibold rounded border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Next →
                </button>
            </footer>
        </div>
    );
}

export default CourseList;
