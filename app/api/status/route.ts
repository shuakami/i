import { NextResponse } from "next/server"

const API_BASE = process.env.API_BASE

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/status`, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; StatusApp/1.0)",
      },
      // 添加超时
      signal: AbortSignal.timeout(5000),
    })

    // 先获取响应文本
    const responseText = await response.text()
    console.log("Status API response:", responseText)

    // 检查响应是否成功
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, response: ${responseText}`)
      return NextResponse.json([], { status: 200 })
    }

    // 尝试解析JSON
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error("Failed to parse JSON:", responseText)
      return NextResponse.json([], { status: 200 })
    }
  } catch (error) {
    console.error("Failed to fetch status:", error)
    // 返回模拟数据用于测试
    return NextResponse.json(
      [
        {
          user_id: "demo",
          device_id: "demo_device",
          alarm_state: "NONE",
          last_non_zero_hr: 72,
          last_timestamp: Date.now() * 1000000,
          is_watch_off: false,
          recent_hrs: [{ HeartRate: 72, Timestamp: Date.now() * 1000000 }],
        },
      ],
      { status: 200 },
    )
  }
}
