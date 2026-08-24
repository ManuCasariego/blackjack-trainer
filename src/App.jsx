import React, { useState, useRef, useEffect, useCallback } from "react";

// ---------- Card / deck helpers ----------
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
const RED_SUITS = ["♥", "♦"];

function rankValue(rank) {
  if (rank === "A") return 11;
  if (["10", "J", "Q", "K"].includes(rank)) return 10;
  return Number(rank);
}

function buildShoe(numDecks = 6) {
  const shoe = [];
  let id = 0;
  for (let d = 0; d < numDecks; d++) {
    for (const s of SUITS) {
      for (const r of RANKS) {
        shoe.push({ rank: r, suit: s, id: `${r}${s}${d}-${id++}` });
      }
    }
  }
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

function handValue(cards) {
  let sum = 0;
  let aces = 0;
  for (const c of cards) {
    sum += rankValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return { total: sum, soft: aces > 0 };
}

function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

// ---------- Basic strategy tables (col order: 2,3,4,5,6,7,8,9,10,A) ----------
function dealerIdx(rank) {
  if (rank === "A") return 9;
  if (["10", "J", "Q", "K"].includes(rank)) return 8;
  return Number(rank) - 2;
}

const HARD = {
  8: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  9: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
  10: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
  11: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D"],
  12: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
  13: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  14: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  15: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  16: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
};

const SOFT = {
  2: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  3: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  4: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
  5: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
  6: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
  7: ["Ds", "Ds", "Ds", "Ds", "Ds", "S", "S", "H", "H", "H"],
  8: ["S", "S", "S", "S", "Ds", "S", "S", "S", "S", "S"],
  9: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

const PAIRS = {
  11: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
  10: ["N", "N", "N", "N", "N", "N", "N", "N", "N", "N"],
  9: ["Y", "Y", "Y", "Y", "Y", "N", "Y", "Y", "N", "N"],
  8: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
  7: ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"],
  6: ["Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N", "N"], // Y/N -> Y (DAS assumed)
  5: ["N", "N", "N", "N", "N", "N", "N", "N", "N", "N"],
  4: ["N", "N", "N", "Y", "Y", "N", "N", "N", "N", "N"], // Y/N -> Y (DAS assumed)
  3: ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"],
  2: ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"],
};

const ACTION_LABEL = { H: "Hit", S: "Stand", D: "Double", Ds: "Double", P: "Split", R: "Surrender" };

function optimalAction(cards, dealerRank, { canDouble, canSurrender, canSplit }) {
  const idx = dealerIdx(dealerRank);
  const { total, soft } = handValue(cards);
  const isPair = cards.length === 2 && rankValue(cards[0].rank) === rankValue(cards[1].rank);

  if (canSurrender && !isPair && !soft) {
    if (total === 16 && [9, 10, "A"].includes(dealerRank === "J" || dealerRank === "Q" || dealerRank === "K" ? 10 : dealerRank === "10" ? 10 : dealerRank))
      return "R";
    if (total === 15 && (dealerRank === "10" || ["J", "Q", "K"].includes(dealerRank))) return "R";
  }

  if (isPair && canSplit) {
    const pv = rankValue(cards[0].rank);
    const act = PAIRS[pv][idx];
    if (act === "Y") return "P";
  }

  if (soft) {
    const key = total - 11; // non-ace card value, 2..9
    const clampKey = Math.min(9, Math.max(2, key));
    let act = SOFT[clampKey][idx];
    if (act === "D" || act === "Ds") return canDouble ? "D" : act === "Ds" ? "S" : "H";
    return act;
  }

  if (total >= 17) return "S";
  if (total <= 8) return "H";
  const act = HARD[total][idx];
  if (act === "D") return canDouble ? "D" : "H";
  return act;
}

// ---------- Visual helpers ----------
const FELT_BG = {
  background:
    "radial-gradient(ellipse at 50% -10%, #0f5c42 0%, #0a3f2d 55%, #072b1f 100%)",
};

const CARD_BACK = {
  backgroundImage:
    "repeating-linear-gradient(45deg, #1b3a63 0, #1b3a63 6px, #23477a 6px, #23477a 12px)",
};

function PlayingCard({ card, hidden, small }) {
  const w = small ? "w-11 h-16" : "w-14 h-20";
  if (hidden) {
    return (
      <div
        className={`${w} rounded-md border-2 border-yellow-600/40 shadow-lg flex items-center justify-center`}
        style={CARD_BACK}
      >
        <div className="w-5 h-5 rounded-full border border-yellow-500/60" />
      </div>
    );
  }
  const red = RED_SUITS.includes(card.suit);
  return (
    <div
      className={`${w} rounded-md bg-white shadow-lg flex flex-col justify-between px-1.5 py-1 border border-black/10`}
    >
      <div className={`text-xs font-bold leading-none ${red ? "text-red-600" : "text-gray-900"}`}>
        {card.rank}
      </div>
      <div className={`text-lg leading-none self-center ${red ? "text-red-600" : "text-gray-900"}`}>
        {card.suit}
      </div>
      <div
        className={`text-xs font-bold leading-none self-end rotate-180 ${red ? "text-red-600" : "text-gray-900"}`}
      >
        {card.rank}
      </div>
    </div>
  );
}

// ---------- Strategy chart overlay ----------
const COLS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
const COLOR = {
  H: "bg-white text-gray-800",
  S: "bg-amber-400 text-gray-900",
  D: "bg-emerald-600 text-white",
  Ds: "bg-teal-600 text-white",
  Y: "bg-emerald-600 text-white",
  N: "bg-white text-gray-800",
  R: "bg-emerald-600 text-white",
};

function ChartTable({ title, rows, rowLabels, highlight }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] tracking-widest text-emerald-200/70 font-semibold mb-1 uppercase">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-[11px] w-full">
          <thead>
            <tr>
              <th className="w-8"></th>
              {COLS.map((c) => (
                <th key={c} className="text-emerald-100/80 font-medium pb-1 w-7">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((label, ri) => (
              <tr key={label}>
                <td className="text-emerald-100/80 font-semibold pr-1 text-right">{label}</td>
                {rows[ri].map((val, ci) => {
                  const isHi = highlight && highlight.row === ri && highlight.col === ci;
                  return (
                    <td key={ci} className="p-0.5">
                      <div
                        className={`h-6 flex items-center justify-center rounded-sm font-bold ${
                          COLOR[val.replace("/N", "")] || "bg-white text-gray-800"
                        } ${isHi ? "ring-2 ring-yellow-300 scale-110" : ""}`}
                        style={{ transition: "transform 120ms" }}
                      >
                        {val}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StrategyChart({ onClose, activeHint }) {
  const hardRows = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8].map((t) => {
    if (t === 17) return COLS.map(() => "S");
    if (t <= 8) return COLS.map(() => "H");
    return HARD[t];
  });
  const softRows = [9, 8, 7, 6, 5, 4, 3, 2].map((k) => SOFT[k]);
  const pairRows = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((k) => PAIRS[k]);
  const surRows = [
    ["", "", "", "", "", "", "", "R", "R", "R"], // 16
    ["", "", "", "", "", "", "", "", "R", ""], // 15
    ["", "", "", "", "", "", "", "", "", ""], // 14
  ];

  let hardHi = null,
    softHi = null,
    pairHi = null;
  if (activeHint) {
    const { kind, rowLabel, col } = activeHint;
    if (kind === "hard") hardHi = { row: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8].indexOf(rowLabel), col };
    if (kind === "soft") softHi = { row: [9, 8, 7, 6, 5, 4, 3, 2].indexOf(rowLabel), col };
    if (kind === "pair") pairHi = { row: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2].indexOf(rowLabel), col };
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[88vh] overflow-y-auto p-4 pb-8"
        style={{ background: "linear-gradient(180deg,#0a3f2d,#062318)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-yellow-400 font-serif text-xl">Basic Strategy</div>
            <div className="text-emerald-200/60 text-xs">4–8 decks · dealer stands soft 17 · DAS</div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <ChartTable title="Hard Totals" rows={hardRows} rowLabels={["17", "16", "15", "14", "13", "12", "11", "10", "9", "8"]} highlight={hardHi} />
        <ChartTable title="Soft Totals" rows={softRows} rowLabels={["A,9", "A,8", "A,7", "A,6", "A,5", "A,4", "A,3", "A,2"]} highlight={softHi} />
        <ChartTable title="Pair Splitting" rows={pairRows} rowLabels={["A,A", "T,T", "9,9", "8,8", "7,7", "6,6", "5,5", "4,4", "3,3", "2,2"]} highlight={pairHi} />
        <ChartTable title="Surrender" rows={surRows} rowLabels={["16", "15", "14"]} highlight={null} />

        <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-emerald-100/80">
          <div><span className="inline-block w-3 h-3 bg-white rounded-sm align-middle mr-1" />Hit / Don't split</div>
          <div><span className="inline-block w-3 h-3 bg-amber-400 rounded-sm align-middle mr-1" />Stand</div>
          <div><span className="inline-block w-3 h-3 bg-emerald-600 rounded-sm align-middle mr-1" />Double / Split / Surrender</div>
          <div><span className="inline-block w-3 h-3 bg-teal-600 rounded-sm align-middle mr-1" />Double, else Stand</div>
        </div>
        <div className="mt-3 text-center text-[11px] text-yellow-300/80 tracking-wide">
          INSURANCE OR EVEN MONEY: DON'T TAKE
        </div>
      </div>
    </div>
  );
}

// ---------- Settings overlay ----------
function SettingsModal({ onClose, showTotal, onToggleShowTotal }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[88vh] overflow-y-auto p-4 pb-8"
        style={{ background: "linear-gradient(180deg,#0a3f2d,#062318)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-yellow-400 font-serif text-xl">Settings</div>
          <button
            onClick={onClose}
            className="text-emerald-100 bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div>
            <div className="text-sm font-semibold text-emerald-100">Show hand total</div>
            <div className="text-xs text-emerald-200/60 mt-0.5">
              Practice counting your hand in your head
            </div>
          </div>
          <button
            role="switch"
            aria-checked={showTotal}
            onClick={() => onToggleShowTotal(!showTotal)}
            className={`w-12 h-7 rounded-full relative transition-colors ${
              showTotal ? "bg-emerald-500" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                showTotal ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main app ----------
let handCounter = 0;

export default function BlackjackTrainer() {
  const shoeRef = useRef(buildShoe(6));
  const [dealer, setDealer] = useState({ cards: [], hideHole: true });
  const [hands, setHands] = useState([]); // {cards, done, isDoubled, result, bust, splitAces}
  const [activeHand, setActiveHand] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | player | dealer | result
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, best: 0, wins: 0, losses: 0, pushes: 0 });
  const [feedback, setFeedback] = useState(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTotal, setShowTotal] = useState(() => {
    const stored = localStorage.getItem("21trainer.showTotal");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("21trainer.showTotal", String(showTotal));
  }, [showTotal]);

  const draw = useCallback(() => {
    if (shoeRef.current.length < 20) shoeRef.current = buildShoe(6);
    return shoeRef.current.pop();
  }, []);

  function dealerUpRank() {
    return dealer.cards[0]?.rank;
  }

  function startHand() {
    const p1 = draw(),
      p2 = draw(),
      d1 = draw(),
      d2 = draw();
    const newHands = [{ id: handCounter++, cards: [p1, p2], done: false, isDoubled: false, result: null, bust: false }];
    setHands(newHands);
    setDealer({ cards: [d1, d2], hideHole: true });
    setActiveHand(0);
    setFeedback(null);

    const dealerBJ = isBlackjack([d1, d2]);
    const playerBJ = isBlackjack([p1, p2]);
    if (dealerBJ || playerBJ) {
      const resolved = newHands.map((h) => ({
        ...h,
        done: true,
        result: dealerBJ && playerBJ ? "push" : dealerBJ ? "lose" : "win",
      }));
      setHands(resolved);
      setDealer({ cards: [d1, d2], hideHole: false });
      setStage("result");
      tallyResults(resolved);
    } else {
      setStage("player");
    }
  }

  function tallyResults(finalHands) {
    setStats((s) => {
      let wins = s.wins,
        losses = s.losses,
        pushes = s.pushes;
      for (const h of finalHands) {
        if (h.result === "win") wins++;
        else if (h.result === "lose") losses++;
        else if (h.result === "push") pushes++;
        else if (h.result === "surrender") losses++;
      }
      return { ...s, wins, losses, pushes };
    });
  }

  function recordDecision(chosen, optimal) {
    const correct = chosen === optimal;
    setStats((s) => {
      const streak = correct ? s.streak + 1 : 0;
      return {
        ...s,
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak,
        best: Math.max(s.best, streak),
      };
    });
    setFeedback({
      correct,
      chosen,
      optimal,
    });
  }

  function currentFlags(hand) {
    return {
      canDouble: hand.cards.length === 2,
      canSurrender: hands.length === 1 && hand.cards.length === 2,
      canSplit:
        hands.length === 1 &&
        hand.cards.length === 2 &&
        rankValue(hand.cards[0].rank) === rankValue(hand.cards[1].rank),
    };
  }

  function advance(updatedHands) {
    const nextIdx = updatedHands.findIndex((h) => !h.done);
    if (nextIdx === -1) {
      setHands(updatedHands);
      playDealer(updatedHands);
    } else {
      setActiveHand(nextIdx);
      setHands(updatedHands);
    }
  }

  function act(action) {
    if (stage !== "player") return;
    const hand = hands[activeHand];
    const flags = currentFlags(hand);
    const optimal = optimalAction(hand.cards, dealerUpRank(), flags);
    recordDecision(action, optimal);

    let updated = [...hands];

    if (action === "H") {
      const c = draw();
      const cards = [...hand.cards, c];
      const { total } = handValue(cards);
      const bust = total > 21;
      updated[activeHand] = { ...hand, cards, done: bust, bust };
      advance(updated);
    } else if (action === "S") {
      updated[activeHand] = { ...hand, done: true };
      advance(updated);
    } else if (action === "D") {
      const c = draw();
      const cards = [...hand.cards, c];
      const { total } = handValue(cards);
      updated[activeHand] = { ...hand, cards, done: true, isDoubled: true, bust: total > 21 };
      advance(updated);
    } else if (action === "P") {
      const [c1, c2] = hand.cards;
      const isAces = c1.rank === "A";
      const h1 = { id: handCounter++, cards: [c1, draw()], done: isAces, isDoubled: false, result: null, bust: false, splitAces: isAces };
      const h2 = { id: handCounter++, cards: [c2, draw()], done: isAces, isDoubled: false, result: null, bust: false, splitAces: isAces };
      updated = [h1, h2];
      setActiveHand(0);
      if (isAces) {
        playDealer(updated);
      } else {
        setHands(updated);
      }
    } else if (action === "R") {
      updated[activeHand] = { ...hand, done: true, result: "surrender" };
      setHands(updated);
      setDealer((d) => ({ ...d, hideHole: false }));
      setStage("result");
      tallyResults(updated);
    }
  }

  function playDealer(playerHands) {
    setStage("dealer");
    const allDone = playerHands.every((h) => h.bust || h.result === "surrender");
    let dCards = [...dealer.cards];

    if (allDone) {
      setDealer({ cards: dCards, hideHole: false });
      finishRound(playerHands, dCards);
      return;
    }

    setDealer({ cards: dCards, hideHole: false });
    let { total, soft } = handValue(dCards);
    while (total < 17) {
      dCards = [...dCards, draw()];
      const hv = handValue(dCards);
      total = hv.total;
      soft = hv.soft;
    }
    setDealer({ cards: dCards, hideHole: false });
    finishRound(playerHands, dCards);
  }

  function finishRound(playerHands, dCards) {
    const dVal = handValue(dCards);
    const dBust = dVal.total > 21;
    const resolved = playerHands.map((h) => {
      if (h.result === "surrender") return h;
      if (h.bust) return { ...h, result: "lose" };
      const pVal = handValue(h.cards);
      let result;
      if (dBust) result = "win";
      else if (pVal.total > dVal.total) result = "win";
      else if (pVal.total < dVal.total) result = "lose";
      else result = "push";
      return { ...h, result };
    });
    setHands(resolved);
    setStage("result");
    tallyResults(resolved);
  }

  const activeHandObj = hands[activeHand];
  const flags = activeHandObj ? currentFlags(activeHandObj) : {};

  // build hint for chart overlay based on current decision context
  function buildHint() {
    if (stage !== "player" || !activeHandObj) return null;
    const cards = activeHandObj.cards;
    const { total, soft } = handValue(cards);
    const isPair = cards.length === 2 && rankValue(cards[0].rank) === rankValue(cards[1].rank);
    const col = dealerIdx(dealerUpRank());
    if (isPair) return { kind: "pair", rowLabel: rankValue(cards[0].rank), col };
    if (soft) return { kind: "soft", rowLabel: Math.min(9, Math.max(2, total - 11)), col };
    const clamped = Math.max(8, Math.min(17, total));
    return { kind: "hard", rowLabel: clamped, col };
  }

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;

  return (
    <div className="min-h-screen w-full flex flex-col text-white" style={FELT_BG}>
      {/* Header */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <div>
          <div className="font-serif text-2xl text-yellow-400 leading-none">21 Trainer</div>
          <div className="text-emerald-200/60 text-[11px] mt-0.5">basic strategy, no ads, no ledger</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartOpen(true)}
            className="border border-yellow-500/50 text-yellow-300 text-xs font-semibold px-3 py-2 rounded-full bg-white/5 active:bg-white/15"
          >
            Chart
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="border border-yellow-500/50 text-yellow-300 text-xs font-semibold px-3 py-2 rounded-full bg-white/5 active:bg-white/15"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mx-4 mb-3 grid grid-cols-4 gap-2 text-center">
        <Stat label="Accuracy" value={accuracy === null ? "—" : `${accuracy}%`} />
        <Stat label="Streak" value={stats.streak} />
        <Stat label="Best" value={stats.best} />
        <Stat label="Hands" value={stats.wins + stats.losses + stats.pushes} />
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col justify-between px-4 pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-emerald-200/50 mb-1">Dealer</div>
          <div className="flex gap-2 items-center min-h-[5rem]">
            {dealer.cards.map((c, i) => (
              <PlayingCard key={c.id} card={c} hidden={i === 1 && dealer.hideHole} />
            ))}
            {dealer.cards.length > 0 && !dealer.hideHole && (
              <span className="ml-2 text-yellow-300 font-semibold text-sm">{handValue(dealer.cards).total}</span>
            )}
          </div>
        </div>

        <div className="my-4">
          <div className="text-[11px] uppercase tracking-widest text-emerald-200/50 mb-1">
            {hands.length > 1 ? `Your hands` : "You"}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {hands.map((h, i) => {
              const v = handValue(h.cards);
              const isActive = stage === "player" && i === activeHand;
              return (
                <div
                  key={h.id}
                  className={`rounded-xl p-2 ${isActive ? "bg-white/10 ring-1 ring-yellow-400/60" : ""}`}
                >
                  <div className="flex gap-1.5 mb-1">
                    {h.cards.map((c) => (
                      <PlayingCard key={c.id} card={c} small />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-yellow-200">
                      {v.soft ? `Soft ${v.total}` : v.total}
                    </span>
                    {h.isDoubled && <span className="text-emerald-300">2x</span>}
                    {h.result && <ResultBadge result={h.result} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {feedback && stage !== "idle" && (
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${
              feedback.correct ? "bg-emerald-700/40 text-emerald-100" : "bg-red-700/40 text-red-100"
            }`}
          >
            {feedback.correct
              ? `Correct — ${ACTION_LABEL[feedback.chosen]}`
              : `You chose ${ACTION_LABEL[feedback.chosen]}. Basic strategy says ${ACTION_LABEL[feedback.optimal]}.`}
          </div>
        )}

        {/* Round result */}
        {stage === "result" && (
          <div className="mb-3 text-center">
            <div className="text-lg font-serif text-yellow-300">
              {hands.every((h) => h.result === "win")
                ? "You win"
                : hands.every((h) => h.result === "lose" || h.result === "surrender")
                ? "Dealer wins"
                : "Round over"}
            </div>
          </div>
        )}

        {/* Actions */}
        {stage === "player" && (
          <div className="grid grid-cols-5 gap-2">
            <ActionBtn label="Hit" onClick={() => act("H")} />
            <ActionBtn label="Stand" onClick={() => act("S")} />
            <ActionBtn label="Double" onClick={() => act("D")} disabled={!flags.canDouble} />
            <ActionBtn label="Split" onClick={() => act("P")} disabled={!flags.canSplit} />
            <ActionBtn label="Surr." onClick={() => act("R")} disabled={!flags.canSurrender} />
          </div>
        )}

        {(stage === "idle" || stage === "result") && (
          <button
            onClick={startHand}
            className="w-full py-3.5 rounded-full bg-yellow-500 text-emerald-950 font-bold text-base active:bg-yellow-400"
          >
            {stage === "idle" ? "Deal" : "Next Hand"}
          </button>
        )}
      </div>

      {chartOpen && <StrategyChart onClose={() => setChartOpen(false)} activeHint={buildHint()} />}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          showTotal={showTotal}
          onToggleShowTotal={setShowTotal}
        />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/5 rounded-lg py-2">
      <div className="text-base font-bold text-yellow-300 leading-none">{value}</div>
      <div className="text-[10px] text-emerald-200/50 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-3 rounded-xl text-xs font-semibold ${
        disabled ? "bg-white/5 text-white/25" : "bg-emerald-700 text-white active:bg-emerald-600"
      }`}
    >
      {label}
    </button>
  );
}

function ResultBadge({ result }) {
  const map = {
    win: ["Win", "text-emerald-300"],
    lose: ["Lose", "text-red-300"],
    push: ["Push", "text-yellow-200"],
    surrender: ["Surr.", "text-red-300"],
  };
  const [text, cls] = map[result] || ["", ""];
  return <span className={`font-semibold ${cls}`}>{text}</span>;
}
