import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { majorArcana } from "@/lib/cards";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

function hashIp(ip: string) {
  return crypto
    .createHash("sha256")
    .update(ip + process.env.IP_SALT!)
    .digest("hex");
}

function getIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") ?? "local-dev";
}

export async function POST(req: NextRequest) {
  try {
    const ipHash = hashIp(getIp(req));

    // If this IP has already rolled, return the same card.
    const { data: existing, error: existingError } = await supabase
      .from("rolls")
      .select("card_id")
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (existingError) {
      console.error(existingError);

      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        card: majorArcana[existing.card_id],
        existing: true,
      });
    }

    // Try a few times in case two users draw the same card simultaneously.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: claimed, error: claimedError } = await supabase
        .from("rolls")
        .select("card_id");

      if (claimedError) {
        console.error(claimedError);

        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      const claimedIds = new Set(claimed.map((row) => row.card_id));

      const remaining = majorArcana.filter((card) => !claimedIds.has(card.id));

      if (remaining.length === 0) {
        return NextResponse.json(
          { error: "All Arcana have been claimed." },
          { status: 409 },
        );
      }

      const card = remaining[Math.floor(Math.random() * remaining.length)];

      const { error: insertError } = await supabase.from("rolls").insert({
        ip_hash: ipHash,
        card_id: card.id,
      });

      if (!insertError) {
        return NextResponse.json({
          card,
          existing: false,
        });
      }

      // 23505 = unique constraint violation.
      // Could mean another request just took this card,
      // or this IP somehow raced against itself.
      if (insertError.code === "23505") {
        const { data: nowExisting } = await supabase
          .from("rolls")
          .select("card_id")
          .eq("ip_hash", ipHash)
          .maybeSingle();

        if (nowExisting) {
          return NextResponse.json({
            card: majorArcana[nowExisting.card_id],
            existing: true,
          });
        }

        // Otherwise another user claimed this card.
        // Loop and try another remaining one.
        continue;
      }

      console.error(insertError);

      return NextResponse.json(
        { error: "Could not save roll" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Could not assign a card. Try again." },
      { status: 500 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
