import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/dramabos";

export async function GET() {
  const status = await getProviderStatus();
  return NextResponse.json({ status });
}
