'use client';

import { useParams } from 'next/navigation';

export default function ArrivalsPage() {
  const params = useParams();
  const schoolId = params?.schoolId;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Arrivals Queue</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {/* School arrivals list will be implemented in following tasks */}
        <p className="text-gray-500">
          Loading arrivals for school {schoolId}...
        </p>
      </div>
    </div>
  );
}
