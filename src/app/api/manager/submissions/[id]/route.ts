import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { error: "Manual metrics adjustment has been disabled. All metrics are automatically synchronized." },
    { status: 400 }
  );
}

