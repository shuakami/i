import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")
  if (!url) {
    return new NextResponse("缺少 url 参数", { status: 400 })
  }
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })
    if (!response.ok) {
      return new NextResponse("图片获取失败", { status: response.status })
    }
    const contentType = response.headers.get("content-type") || "image/jpeg"
    const arrayBuffer = await response.arrayBuffer()
    const res = new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=600",
      },
    })
    return res
  } catch (e) {
    return new NextResponse("服务器错误", { status: 500 })
  }
} 