import { NextResponse } from "next/server";
import { getActivityDetails, predictAvailability } from "../../lib/activityUtils";
import { getAliveStatus } from "../../lib/statusUtils";
import type { ActivityData, ActivityDetails, HeartRateData } from "../../types";

const API_BASE = process.env.API_BASE;

export async function GET() {
  // 确保 API_BASE 已配置
  if (!API_BASE) {
    console.error("API_BASE environment variable is not set.");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    // 1. 从源 API 并行获取数据
    const [heartResponse, activityResponse] = await Promise.all([
      fetch(`${API_BASE}/api/v1/status`, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "i-copy-api/1.0" },
      }),
      fetch(`${API_BASE}/api/v1/activity`, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "i-copy-api/1.0" },
      }),
    ]);

    // 处理来自源 API 的错误响应
    if (!heartResponse.ok || !activityResponse.ok) {
      console.error("Failed to fetch data from source", {
        heartStatus: heartResponse.status,
        activityStatus: activityResponse.status,
      });
      // 返回一个"离线"状态的文案，而不是错误
      return NextResponse.json({
        alive: { text: "掉线了", color: "text-neutral-500" },
        activity: { text: "未知" },
        availability: {
          status: "有点懵",
          reason: "暂时无法连接到数据源",
          suggestion: "请稍后重试",
          color: "text-neutral-500",
        },
        data: { heart_rate: null, mouse_idle_seconds: null, window_title: null },
        last_update: new Date().toISOString(),
      });
    }

    const heartDataArr: HeartRateData[] = await heartResponse.json();
    const activityDataArr: ActivityData[] = await activityResponse.json();

    const heartRate = heartDataArr.length > 0 ? heartDataArr[0] : null;
    const activity = activityDataArr.length > 0 ? activityDataArr[0] : null;

    // 2. 使用工具函数处理数据
    // !! 修正时间戳单位：从纳秒转换为毫秒
    const timeSinceLastHR = heartRate ? Date.now() - heartRate.last_timestamp / 1_000_000 : Infinity;
    const isRecentHR = timeSinceLastHR < 300000; // 5 分钟

    const aliveStatus = getAliveStatus(heartRate, isRecentHR);
    const activityDetails: ActivityDetails | null = activity
      ? getActivityDetails(activity.window_title, activity.process_name)
      : null;
    const currentActivity = activityDetails ? activityDetails.description : "未知";
    const availability = predictAvailability(
      heartRate,
      activityDetails,
      activity ? activity.mouse_idle_seconds : 0,
    );

    // 3. 构建响应对象
    const responseCopy = {
      alive: {
        text: aliveStatus.text,
        color: aliveStatus.color,
      },
      activity: {
        text: currentActivity,
      },
      availability: {
        status: availability.status,
        reason: availability.reason,
        suggestion: availability.suggestion || null, // 确保有值
        color: availability.color,
      },
      data: {
        heart_rate: heartRate ? heartRate.last_non_zero_hr : null,
        mouse_idle_seconds: activity ? activity.mouse_idle_seconds : null,
        window_title: activity ? activity.window_title : null,
        process_name: activity ? activity.process_name : null
      },
      last_update: new Date().toISOString(),
    };

    // 允许跨域请求
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    return NextResponse.json(responseCopy, { headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
       return NextResponse.json({ error: "Data source timeout" }, { status: 504 });
    }
    console.error("Failed to generate copy:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// 处理 OPTIONS 预检请求
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
} 