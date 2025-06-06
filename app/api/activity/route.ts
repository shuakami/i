import { NextResponse } from "next/server"

const API_BASE = process.env.API_BASE

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/activity`, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; StatusApp/1.0)",
      },
      // 添加超时
      signal: AbortSignal.timeout(5000),
    })

    // 先获取响应文本
    const responseText = await response.text()
    console.log("Activity API response:", responseText)

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
    console.error("Failed to fetch activity:", error)
    // 返回模拟数据用于测试
    return NextResponse.json(
      [
        {
          user_id: "demo",
          timestamp: Date.now(),
          process_name: "cursor.exe",
          window_title: "Cursor - 写代码",
          mouse_idle_seconds: 30,
          is_fullscreen: false,
          extra_info: "",
        },
      ],
      { status: 200 },
    )
  }
}
