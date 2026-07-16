import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/navbar";

function CourseAnalytics() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [courseName, setCourseName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, courseRes] = await Promise.all([
                    API.get(`progress/analytics/?course_id=${id}`),
                    API.get(`courses/${id}/`),
                ]);
                setData(analyticsRes.data);
                setCourseName(courseRes.data.title);
            } catch (err) {
                setError(err.response?.data?.error || "Failed to load analytics.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <>
            <Navbar />
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
            </div>
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <div className="max-w-2xl mx-auto mt-16 text-center">
                <p className="text-red-600 font-semibold">{error}</p>
                <Link to={`/courses/${id}`} className="mt-4 inline-block text-indigo-600 underline">← Back to Course</Link>
            </div>
        </>
    );

    const {
        completion_rate,
        drop_off_module,
        avg_completion_pct,
        total_enrolled,
        total_completed,
        per_learner,
    } = data;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-10 px-6">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">Course Analytics</p>
                            <h1 className="text-3xl font-extrabold text-gray-900">{courseName}</h1>
                        </div>
                        <Link
                            to={`/courses/${id}`}
                            className="text-sm text-gray-500 hover:text-indigo-600 font-medium"
                        >
                            ← Back to Course
                        </Link>
                    </div>

                    {/* Top KPI cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard label="Enrolled Learners" value={total_enrolled} color="indigo" />
                        <KpiCard label="Fully Completed" value={total_completed} color="emerald" />
                        <KpiCard label="Completion Rate" value={`${completion_rate}%`} color="indigo" />
                        <KpiCard label="Avg Progress" value={`${avg_completion_pct}%`} color="amber" />
                    </div>

                    {/* Completion rate bar */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Overall Completion Rate</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-indigo-600 h-4 rounded-full transition-all duration-700"
                                    style={{ width: `${completion_rate}%` }}
                                />
                            </div>
                            <span className="text-xl font-extrabold text-indigo-700 w-14 text-right">{completion_rate}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{total_completed} of {total_enrolled} learners completed all subtopics</p>
                    </div>

                    {/* Drop-off module */}
                    <div className={`rounded-2xl border p-6 shadow-sm ${drop_off_module ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Drop-off Point</h2>
                        {drop_off_module ? (
                            <>
                                <p className="text-2xl font-extrabold text-amber-700">{drop_off_module}</p>
                                <p className="text-xs text-amber-600 mt-1">Most learners stopped progressing at this module.</p>
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                {total_enrolled === 0
                                    ? "No learners enrolled yet."
                                    : "No drop-off detected — all learners are still progressing or have completed."}
                            </p>
                        )}
                    </div>

                    {/* Per-learner table */}
                    {per_learner.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Learner Breakdown</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Learner</th>
                                            <th className="px-6 py-3 text-left">Progress</th>
                                            <th className="px-6 py-3 text-left">Subtopics</th>
                                            <th className="px-6 py-3 text-left">Status</th>
                                            <th className="px-6 py-3 text-left">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {per_learner.map((learner) => (
                                            <tr key={learner.username} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-semibold text-gray-800">{learner.username}</td>
                                                <td className="px-6 py-4 w-40">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-indigo-500 h-2 rounded-full"
                                                                style={{ width: `${learner.completion_pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-600 w-8">{learner.completion_pct}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {learner.completed_subtopics}/{learner.total_subtopics}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {learner.finished ? (
                                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded font-bold">✓ Completed</span>
                                                    ) : learner.completion_pct > 0 ? (
                                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded font-bold">In Progress</span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-bold">Not Started</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-xs">
                                                    {learner.last_active
                                                        ? new Date(learner.last_active).toLocaleDateString()
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

function KpiCard({ label, value, color }) {
    const colors = {
        indigo: "text-indigo-700 bg-indigo-50 border-indigo-200",
        emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
        amber: "text-amber-700 bg-amber-50 border-amber-200",
    };
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
            <p className="text-3xl font-extrabold">{value}</p>
        </div>
    );
}

export default CourseAnalytics;
