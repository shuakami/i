import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Default to today's date in UTC, formatted as YYYYMMDD
    const date = searchParams.get('date') || dayjs.utc().format('YYYYMMDD');

    try {
        const { data, error } = await supabase
            .from('daily_heart_rate_hourly')
            .select('hour, min_hr, max_hr')
            .eq('date', date)
            .order('hour', { ascending: true });

        if (error) {
            throw error;
        }

        // Calculate aggregate stats
        let totalMinHr = 0;
        let totalMaxHr = 0;
        let minHr = Infinity;
        let maxHr = -Infinity;
        
        data.forEach(item => {
            totalMinHr += item.min_hr;
            totalMaxHr += item.max_hr;
            if (item.min_hr < minHr) minHr = item.min_hr;
            if (item.max_hr > maxHr) maxHr = item.max_hr;
        });

        const averageHr = data.length > 0 ? Math.round((totalMinHr + totalMaxHr) / (data.length * 2)) : 0;
        
        // Ensure we have data for all 24 hours for a consistent chart
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
            const hourData = data.find(d => d.hour === i);
            return {
                hour: i,
                min_hr: hourData?.min_hr || null,
                max_hr: hourData?.max_hr || null,
            };
        });


        return NextResponse.json({
            date,
            hourlyData,
            stats: {
                min: minHr === Infinity ? 0 : minHr,
                max: maxHr === -Infinity ? 0 : maxHr,
                avg: averageHr
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 