import { NextResponse } from "next/server";

// Clerk webhook disabled - auth is removed from this app
export async function POST() {
  return NextResponse.json({ disabled: true });
}
