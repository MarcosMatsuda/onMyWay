'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

interface NewSchoolFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Saving...' : 'Create School'}
    </button>
  );
}

export default function NewSchoolForm({ onSubmit }: NewSchoolFormProps) {
  const router = useRouter();

  return (
    <form action={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          School Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lat" className="block text-sm font-medium text-gray-700">
            Latitude *
          </label>
          <input
            type="number"
            id="lat"
            name="lat"
            defaultValue="-23.5505"
            step="0.0001"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="lng" className="block text-sm font-medium text-gray-700">
            Longitude *
          </label>
          <input
            type="number"
            id="lng"
            name="lng"
            defaultValue="-46.6333"
            step="0.0001"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="geofenceRadiusMeters"
            className="block text-sm font-medium text-gray-700"
          >
            Geofence Radius (m) *
          </label>
          <input
            type="number"
            id="geofenceRadiusMeters"
            name="geofenceRadiusMeters"
            defaultValue="500"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label
            htmlFor="notificationThresholdMeters"
            className="block text-sm font-medium text-gray-700"
          >
            Notification Threshold (m) *
          </label>
          <input
            type="number"
            id="notificationThresholdMeters"
            name="notificationThresholdMeters"
            defaultValue="1000"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/schools')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}
