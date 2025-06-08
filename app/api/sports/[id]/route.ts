import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
  }

  try {
    // Fetch activity and track points in parallel
    const [activityRes, trackPointsRes] = await Promise.all([
      supabase.from('activities').select('*').eq('id', id).single(),
      supabase.from('activity_track_points').select('latitude, longitude, timestamp, altitude').eq('activity_id', id).order('timestamp', { ascending: true })
    ]);
    
    const { data: activity, error: activityError } = activityRes;
    const { data: trackPoints, error: trackPointsError } = trackPointsRes;

    if (activityError) {
      // If single() doesn't find a row, it returns an error. Handle this as a 404.
      if (activityError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
      }
      throw activityError;
    }
    
    if (trackPointsError) {
      // It's okay if track points fail, we can still return the activity.
      console.error(`Failed to fetch track points for activity ${id}:`, trackPointsError);
    }

    return NextResponse.json({
      ...activity,
      track_points: trackPoints || [], // Return empty array if null or error
    });

  } catch (error: any) {
    console.error('Error fetching activity details:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
} 