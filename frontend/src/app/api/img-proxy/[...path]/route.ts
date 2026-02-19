import { NextRequest, NextResponse } from "next/server"

const S3_INTERNAL_URL =
  process.env.S3_INTERNAL_URL || "http://minio:9000"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join("/")
  const minioUrl = `${S3_INTERNAL_URL}/medusa-uploads/${filePath}`

  try {
    const upstream = await fetch(minioUrl)
    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream"
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
