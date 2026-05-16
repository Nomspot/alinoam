"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom"; // Import Portal

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  color?: string;
}

export default function EmojiPicker({ value, onChange, color = "#5a4a6a" } : EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  
  // Ref for the trigger button to calculate position
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Update position when opening
  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Calculate position relative to viewport
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setOpen(!open);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && 
          panelRef.current && !panelRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayEmojis = useMemo(() => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return ALL_EMOJIS.filter(e => (EMOJI_NAMES as any)[e]?.includes(q));
    }
    return (EMOJI_CATEGORIES as any)[tab]?.emojis ?? [];
  }, [search, tab]);

  const pick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  // ── Portal Content ──
  const pickerPanel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          style={{
            position: "fixed", // Use fixed to stay relative to viewport
            top: coords.top + 8,
            left: Math.min(coords.left, window.innerWidth - 330), // Prevent going off-screen right
            zIndex: 9999, // Above everything
            width: "90vw",
            maxWidth: 320,
            background: "#16101f",
            border: "1px solid rgba(212,168,83,0.22)",
            borderRadius: 18,
            boxShadow: "0 16px 60px rgba(0,0,0,0.8)",
            overflow: "hidden",
            direction: "rtl"
          }}
        >
          {/* Search Input */}
          <div style={{ padding: "12px 12px 8px" }}>
            <div style={{ position: "relative" }}>
              <input
                ref={searchRef}
                placeholder="חפש אמוג'י..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10, padding: "8px 34px 8px 10px",
                  color: "#f0e8d8", fontSize: 14, outline: "none",
                }}
              />
            </div>
          </div>

          {/* Categories */}
          {!search.trim() && (
            <div style={{ display: "flex", gap: 2, padding: "0 10px 8px", overflowX: "auto" }}>
              {Object.keys(EMOJI_CATEGORIES).map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: "5px 7px", borderRadius: 8, fontSize: 17, border: "none",
                    background: tab === key ? "rgba(212,168,83,0.18)" : "transparent",
                    cursor: "pointer"
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2, padding: "0 10px 12px", maxHeight: 200, overflowY: "auto"
          }}>
            {displayEmojis.map((emoji: string, i: number)  => (
              <button
                key={emoji + i}
                onClick={() => pick(emoji)}
                style={{
                  fontSize: 22, padding: "5px", borderRadius: 8, border: "none",
                  background: "transparent", cursor: "pointer", color: "#f0e8d8"
                }}
              >
                {emoji === "" ? "❌" : emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ fontSize: 10, color: color, marginBottom: 4, fontWeight: 700, letterSpacing: "0.1em" }}>
        אמוג&#39;י
      </div>
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 50, height: 50, borderRadius: 4, fontSize: 24,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(192,57,43,0.3)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {value || "🔥"}
      </motion.button>

      {/* Render the panel into the body so it's never cut off */}
      {typeof document !== "undefined" && createPortal(pickerPanel, document.body)}
    </div>
  );
}

const EMOJI_CATEGORIES = {
  "❤️": {
    label: "רומנטי",
    emojis: ["", "❤️", "🖤","💕","💖","💗","💘","💝","💞","🌹","🌷","💐","✨","💫","🌟","⭐","🕯️","💍","🥂","🫦","🎻","🎶","🌙","🌌","🌠","💌","🫀"],
  },
  "🍽️": {
    label: "אוכל",
    emojis: ["", "🍽️","🥂","🍷","🍸","🍹","🧆","🥗","🍣","🍜","🍕","🥩","🧁","🍰","🫕","🥘","🫙","🧇","🥞","🍳","🥐","🧀","🍫","🍬","🍦","🧃"],
  },
  "🏕️": {
    label: "הרפתקה",
    emojis: ["", "🏕️","🧗","🚣","🏄","🤿","🪂","🏇","🚵","🎯","🧭","⛺","🗺️","🌋","🏔️","🏞️","🌊","🛶","🎣","🏹","🥾","🪓","🔦","⛵","🛻","🚴"],
  },
  "🎭": {
    label: "תרבות",
    emojis: ["", "🎭","🎨","🖼️","🎬","🎤","🎸","🎹","🎺","🥁","📚","🖋️","🏛️","🎡","🎢","🎪","🎠","🃏","🎲","♟️","🎯","📸","🎥","🎞️","🎤","🎧", "🔴", "⚡", "🕶️", "🔇"],
  },
  "🛋️": {
    label: "נוח",
    emojis: ["", "🛋️","🛁","🧸","🕯️","☕","🍵","🫖","📖","🎮","🧩","🎲","🍿","🧦","🪴","🌿","🧘","💆","🛌","🧴","🕯️","🌙","⭐","🌛","🪵","🔥", "⛓️", "🚿", "🪞"],
  },
  "🌍": {
    label: "טיול",
    emojis: ["", "🌍","✈️","🚂","🛳️","🚡","🗼","🗽","🏰","🎡","🏖️","🏝️","⛩️","🕌","🌁","🌄","🌅","🌃","🌆","🌉","🎑","🏟️","🎆","🎇","🛺","🚁", "💦"],
  },
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flatMap(c => c.emojis);

const EMOJI_NAMES = {
  "": "ריק empty",
  "❤️": "heart love לב אהבה romantic",
  "💕": "hearts love לב אהבה",
  "💖": "heart sparkle לב",
  "💗": "heart growing לב",
  "💘": "heart arrow cupid לב חץ",
  "💝": "heart ribbon gift לב מתנה",
  "💞": "revolving hearts לב",
  "🌹": "rose flower פרח ורד",
  "🌷": "tulip flower פרח",
  "💐": "bouquet flowers זר פרחים",
  "✨": "sparkles stars ניצוצות כוכבים",
  "💫": "dizzy star כוכב",
  "🌟": "star כוכב",
  "⭐": "star כוכב",
  "🕯️": "candle נר",
  "💍": "ring טבעת",
  "🥂": "champagne wine יין שמפניה",
  "🫦": "lips שפתיים",
  "🎻": "violin כינור",
  "🎶": "music notes מוזיקה",
  "🌙": "moon ירח לילה",
  "🌌": "galaxy milky way גלקסיה",
  "🌠": "shooting star כוכב נופל",
  "💌": "love letter מכתב אהבה",
  "🫀": "heart organ לב",
  "🍽️": "plate food צלחת אוכל",
  "🍷": "wine יין",
  "🍸": "cocktail קוקטייל",
  "🍹": "tropical cocktail קוקטייל",
  "🧆": "falafel פלאפל",
  "🥗": "salad סלט",
  "🍣": "sushi סושי",
  "🍜": "noodles נודלס",
  "🍕": "pizza פיצה",
  "🥩": "steak meat בשר",
  "🧁": "cupcake עוגה",
  "🍰": "cake עוגה",
  "🫕": "pot food סיר אוכל",
  "🥘": "paella food מחבת",
  "🍫": "chocolate שוקולד",
  "🍦": "ice cream גלידה",
  "🏕️": "camping מחנאות",
  "🧗": "climbing טיפוס",
  "🚣": "kayak rowing קיאקים",
  "🏄": "surf גלישה",
  "🤿": "diving צלילה",
  "🪂": "parachute מצנח",
  "🚵": "mountain bike אופניים",
  "🧭": "compass מצפן",
  "⛺": "tent אוהל",
  "🗺️": "map מפה",
  "🌋": "volcano הר געש",
  "🏔️": "mountain הר",
  "🏞️": "park טבע",
  "🌊": "wave ocean גלים ים",
  "🎭": "theater תיאטרון",
  "🎨": "art ציור",
  "🖼️": "painting ציור",
  "🎬": "cinema סרט",
  "🎤": "microphone מיקרופון",
  "🎸": "guitar גיטרה",
  "🎹": "piano פסנתר",
  "📚": "books ספרים",
  "🏛️": "museum מוזאון",
  "🃏": "cards קלפים",
  "🎲": "dice משחק",
  "🛋️": "couch ספה",
  "🛁": "bath אמבט",
  "🧸": "teddy bear דובי",
  "☕": "coffee קפה",
  "🍵": "tea תה",
  "📖": "book ספר",
  "🎮": "games משחק",
  "🧩": "puzzle פאזל",
  "🍿": "popcorn פופקורן",
  "🪴": "plant plant צמח",
  "🌿": "leaf plant עלה צמח",
  "🧘": "yoga meditation מדיטציה",
  "🔥": "fire אש",
  "🌍": "world globe עולם",
  "✈️": "airplane flight טיסה",
  "🚂": "train רכבת",
  "🛳️": "ship ספינה",
  "🏖️": "beach חוף",
  "🏝️": "island אי",
  "🌄": "sunrise שחר",
  "🌅": "sunset שקיעה",
  "🌃": "night city לילה עיר",
  "🎆": "fireworks זיקוקים",
  "🖤": "black heart לב שחור",
  "⛓️": "chains שרשרת שרשראות",
  "💦": "splash water שפריץ מים",
  "🚿": "shower head ראש מקלחת",
  "🔴": "red circle עיגול אדום",
  "⚡": "lightning spark חשמל ברק",
  "🕶️": "sun glasses משקפי שמש",
  "🪞": "mirror מראה",
  "🔇": "mute sound רעש מושתק",
};