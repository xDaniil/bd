"use client";
import { useRef, useState } from "react";

type RollResponse = {
  card: {
    id: number;
    name: string;
    image: string;
  };
  existing: boolean;
  error?: string;
};

export default function Home() {
  const [result, setResult] = useState<RollResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function drawCard() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/roll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Could not contact the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="arcana-noise min-h-screen flex items-center justify-center">
      <div className="crt-screen w-full min-h-screen">
        <div className="crt-content mx-auto w-full max-w-3xl px-5 py-10 text-center">
          {!result ? (
            <>
              <div className="relative mb-10">
                <span className="pixel-star left-0 top-2">✦</span>
                <span className="pixel-star right-0 top-8">✦</span>

                <p className="pixel-muted mb-5">
                  DANIIL&apos;S BIRTHDAY // 2026
                </p>

                <h1 className="arcana-title text-5xl md:text-7xl">
                  THE ARCANA
                </h1>

                <h1 className="arcana-title text-5xl md:text-7xl">AWAITS</h1>
              </div>

              <div className="arcana-panel rounded-none p-8 md:p-12">
                <button
                  onClick={drawCard}
                  disabled={loading}
                  className="draw-button mt-10 w-full cursor-pointer px-8 py-6 text-xl tracking-widest"
                >
                  {loading ? "SHUFFLING THE FATES..." : "DRAW YOUR FATE"}
                </button>

                {error && (
                  <p className="mt-6 text-pink-400 font-bold">ERROR: {error}</p>
                )}

                <div className="mt-8 flex justify-center gap-4 text-xs">
                  <span className="text-cyan-400">♥</span>
                  <span className="text-pink-400">♦</span>
                  <span className="text-yellow-300">♣</span>
                  <span className="text-cyan-400">♠</span>
                </div>

                <p className="pixel-muted mt-5">
                  THE DRAW IS A SOUL-BINDING AGREEMENT
                </p>
              </div>
            </>
          ) : (
            <Reveal result={result} />
          )}
        </div>
      </div>
    </main>
  );
}

function Choice({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-2xl border px-6 py-5
        uppercase tracking-[0.15em]
        transition-all duration-200
        ${
          selected
            ? "border-amber-100 bg-amber-100 text-black scale-[1.02]"
            : "border-amber-100/20 bg-black/20 text-amber-100/70 hover:border-amber-100/60 hover:text-amber-100"
        }
      `}
    >
      {label}
    </button>
  );
}

function Reveal({ result }: { result: RollResponse }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);
  function handleCardMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    const rotateX = -y * 10;
    const rotateY = x * 10;

    setTilt({
      x: rotateX,
      y: rotateY,
    });
    setShine({
      x: x * 100,
      y: y * 100,
    });
  }

  function handleCardEnter() {
    setHovering(true);
  }

  function handleCardLeave() {
    setHovering(false);

    setTilt({
      x: 0,
      y: 0,
    });

    setShine({
      x: 50,
      y: 50,
    });
  }

  return (
    <>
      <p className="text-xs md:text-sm tracking-[0.45em] uppercase text-amber-200/40">
        Your Arcana
      </p>

      <div className="arcana-card mt-6 mx-auto p-3 w-fit max-w-[90vw]">
        <div className="relative h-[55vh] w-full bg-transparent flex justify-center max-h-[680px] aspect-[2/3] overflow-hidden ">
          <div
            ref={cardRef}
            onMouseEnter={handleCardEnter}
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
            onClick={() => setRevealed(true)}
            className={`reveal-card ${hovering ? "is-hovered" : ""} ${
              revealed ? "is-revealed" : ""
            }`}
            style={
              {
                transform: `
      perspective(1000px)
      rotateX(${tilt.x}deg)
      rotateY(${tilt.y}deg)
    `,
                "--shine-x": `${shine.x}%`,
                "--shine-y": `${shine.y}%`,
              } as React.CSSProperties
            }
          >
            <div className="card-flip h-fit">
              {/* FRONT */}
              <div className="card-face card-front h-fit">
                <img
                  src={result.card.image}
                  alt={result.card.name}
                  className="pixel-art w-full h-full object-contain"
                />

                <div className="holo-overlay" />
                <div className="holo-glare" />
              </div>

              {/* BACK */}
              <div className="card-face card-back  h-fit">
                <img
                  src="/cards/back_of_card_2.png"
                  alt="Tarot card back"
                  className="pixel-art w-full h-full object-contain"
                />

                <div className="holo-overlay" />
                <div className="holo-glare" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-sm tracking-[0.35em] text-amber-100/40">
            {toRoman(result.card.id)}
          </p>
          {!revealed && (
            <p className="arcana-subtitle mt-6 text-[0.55rem]">
              YOUR FATE AWAITS
            </p>
          )}
          {revealed && (
            <>
              <h1 className="arcana-title mt-4 text-3xl md:text-5xl">
                {result.card.name}
              </h1>
            </>
          )}

          {result.existing && (
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-100/25">
              Your fate was already sealed.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function toRoman(cardId: number) {
  if (cardId === 0) return "0";

  const romans = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
    "XV",
    "XVI",
    "XVII",
    "XVIII",
    "XIX",
    "XX",
    "XXI",
  ];

  return romans[cardId - 1];
}
