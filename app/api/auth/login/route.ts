import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const appSecret = process.env.APP_SECRET;

    if (!appSecret) {
      return NextResponse.json(
        { error: "Authentication not configured" },
        { status: 500 }
      );
    }

    if (password !== appSecret) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set auth cookie (httpOnly, secure in production)
    const response = NextResponse.json({ success: true });
    response.cookies.set("bobo-auth", appSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  // Logout - clear the cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete("bobo-auth");
  return response;
}
