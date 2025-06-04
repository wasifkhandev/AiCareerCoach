import React, { useState } from 'react';
import axios from 'axios';

const JobSearch = () => {
    const [keywords, setKeywords] = useState('');
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setJobs([]);

        try {
            const response = await axios.get(`/api/jobs/search`, {
                params: {
                    keywords,
                    location,
                    limit: 5
                }
            });
            setJobs(response.data.jobs);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to search jobs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <form onSubmit={handleSearch} className="mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Job title, skills, or keywords"
                        className="flex-1 p-2 border rounded"
                        required
                    />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, state, or remote"
                        className="flex-1 p-2 border rounded"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {loading ? 'Searching...' : 'Search Jobs'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="text-red-500 mb-4">
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {jobs.map((job, index) => (
                    <div key={index} className="border rounded p-4 hover:shadow-lg transition-shadow">
                        <h2 className="text-xl font-bold mb-2">{job.title}</h2>
                        <div className="text-gray-600 mb-2">
                            <span className="font-semibold">{job.company}</span> • {job.location}
                        </div>
                        {job.salary && (
                            <div className="text-green-600 mb-2">
                                {job.salary}
                            </div>
                        )}
                        <div className="text-gray-700 mb-4">
                            {job.description}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                Posted: {job.postedDate}
                            </span>
                            <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                            >
                                View Job →
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {jobs.length === 0 && !loading && !error && (
                <div className="text-center text-gray-500 mt-8">
                    No jobs found. Try different keywords or location.
                </div>
            )}
        </div>
    );
};

export default JobSearch; 