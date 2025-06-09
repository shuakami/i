import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get date ranges
const getISODateRange = (period: 'month' | 'year') => {
    const now = new Date();
    let startDate: Date;

    if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
    } else { // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of the current month
    }
    
    // Set to UTC midnight
    startDate.setUTCHours(0, 0, 0, 0);

    return {
        start: startDate.toISOString(),
    };
};

// Function to fetch stats for a given period
async function getStatsForPeriod(startDate?: string) {
    let query = supabase.from('activities').select('id, total_distance, total_time');

    if (startDate) {
        query = query.gte('start_time', startDate);
    }
    
    const { data, error } = await query;

    if (error) {
        throw error;
    }

    const totalActivities = data.length;
    const totalDistance = data.reduce((sum, act) => sum + (act.total_distance || 0), 0);
    const totalTime = data.reduce((sum, act) => sum + (act.total_time || 0), 0);

    return {
        totalActivities,
        totalDistance,
        totalTime,
    };
}


export async function GET() {
    try {
        const { start: yearStart } = getISODateRange('year');
        const { start: monthStart } = getISODateRange('month');

        const [allTimeStats, yearStats, monthStats] = await Promise.all([
            getStatsForPeriod(),
            getStatsForPeriod(yearStart),
            getStatsForPeriod(monthStart)
        ]);

        return NextResponse.json({
            allTime: allTimeStats,
            year: yearStats,
            month: monthStats,
        });

    } catch (error: any) {
        console.error('Failed to fetch sports stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 