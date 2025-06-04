import React from 'react';
import JobSearch from '../components/JobSearch';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Tech Job Search
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Search for tech jobs on Dice.com
                    </p>
                </div>
            </header>

            <main>
                <JobSearch />
            </main>
        </div>
    );
} 