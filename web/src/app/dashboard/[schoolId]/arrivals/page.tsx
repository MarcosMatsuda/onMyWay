import { cookies } from 'next/headers';
import { getSchoolArrivals, getSchool, getSchoolStats } from '@/lib/server-api';
import { TOKEN_KEY } from '@/lib/auth';
import ArrivalsContainer from '@/components/arrivals/ArrivalsContainer';
import { Arrival, SchoolStats } from '@/types';

interface ArrivalsPageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function ArrivalsPage({ params }: ArrivalsPageProps) {
  const { schoolId } = await params;

  let arrivals: Arrival[] = [];
  let schoolName = schoolId;
  let schoolLat = -23.5505;
  let schoolLng = -46.6333;
  let stats: SchoolStats | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (token) {
      const [arrivalsData, schoolData, statsData] = await Promise.all([
        getSchoolArrivals(schoolId, token),
        getSchool(schoolId).catch(() => null),
        getSchoolStats(schoolId, token).catch(() => null),
      ]);

      arrivals = arrivalsData;
      schoolName = schoolData?.name ?? schoolId;
      schoolLat = schoolData?.location.lat ?? -23.5505;
      schoolLng = schoolData?.location.lng ?? -46.6333;
      stats = statsData;
    }
  } catch (error) {
    console.error('Error loading arrivals:', error);
  }

  return (
    <ArrivalsContainer
      schoolId={schoolId}
      schoolName={schoolName}
      schoolLat={schoolLat}
      schoolLng={schoolLng}
      initialArrivals={arrivals}
      stats={stats}
    />
  );
}
