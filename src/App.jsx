import { useState, useEffect, useRef } from "react";

const KEYS = ["1", "2", "3", "4"];
const NUMBERS_PER_ROUND = 4;
const TOTAL_ROUNDS = 5;
const COOLDOWN_SECONDS = 2;

const TAUNTS = [
  "Too slow.",
  "He almost got you.",
  "Run.",
  "One more hit.",
  "Don't look back.",
  "Victim reflexes.",
  "Now we're talking.",
  "He heard your footsteps.",
];

function buildSequence(length) {
  const seq = [];
  let prev = null;
  for (let i = 0; i < length; i++) {
    let k;
    do {
      k = KEYS[Math.floor(Math.random() * KEYS.length)];
    } while (k === prev && KEYS.length > 1);
    seq.push(k);
    prev = k;
  }
  return seq;
}

export default function QTETrainer() {
  const [phase, setPhase] = useState("idle"); // idle, countdown, playing, cooldown, result
  const [countdown, setCountdown] = useState(3);
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [times, setTimes] = useState([]);
  const [misses, setMisses] = useState(0);
  const [lastResult, setLastResult] = useState(null); // "hit" | "miss" | null
  const [taunt, setTaunt] = useState("");
  const [best, setBest] = useState(null);
  const [flash, setFlash] = useState(null); // "hit" | "miss" | null
  const [shake, setShake] = useState(false);

  const lastActionTime = useRef(0);

  const startGame = () => {
    setSequence(buildSequence(NUMBERS_PER_ROUND));
    setCurrentIndex(0);
    setRoundNumber(1);
    setTimes([]);
    setMisses(0);
    setLastResult(null);
    setPhase("countdown");
    setCountdown(3);
  };

  // initial 3-2-1 countdown before round 1
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) {
      setPhase("playing");
      lastActionTime.current = performance.now();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // 2s cooldown between rounds, then auto-start next round
  useEffect(() => {
    if (phase !== "cooldown") return;
    if (cooldown === 0) {
      setSequence(buildSequence(NUMBERS_PER_ROUND));
      setCurrentIndex(0);
      setRoundNumber((r) => r + 1);
      setLastResult(null);
      setPhase("playing");
      lastActionTime.current = performance.now();
      return;
    }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, cooldown]);

  const flashFeedback = (type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 90);
  };

  useEffect(() => {
    function onKeyDown(e) {
      if (phase !== "playing") return;
      if (!KEYS.includes(e.key)) return;

      const expected = sequence[currentIndex];
      if (e.key === expected) {
        const now = performance.now();
        const reaction = Math.round(now - lastActionTime.current);
        lastActionTime.current = now;
        setTimes((prev) => [...prev, reaction]);
        setLastResult("hit");
        setTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
        flashFeedback("hit");
        setCurrentIndex((idx) => {
          const next = idx + 1;
          if (next >= sequence.length) {
            if (roundNumber >= TOTAL_ROUNDS) {
              setPhase("result");
            } else {
              setCooldown(COOLDOWN_SECONDS);
              setPhase("cooldown");
            }
          }
          return next;
        });
      } else {
        setMisses((m) => m + 1);
        setLastResult("miss");
        flashFeedback("miss");
        setShake(true);
        setTimeout(() => setShake(false), 200);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, currentIndex, sequence, roundNumber]);

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const bestTime = times.length ? Math.min(...times) : null;
  const totalNumbers = NUMBERS_PER_ROUND * TOTAL_ROUNDS;

  useEffect(() => {
    if (phase === "result" && bestTime !== null) {
      setBest((prevBest) => (prevBest === null || bestTime < prevBest ? bestTime : prevBest));
    }
    // eslint-disable-next-line
  }, [phase]);

  const boxSize = 44;
  const gap = 10;
  const step = boxSize + gap;
  const containerWidth = 400;
  const translateX = -(currentIndex * step) + (containerWidth / 2 - boxSize / 2);

  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        background: "radial-gradient(ellipse at center, #1a1410 0%, #0a0806 60%, #050403 100%)",
        color: "#d8cfc0",
        fontFamily: "'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 160px 60px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      />

      {flash === "hit" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(60, 150, 90, 0.28)", pointerEvents: "none" }} />
      )}
      {flash === "miss" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(124, 92, 191, 0.32)", pointerEvents: "none" }} />
      )}

      <div style={{ zIndex: 1, width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#7a6a55", marginBottom: 6 }}>
          Haddonfield · Reflex Training
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 30,
            fontWeight: 400,
            color: "#ff7518",
            letterSpacing: 1,
            margin: "0 0 28px 0",
            textShadow: "0 0 18px rgba(255,117,24,0.4)",
          }}
        >
          Don't Look Back
        </h1>

        {phase === "idle" && (
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "#a89a86", margin: "0 0 28px 0" }}>
              {TOTAL_ROUNDS} sequences of {NUMBERS_PER_ROUND} numbers, one after another.
              <br />
              Press the right key to advance.
              <br />
              {COOLDOWN_SECONDS} seconds of pause between sequences, then it starts again on its own.
            </p>
            <button onClick={startGame} style={buttonStyle}>
              Start
            </button>
            {best !== null && (
              <div style={{ marginTop: 18, fontSize: 13, color: "#7a6a55" }}>
                All-time best: {best} ms
              </div>
            )}
          </div>
        )}

        {phase === "countdown" && (
          <div
            style={{
              fontSize: 64,
              fontFamily: "Georgia, serif",
              color: "#ff7518",
              minHeight: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {countdown > 0 ? countdown : "Go"}
          </div>
        )}

        {(phase === "playing" || phase === "cooldown") && (
          <div>
            <div style={{ fontSize: 13, color: "#7a6a55", marginBottom: 16 }}>
              Sequence {roundNumber}/{TOTAL_ROUNDS} · {currentIndex}/{sequence.length}
            </div>

            <div
              style={{
                position: "relative",
                width: containerWidth,
                maxWidth: "100%",
                height: boxSize + 4,
                margin: "0 auto 20px auto",
                overflow: "hidden",
                opacity: phase === "cooldown" ? 0.35 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: -6,
                  bottom: -6,
                  width: boxSize + 10,
                  transform: "translateX(-50%)",
                  border: "2px solid #ff7518",
                  borderRadius: 6,
                  boxShadow: shake ? "0 0 0 2px rgba(255,117,24,0.55)" : "0 0 24px rgba(255,117,24,0.4)",
                  transition: "box-shadow 0.15s ease",
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: `${gap}px`,
                  position: "absolute",
                  left: 0,
                  top: 2,
                  transform: `translateX(${translateX}px) ${shake ? "translateY(2px)" : ""}`,
                  transition: "transform 0.16s ease-out",
                }}
              >
                {sequence.map((num, i) => {
                  const isDone = i < currentIndex;
                  const isCurrent = i === currentIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        width: boxSize,
                        height: boxSize,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Georgia, serif",
                        fontSize: isCurrent ? 26 : 20,
                        borderRadius: 5,
                        color: isDone ? "#4a4034" : isCurrent ? "#f2e9dc" : "#8a7a63",
                        background: isDone ? "transparent" : "rgba(255,255,255,0.03)",
                        border: isDone ? "1px solid #2a2419" : "1px solid transparent",
                        opacity: isDone ? 0.4 : 1,
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: 13, minHeight: 18, color: "#8a7a63" }}>
              {phase === "cooldown" && `Next sequence in ${cooldown}s...`}
              {phase === "playing" && lastResult === "hit" && `${taunt} (${times[times.length - 1]} ms)`}
              {phase === "playing" && lastResult === "miss" && "Wrong key."}
              {phase === "playing" && lastResult === null && "\u00A0"}
            </div>
          </div>
        )}

        {phase === "result" && (
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#f2e9dc", marginBottom: 4 }}>
              {misses === 0 ? "You survived without a scratch." : "You survived."}
            </div>
            <div style={{ fontSize: 13, color: "#7a6a55", marginBottom: 24 }}>
              {totalNumbers} numbers completed · {misses} mistakes
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              <StatBox label="Average time" value={avg !== null ? `${avg} ms` : "—"} />
              <StatBox
                label="Best hit"
                value={bestTime !== null ? `${bestTime} ms` : "—"}
                highlight={bestTime !== null && best !== null && bestTime <= best}
              />
            </div>

            <button onClick={startGame} style={buttonStyle}>
              Retry
            </button>
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => setPhase("idle")}
                style={{ ...buttonStyle, background: "transparent", color: "#7a6a55", border: "1px solid #3a3128" }}
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }) {
  return (
    <div style={{ border: `1px solid ${highlight ? "#ff7518" : "#3a3128"}`, borderRadius: 4, padding: "14px 8px" }}>
      <div style={{ fontSize: 11, color: "#7a6a55", marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: highlight ? "#ff7518" : "#f2e9dc" }}>
        {value}
      </div>
    </div>
  );
}

const buttonStyle = {
  background: "#ff7518",
  color: "#0a0806",
  border: "none",
  borderRadius: 3,
  padding: "12px 32px",
  fontSize: 14,
  fontFamily: "'Courier New', monospace",
  letterSpacing: 1,
  cursor: "pointer",
  fontWeight: "bold",
};
