import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

function getIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") ?? "local-dev";
}

function hashIp(ip: string) {
  return crypto
    .createHash("sha256")
    .update(ip + process.env.IP_SALT!)
    .digest("hex");
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-reset-key");

  if (key !== process.env.RESET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ipHash = hashIp(getIp(req));

  const { error } = await supabase.from("rolls").delete().eq("ip_hash", ipHash);

  if (error) {
    console.error(error);

    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}
