"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useOptions } from '../options';
import { useFirebaseLogic } from "../components/FirebaseLogic";
import ConfirmDialog from '../components/ConfirmDialog';
import confetti from 'canvas-confetti';
import EmojiPicker from "../components/EmojiPicker";


// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H  = 80;
const REPEATS = 40;

// ─── Default Categories ───────────────────────────────────────────────────────

const DEFAULT_INTIMACY_CATEGORIES = [
  { id: "power",     label: "שליטה",    color: "#c0392b", emoji: "⛓️" },
  { id: "sensation", label: "תחושות",   color: "#8e1a2e", emoji: "🔥" },
  { id: "roleplay",  label: "תפקידים",  color: "#6d1a1a", emoji: "🎭" },
  { id: "fetish",     label: "פטיש",     color: "#4a235a", emoji: "🖤" },
];

// Suggested acts to seed (empty — user fills their own list)
const DEFAULT_INTIMACY_ITEMS: Array<{
  title: string; emoji: string; category: string; description: string;
}> = [
  { title: "כבילות", emoji: "⛓️", category: "power", description: "קשירת ידיים או רגליים" },
  { title: "מחסום פה", emoji: "🔇", category: "power", description: "גאג" },
  { title: "מול מראה", emoji: "🪞", category: "sensation", description: "קשר עין דרך הראי" },
  { title: "נר שעווה", emoji: "🕯️", category: "sensation", description: "טפטוף שעווה חמה" },
  { title: "משחק תפקידים", emoji: "🎭", category: "roleplay", description: "" },
  { title: "יריקות", emoji: "💦", category: "fetish", description: "" },
  { title: "גולדן שאואר", emoji: "🚿", category: "fetish", description: "להשתין" },
  { title: "אנאלי", emoji: "🔴", category: "fetish", description: "" },
  { title: "אגרסיבי", emoji: "⚡", category: "power", description: "עוצמתי וחסר רחמים" },
  { title: "כיסוי עיניים", emoji: "🕶️", category: "sensation", description: "" },
];

const COLOR_PALETTE = [
  "#c0392b", "#8e1a2e", "#6d1a1a", "#3d0d0d",
  "#922b21", "#5d1010", "#b03a2e", "#784212",
  "#1a1a2e", "#2c3e50", "#4a235a", "#1b2631",
];

// ─── Chain texture SVG background ─────────────────────────────────────────────

const CHAIN_SVG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='15' cy='30' rx='10' ry='6' fill='none' stroke='rgba(192,57,43,0.06)' stroke-width='1.5'/%3E%3Cellipse cx='45' cy='30' rx='10' ry='6' fill='none' stroke='rgba(192,57,43,0.06)' stroke-width='1.5'/%3E%3Cline x1='25' y1='30' x2='35' y2='30' stroke='rgba(192,57,43,0.04)' stroke-width='1.5'/%3E%3C/svg%3E")`;

// ─── Ember particle canvas ────────────────────────────────────────────────────

function EmberField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const embers = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H + H,
      r: Math.random() * 2.2 + 0.4,
      alpha: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.9 + 0.3,
      drift: (Math.random() - 0.5) * 0.5,
      pulse: Math.random() * Math.PI * 2,
      // red, deep-red, or amber
      hue: Math.random() < 0.5 ? [192,57,43] : Math.random() < 0.6 ? [142,26,46] : [180,100,20],
    }));

    let frame = 0; let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); frame++;
      for (const e of embers) {
        const twinkle = Math.sin(frame * 0.03 + e.pulse) * 0.3;
        const [r,g,b] = e.hue;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, e.alpha + twinkle)})`;
        ctx.fill();
        e.y -= e.speed; e.x += e.drift;
        if (e.y < -8) { e.y = H + 8; e.x = Math.random() * W; }
        if (e.x < -4) e.x = W + 4;
        if (e.x > W + 4) e.x = -4;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", opacity:0.8 }} />;
}

// ─── Drum roll effect for spin ────────────────────────────────────────────────

function triggerDarkConfetti() {
  const cfg = {
    particleCount: 60, spread: 70, ticks: 180, gravity: 1.4, drift: 0.3,
    colors: ['#c0392b', '#8e1a2e', '#3d0d0d', '#f0e0d0', '#5d1010'],
  };
  confetti({ ...cfg, angle: 60,  origin: { x: 0, y: 1 } });
  confetti({ ...cfg, angle: 120, origin: { x: 1, y: 1 } });
  confetti({ ...cfg, particleCount: 90, startVelocity: 28, gravity: 0.5,
    angle: -90, spread: 200, origin: { x: 0.5, y: -0.1 } });
}

// ─── Small components ─────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"28px 0 18px" }}>
      <div style={{ flex:1, height:1, background:"linear-gradient(90deg, transparent, rgba(192,57,43,0.4))" }} />
      <span style={{ fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase",
        color:"rgba(192,57,43,0.6)", fontFamily:"'Bebas Neue', 'Oswald', sans-serif", fontWeight:400 }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:"linear-gradient(90deg, rgba(192,57,43,0.4), transparent)" }} />
    </div>
  );
}

function DangerBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
      padding:"3px 10px", borderRadius:2, fontWeight:700,
      background: color + "22", color, border:`1px solid ${color}55`,
      fontFamily:"'Bebas Neue', 'Oswald', sans-serif" }}>
      {label}
    </span>
  );
}

// ─── Category chips ───────────────────────────────────────────────────────────

function CategoryChips({ value, onChange, categories, size="md" }: {
  value: string; onChange: (k: string) => void;
  categories: Array<{ id: string; label: string; color: string; emoji?: string }>;
  size?: "sm" | "md";
}) {
  const all = [{ id:"all", label:"הכל", color:"#c0392b", emoji:"" }, ...categories];
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
      {all.map(({ id, label, color, emoji }) => {
        const active = value === id;
        return (
          <motion.button key={id} onClick={() => onChange(id)}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }}
            style={{ padding:size==="sm"?"3px 12px":"5px 15px", borderRadius:2,
              border:`1px solid ${active ? color : "rgba(192,57,43,0.2)"}`,
              background: active ? color+"18" : "transparent",
              color: active ? color : "rgba(180,120,100,0.55)",
              fontSize: size==="sm"?11:12, fontWeight:700, cursor:"pointer",
              transition:"all 0.15s", fontFamily:"'Oswald', 'Bebas Neue', sans-serif",
              letterSpacing:"0.1em", textTransform:"uppercase" }}>
            {emoji} {label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(5,3,3,0.93)",
        backdropFilter:"blur(8px)", display:"flex", alignItems:"center",
        justifyContent:"center", padding:20 }}>
      <motion.div initial={{ scaleY:0.8, opacity:0 }} animate={{ scaleY:1, opacity:1 }}
        exit={{ scaleY:0.8, opacity:0 }} transition={{ type:"spring", stiffness:280, damping:26 }}
        style={{ background:"#100808", border:"1px solid rgba(192,57,43,0.35)",
          borderRadius:4, padding:"32px 28px", width:"100%", maxWidth:420,
          boxShadow:"0 0 80px rgba(192,57,43,0.12), 0 32px 80px rgba(0,0,0,0.8)",
          position:"relative", overflow:"hidden" }}>
        {/* Corner accents */}
        {[["0","0"],["0","auto"],["auto","0"],["auto","auto"]].map(([t,b],i) => (
          <div key={i} style={{ position:"absolute",
            top:t==="0"?0:undefined, bottom:b==="auto"?0:undefined,
            left:i<2?0:undefined, right:i>=2?0:undefined,
            width:16, height:16,
            borderTop:t==="0"?"2px solid rgba(192,57,43,0.6)":undefined,
            borderBottom:b==="auto"?"2px solid rgba(192,57,43,0.6)":undefined,
            borderLeft:i<2?"2px solid rgba(192,57,43,0.6)":undefined,
            borderRight:i>=2?"2px solid rgba(192,57,43,0.6)":undefined }} />
        ))}
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily:"'Bebas Neue', 'Oswald', sans-serif",
      fontSize:30, fontWeight:400, letterSpacing:"0.12em", textTransform:"uppercase",
      color:"#f0d8d0", marginBottom:24, textAlign:"center",
      textShadow:"0 0 40px rgba(192,57,43,0.4)" }}>
      {children}
    </h3>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, disabled=false }: {
  onCancel:()=>void; onConfirm:()=>void; confirmLabel:string; disabled?:boolean;
}) {
  return (
    <div style={{ display:"flex", gap:10, marginTop:4 }}>
      <motion.button whileTap={{ scale:0.95 }} onClick={onCancel}
        style={{ flex:1, padding:"12px", borderRadius:2, border:"1px solid rgba(255,255,255,0.08)",
          background:"transparent", color:"rgba(180,120,100,0.5)", fontSize:14, cursor:"pointer",
          fontFamily:"'Oswald', sans-serif", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        ביטול
      </motion.button>
      <motion.button onClick={onConfirm} disabled={disabled}
        whileHover={!disabled?{ boxShadow:"0 0 24px rgba(192,57,43,0.5)" }:{}}
        whileTap={!disabled?{ scale:0.97 }:{}}
        style={{ flex:2, padding:"12px", borderRadius:2, border:"1px solid rgba(192,57,43,0.5)",
          background:disabled?"rgba(192,57,43,0.08)":"linear-gradient(135deg, #7a1010, #c0392b)",
          color:disabled?"#5a2020":"#f0d8d0", fontSize:14, fontWeight:700,
          cursor:disabled?"not-allowed":"pointer",
          fontFamily:"'Oswald', sans-serif", letterSpacing:"0.1em", textTransform:"uppercase",
          transition:"all 0.2s" }}>
        {confirmLabel}
      </motion.button>
    </div>
  );
}

function DarkInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input style={{ width:"100%", background:"rgba(255,255,255,0.03)",
      border:"1px solid rgba(192,57,43,0.2)", borderRadius:2, padding:"10px 14px",
      color:"#f0d8d0", fontSize:14, transition:"border-color 0.2s",
      fontFamily:"inherit", outline:"none", letterSpacing:"0.04em", ...style }}
      onFocus={e => (e.target.style.borderColor = "rgba(192,57,43,0.7)")}
      onBlur={e  => (e.target.style.borderColor = "rgba(192,57,43,0.2)")}
      {...props} />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase",
      color:"rgba(192,57,43,0.65)", marginBottom:6, fontWeight:700,
      fontFamily:"'Oswald', 'Bebas Neue', sans-serif" }}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KinkPage() {
  const router   = useRouter();
  const controls = useAnimation();
  const { hebrew_font } = useOptions();
  const wheelRef   = useRef<HTMLDivElement>(null);
  const resultRef  = useRef<HTMLDivElement>(null);

  const {
    authLoading, currentUser,
    intimacyItems, activatedIntimacyItems, intimacyCategories,
    intimacyLoading, seedIntimacyIfEmpty,
    addIntimacyItem, deleteIntimacyItem, updateIntimacyItem,
    setIntimacyItemCompleted, addIntimacyCategory, deleteIntimacyCategory,
  } = useFirebaseLogic();

  // ── UI state ───────────────────────────────────────────────────────────────

  const [tab,          setTab]         = useState<"roulette"|"vault">("roulette");
  const [spinning,     setSpinning]    = useState(false);
  const [selected,     setSelected]    = useState<typeof activatedIntimacyItems[0] | null>(null);
  const [showResult,   setShowResult]  = useState(false);
  const [spinFilter,   setSpinFilter]  = useState("all");
  const [listFilter,   setListFilter]  = useState("all");
  const [done,         setDone]        = useState(false);

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showCatModal,  setShowCatModal]  = useState(false);
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [editingItem,   setEditingItem]   = useState<typeof intimacyItems[0] | null>(null);
  const [editForm,      setEditForm]      = useState({ title:"", emoji:"", category:"", description:"" });

  const [newItem,     setNewItem]     = useState({ title:"", emoji:"🔥", category:"power", description:"" });
  const [newCat,      setNewCat]      = useState({ label:"", color:COLOR_PALETTE[0], emoji:"" });

  const [delItemId,   setDelItemId]   = useState("");
  const [delItemName, setDelItemName] = useState("");
  const [delCatId,    setDelCatId]    = useState("");
  const [delCatName,  setDelCatName]  = useState("");
  const [showDelItem, setShowDelItem] = useState(false);
  const [showDelCat,  setShowDelCat]  = useState(false);

  // ── Seed ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading) seedIntimacyIfEmpty(DEFAULT_INTIMACY_CATEGORIES, DEFAULT_INTIMACY_ITEMS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const catMap      = Object.fromEntries(intimacyCategories.map(c => [c.id, c]));
  const getCat      = (id: string) => catMap[id] ?? { label:id, color:"#5d1010", emoji:"" };

  const spinItems   = spinFilter === "all" ? activatedIntimacyItems : activatedIntimacyItems.filter(d => d.category === spinFilter);
  const listItems   = listFilter === "all" ? intimacyItems          : intimacyItems.filter(d => d.category === listFilter);
  const reelItems   = Array(REPEATS).fill(null).flatMap(() => spinItems);

  useEffect(() => {
    controls.set({ y:0 }); setShowResult(false); setSelected(null);
  }, [spinFilter, controls]);

  // ── Spin ──────────────────────────────────────────────────────────────────

  const spin = useCallback(async () => {
    if (spinning || spinItems.length < 2) return;
    setDone(false); setSpinning(true); setShowResult(false); setSelected(null);
    const idx      = Math.floor(Math.random() * spinItems.length);
    const finalIdx = 10 * spinItems.length + idx;
    const finalY   = ITEM_H * (1 - finalIdx);

    setTimeout(() => {
      if (wheelRef.current) {
        const top = wheelRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top - window.innerHeight * 0.28, behavior:'smooth' });
      }
    }, 10);

    await controls.set({ y:0 });
    await controls.start({ y:finalY, transition:{ duration:4.8, ease:[0.45,0.02,0.15,1.1] } });

    setTimeout(() => { setSelected(spinItems[idx]); setShowResult(true); }, 50);
    setTimeout(() => {
      //triggerDarkConfetti();
      resultRef.current?.scrollIntoView({ behavior:'smooth', inline:'nearest' });
    }, 250);
    setSpinning(false);
  }, [spinning, spinItems, controls]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;
    const ok = await addIntimacyItem(newItem);
    if (ok) { setNewItem({ title:"", emoji:"🔥", category:intimacyCategories[0]?.id ?? "power", description:"" }); setShowAddModal(false); }
  };

  const handleAddCat = async () => {
    if (!newCat.label.trim()) return;
    setCatSubmitting(true);
    await addIntimacyCategory({ label:newCat.label, color:newCat.color, emoji:newCat.emoji });
    setNewCat({ label:"", color:COLOR_PALETTE[0], emoji:"" });
    setCatSubmitting(false);
  };

  const openEdit = (item: typeof intimacyItems[0]) => {
    setEditingItem(item);
    setEditForm({ title:item.title, emoji:item.emoji||"🔥", category:item.category, description:item.description||"" });
  };

  const handleUpdate = async () => {
    if (!editingItem || !editForm.title.trim()) return;
    const ok = await updateIntimacyItem(editingItem.id, editForm);
    if (ok) setEditingItem(null);
  };

  const markDone = async () => {
    if (!selected) return;
    await setIntimacyItemCompleted(selected.id, true);
    setDone(true);
  };

  // ── Auth guards ───────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div dir="rtl" className={`flex items-center justify-center min-h-screen ${hebrew_font.className}`}
        style={{ background:"#050303" }}>
        <motion.p animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:2, repeat:Infinity }}
          style={{ color:"#c0392b", fontSize:16, letterSpacing:"0.2em",
            fontFamily:"'Oswald', sans-serif", textTransform:"uppercase" }}>
          ■ טוען ■
        </motion.p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div dir="rtl" className={`flex items-center justify-center min-h-screen ${hebrew_font.className}`}
        style={{ background:"#050303" }}>
        <p style={{ color:"#f0d8d0", fontSize:18, fontFamily:"'Oswald', sans-serif",
          letterSpacing:"0.08em" }}>
          גישה אסורה — יש להתחבר
        </p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className={hebrew_font.className} style={{ position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #050303 !important; }
        select option { background: #100808; color: #f0d8d0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #3d0d0d; border-radius: 1px; }
        ::-webkit-scrollbar-track { background: #050303; }
      `}</style>

      {/* ── Background layers ── */}
      <div style={{ position:"fixed", inset:0, zIndex:0,
        background:"radial-gradient(ellipse 100% 60% at 50% 100%, #1a0505 0%, #050303 55%)" }} />
      {/* Chain texture overlay */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:CHAIN_SVG, backgroundSize:"60px 60px", opacity:0.8 }} />
      <EmberField />
      {/* Grain */}
      <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
        opacity:0.6 }} />
      {/* Red vignette bottom */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:"35vh", zIndex:0, pointerEvents:"none",
        background:"linear-gradient(0deg, rgba(80,5,5,0.25) 0%, transparent 100%)" }} />

      <div dir="rtl" style={{ minHeight:"100vh", position:"relative", zIndex:10, padding:"0 16px 100px" }}>

        {/* ── Home button ── */}
        <motion.button onClick={() => router.push("/")} className="fixed top-6 right-6"
          style={{ background:"rgba(20,5,5,0.7)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(192,57,43,0.3)", borderRadius:2, padding:13, zIndex:50 }}
          whileHover={{ scale:1.06, borderColor:"rgba(192,57,43,0.7)", boxShadow:"0 0 20px rgba(192,57,43,0.25)" }}
          whileTap={{ scale:0.95 }}>
          <Image className="invert" src="/home_icon.svg" width="26" height="26" alt="Back" />
        </motion.button>

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-30 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.9, ease:"easeOut" }}
          style={{ textAlign:"center", paddingTop:56, paddingBottom:24 }}>

          {/* Top label */}
          <motion.div initial={{ opacity:0, letterSpacing:"0.5em" }}
            animate={{ opacity:1, letterSpacing:"0.3em" }} transition={{ delay:0.3, duration:1 }}
            style={{ fontSize:10, color:"rgba(192,57,43,0.7)", letterSpacing:"0.3em",
              textTransform:"uppercase", marginBottom:14,
              fontFamily:"'Oswald', sans-serif", fontWeight:700 }}>
            ████  כספת סודית  ████
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
                fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                fontSize: "clamp(52px, 14vw, 100px)",
                fontWeight: 800,
                letterSpacing: "0.08em",
                margin: 0,
                textTransform: "uppercase",
                lineHeight: 0.95,
                // Gradient Logic
                background: "linear-gradient(to bottom, #aa4d4d 0%, #a70000 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                // Filter instead of textShadow for better gradient compatibility
                filter: "drop-shadow(0 0 30px rgba(192,57,43,0.4)) drop-shadow(0 4px 10px rgba(0,0,0,0.8))",
            }}
            >
            גלגל הקינקים
            </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6, duration:0.8 }}
            style={{ marginTop:10, fontFamily:"'Playfair Display', serif",
              fontSize:15, color:"rgba(180,100,90,0.7)", letterSpacing:"0.06em", fontWeight:900 }}>
            פנטזיות, סקס, וכל מה שביניהם
          </motion.p>

          {/* Divider */}
          <motion.div initial={{ scaleX:0, opacity:0 }} animate={{ scaleX:1, opacity:1 }}
            transition={{ delay:0.5, duration:1, ease:"easeOut" }}
            style={{ margin:"18px auto 0", width:200, height:1, position:"relative" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg, transparent, #c0392b, #8e1a2e, #c0392b, transparent)" }} />
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
              width:6, height:6, borderRadius:0, background:"#c0392b", rotate:"45deg" }} />
          </motion.div>
        </motion.div>

        {/* ── Tab Bar ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35, duration:0.6 }}
          style={{ display:"flex", gap:0, maxWidth:380, margin:"0 auto 44px",
            border:"1px solid rgba(192,57,43,0.3)", borderRadius:2, overflow:"hidden" }}>
          {([
            { id:"roulette", label:"🎲  רולטה" },
            { id:"vault",    label:"🗄️  הכספת" },
          ] as const).map(({ id, label }) => (
            <motion.button key={id} onClick={() => setTab(id)} whileTap={{ scale:0.97 }}
              style={{ flex:1, padding:"12px 16px", border:"none", cursor:"pointer",
                fontSize:13, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase",
                fontFamily:"'Oswald', sans-serif", transition:"all 0.2s",
                background:tab===id
                  ?"linear-gradient(135deg, #5d1010, #c0392b)"
                  :"rgba(20,5,5,0.6)",
                color:tab===id?"#f0d8d0":"rgba(180,100,90,0.45)",
                borderRight:id==="roulette"?"1px solid rgba(192,57,43,0.3)":"none" }}>
              {label}
            </motion.button>
          ))}
        </motion.div>

        {intimacyLoading && (
          <motion.div animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.4, repeat:Infinity }}
            style={{ textAlign:"center", padding:"14px 0", color:"rgba(192,57,43,0.5)",
              fontSize:12, letterSpacing:"0.2em", fontFamily:"'Oswald', sans-serif",
              textTransform:"uppercase" }}>
            ■ ■ ■
          </motion.div>
        )}

        <div style={{ maxWidth:500, margin:"0 auto" }}>
          <AnimatePresence mode="wait">

            {/* ════ ROULETTE TAB ════ */}
            {tab === "roulette" && (
              <motion.div key="roulette" ref={wheelRef}
                initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:24 }} transition={{ duration:0.3 }}>

                <div style={{ marginBottom:26 }}>
                  <CategoryChips value={spinFilter} onChange={setSpinFilter}
                    categories={intimacyCategories} />
                </div>

                {/* ── Reel drum ── */}
                <div style={{ position:"relative", marginBottom:30,
                  border:"1px solid rgba(192,57,43,0.35)", borderRadius:2,
                  background:"#0a0404",
                  boxShadow:"0 0 60px rgba(192,57,43,0.08), inset 0 0 40px rgba(0,0,0,0.6)" }}>

                  {/* Scanline overlay */}
                  <div style={{ position:"absolute", inset:0, zIndex:4, pointerEvents:"none", borderRadius:2,
                    backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)" }} />

                  {/* Side glow strips */}
                  {(["left","right"] as const).map(side => (
                    <div key={side} style={{ position:"absolute", [side]:0, top:0, bottom:0, width:32, zIndex:3, pointerEvents:"none",
                      background:`linear-gradient(${side==="left"?"90":"270"}deg, rgba(192,57,43,0.1) 0%, transparent 100%)` }} />
                  ))}

                  {/* Highlight row */}
                  <div style={{ position:"absolute", top:ITEM_H, left:0, right:0, height:ITEM_H, zIndex:2, pointerEvents:"none",
                    background:"rgba(192,57,43,0.06)",
                    borderTop:"1px solid rgba(192,57,43,0.3)",
                    borderBottom:"1px solid rgba(192,57,43,0.3)" }} />

                  {/* Top/bottom fades */}
                  {(["top","bottom"] as const).map(pos => (
                    <div key={pos} style={{ position:"absolute", [pos]:0, left:0, right:0,
                      height:ITEM_H*1.3, zIndex:3, pointerEvents:"none",
                      background:`linear-gradient(${pos==="top"?"180":"0"}deg, #0a0404 0%, transparent 100%)` }} />
                  ))}

                  <div style={{ height:ITEM_H*3, overflow:"hidden", position:"relative" }}>
                    {spinItems.length === 0 ? (
                      <div style={{ height:ITEM_H*3, display:"flex", alignItems:"center",
                        justifyContent:"center", color:"rgba(192,57,43,0.4)",
                        fontFamily:"'Oswald', sans-serif", letterSpacing:"0.2em",
                        textTransform:"uppercase", fontSize:13 }}>
                        אין פריטים בקטגוריה זו
                      </div>
                    ) : (
                      <motion.div animate={controls}>
                        {reelItems.map((item, i) => (
                          <div key={i} style={{ height:ITEM_H, display:"flex", alignItems:"center",
                            justifyContent:"center", gap:16, padding:"0 48px" }}>
                            <span style={{ fontSize:22, flexShrink:0 }}>{item.emoji}</span>
                            <span style={{ fontFamily:"'Oswald', sans-serif",
                              fontSize:24, fontWeight:500, letterSpacing:"0.08em",
                              textTransform:"uppercase", color:"#f0d8d0",
                              textAlign:"center", lineHeight:1.15 }}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* ── Spin button ── */}
                <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
                  <motion.button onClick={spin} disabled={spinning || spinItems.length < 2}
                    whileHover={!spinning ? {
                      scale:1.04, boxShadow:"0 0 50px rgba(192,57,43,0.55), 0 10px 40px rgba(0,0,0,0.5)"
                    } : {}}
                    whileTap={!spinning ? { scale:0.97 } : {}}
                    style={{ position:"relative", overflow:"hidden",
                      background:spinning
                        ?"rgba(192,57,43,0.08)"
                        :"linear-gradient(135deg, #3d0d0d 0%, #922b21 50%, #c0392b 100%)",
                      border:`1px solid ${spinning?"rgba(192,57,43,0.2)":"rgba(192,57,43,0.6)"}`,
                      color:spinning?"rgba(192,57,43,0.4)":"#f0d8d0",
                      padding:"18px 58px", borderRadius:2, cursor:spinning?"not-allowed":"pointer",
                      fontFamily:"'Bebas Neue', 'Oswald', sans-serif",
                      fontSize:18, letterSpacing:"0.2em", textTransform:"uppercase",
                      boxShadow:spinning?"none":"0 4px 30px rgba(192,57,43,0.3)", fontWeight:700,
                      transition:"all 0.3s" }}>
                    {!spinning && (
                      <motion.div animate={{ x:["120%","-120%"] }} transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
                        style={{ position:"absolute", inset:0, background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)" }} />
                    )}
                    {spinning ? "■ מסתובב ■" : "סובב את הגלגל"}
                  </motion.button>
                </div>

                {/* ── Result card ── */}
                <AnimatePresence>
                  {showResult && selected && (
                    <motion.div ref={resultRef}
                      initial={{ opacity:0, y:30, scaleY:0.85 }}
                      animate={{ opacity:1, y:0, scaleY:1 }}
                      exit={{ opacity:0, y:-20 }}
                      transition={{ type:"spring", stiffness:200, damping:22 }}
                      style={{ position:"relative", background:"#0d0505",
                        border:"1px solid rgba(192,57,43,0.4)", borderRadius:2, padding:"34px 28px",
                        textAlign:"center", boxShadow:"0 0 80px rgba(192,57,43,0.12), 0 20px 60px rgba(0,0,0,0.7)" }}>

                      {/* Corner accents */}
                      {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i) => (
                        <div key={i} style={{ position:"absolute", width:20, height:20, ...pos,
                          borderTop:   (pos.top===0)   ?"2px solid #c0392b":undefined,
                          borderBottom:(pos.bottom===0)?"2px solid #c0392b":undefined,
                          borderLeft:  (pos.left===0)  ?"2px solid #c0392b":undefined,
                          borderRight: (pos.right===0) ?"2px solid #c0392b":undefined }} />
                      ))}

                      <motion.div animate={{ scale:[1,1.15,1] }} transition={{ duration:0.5 }}
                        style={{ fontSize:44, marginBottom:14, display:"inline-block" }}>
                        {selected.emoji}
                      </motion.div>

                      <div style={{ fontSize:10, letterSpacing:"0.3em", textTransform:"uppercase",
                        color:"rgba(192,57,43,0.7)", marginBottom:10,
                        fontFamily:"'Oswald', sans-serif" }}>
                        נבחר
                      </div>

                      <h3 style={{ fontFamily:"'Bebas Neue', 'Oswald', sans-serif",
                        fontSize:"clamp(28px,8vw,44px)", fontWeight:400,
                        letterSpacing:"0.1em", textTransform:"uppercase",
                        color:"#f0d8d0", marginBottom:10, lineHeight:1,
                        textShadow:"0 0 40px rgba(192,57,43,0.5)" }}>
                        {selected.title}
                      </h3>

                      {selected.description && (
                        <p style={{ fontFamily:"'Playfair Display', serif", fontStyle:"italic",
                          color:"rgba(180,100,90,0.7)", fontSize:15, lineHeight:1.6, marginBottom:20 }}>
                          {selected.description}
                        </p>
                      )}

                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        gap:10, flexWrap:"wrap" }}>
                        <DangerBadge label={`${getCat(selected.category).emoji || ""} ${getCat(selected.category).label}`}
                          color={getCat(selected.category).color || "#c0392b"} />
                        <motion.button onClick={markDone}
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          style={{ padding:"5px 16px", borderRadius:2, fontSize:11, fontWeight:700,
                            letterSpacing:"0.12em", textTransform:"uppercase",
                            fontFamily:"'Oswald', sans-serif",
                            border:"1px solid",
                            borderColor:done?"rgba(96,200,150,0.4)":"rgba(192,57,43,0.3)",
                            background:done?"rgba(96,200,150,0.1)":"rgba(192,57,43,0.08)",
                            color:done?"#60c896":"rgba(192,57,43,0.6)",
                            cursor:"pointer", transition:"all 0.2s" }}>
                          {done ? "✓ בוצע" : "סמן כבוצע"}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ════ VAULT (LIST) TAB ════ */}
            {tab === "vault" && (
              <motion.div key="vault"
                initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-24 }} transition={{ duration:0.3 }}>

                {/* Controls */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  marginBottom:22, gap:10 }}>
                  <span style={{ color:"rgba(192,57,43,0.45)", fontSize:11,
                    fontFamily:"'Oswald', sans-serif", letterSpacing:"0.15em", textTransform:"uppercase" }}>
                    {listItems.length} פריטים
                  </span>
                  <div style={{ display:"flex", gap:8 }}>
                    <motion.button onClick={() => setShowCatModal(true)}
                      whileHover={{ scale:1.04, borderColor:"rgba(192,57,43,0.5)" }} whileTap={{ scale:0.96 }}
                      style={{ background:"rgba(20,5,5,0.7)", border:"1px solid rgba(192,57,43,0.25)",
                        color:"rgba(180,100,90,0.6)", padding:"9px 16px", borderRadius:2, fontSize:11,
                        fontWeight:600, cursor:"pointer", fontFamily:"'Oswald', sans-serif",
                        letterSpacing:"0.12em", textTransform:"uppercase", transition:"border-color 0.2s" }}>
                      ⛓️ קטגוריות
                    </motion.button>
                    <motion.button onClick={() => setShowAddModal(true)}
                      whileHover={{ scale:1.04, boxShadow:"0 0 24px rgba(192,57,43,0.4)" }} whileTap={{ scale:0.96 }}
                      style={{ background:"linear-gradient(135deg, #5d1010, #c0392b)",
                        border:"1px solid rgba(192,57,43,0.5)", color:"#f0d8d0",
                        padding:"9px 20px", borderRadius:2, fontSize:12, fontWeight:700,
                        cursor:"pointer", fontFamily:"'Oswald', sans-serif",
                        letterSpacing:"0.12em", textTransform:"uppercase",
                        boxShadow:"0 4px 20px rgba(192,57,43,0.22)" }}>
                      + הוסף
                    </motion.button>
                  </div>
                </div>

                <div style={{ marginBottom:22 }}>
                  <CategoryChips value={listFilter} onChange={setListFilter}
                    categories={intimacyCategories} size="sm" />
                </div>

                {/* Item list */}
                <motion.div style={{ display:"flex", flexDirection:"column", gap:8 }} layout>
                  <AnimatePresence>
                    {listItems.length === 0 && !intimacyLoading && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                        style={{ textAlign:"center", padding:"52px 0",
                          fontFamily:"'Bebas Neue', 'Oswald', sans-serif",
                          fontSize:22, letterSpacing:"0.15em", textTransform:"uppercase",
                          color:"rgba(192,57,43,0.25)" }}>
                        הכספת ריקה
                      </motion.div>
                    )}

                    {listItems.map((item, i) => (
                      <motion.div key={item.id} layout
                        initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                        exit={{ opacity:0, x:-40 }} transition={{ delay:i*0.035, duration:0.2 }}>
                        <motion.div onClick={() => openEdit(item)}
                          whileHover={{ borderColor:"rgba(192,57,43,0.45)", background:"rgba(20,5,5,0.9)" }}
                          style={{ background:"rgba(15,4,4,0.6)",
                            border:"1px solid rgba(192,57,43,0.18)", borderRadius:2,
                            padding:"12px 14px", display:"flex", alignItems:"center", gap:12,
                            cursor:"pointer", transition:"background 0.18s, border-color 0.18s",
                            position:"relative", overflow:"hidden" }}>

                          {/* Left accent bar */}
                          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2,
                            background:getCat(item.category).color || "#c0392b", opacity:0.7 }} />

                          <span style={{ fontSize:22, flexShrink:0, paddingRight:6 }}>{item.emoji}</span>

                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Oswald', sans-serif", fontSize:17,
                              fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                              color: item.completed ? "rgba(180,100,90,0.35)" : "#f0d8d0",
                              textDecoration: item.completed ? "line-through" : "none",
                              lineHeight:1.2, marginBottom:2 }}>
                              {item.title}
                            </div>
                            {item.description && (
                              <div style={{ fontSize:13, color:"rgba(255,130,110,0.7)",
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                                fontWeight:400 }}>
                                {item.description}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:7, flexShrink:0 }}
                            onClick={e => e.stopPropagation()}>
                            <DangerBadge label={getCat(item.category).label}
                              color={getCat(item.category).color || "#c0392b"} />
                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                              <motion.button
                                onClick={() => setIntimacyItemCompleted(item.id, !item.completed)}
                                whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
                                style={{ background:item.completed?"rgba(96,200,150,0.1)":"rgba(192,57,43,0.06)",
                                  border:"1px solid", borderColor:item.completed?"rgba(96,200,150,0.4)":"rgba(192,57,43,0.25)",
                                  color:item.completed?"#64ffb4":"rgba(192,57,43,0.4)",
                                  borderRadius:2, width:26, height:26,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  cursor:"pointer", fontSize:13, transition:"all 0.18s",
                                  fontFamily:"'Oswald', sans-serif" }}>
                                {item.completed ? "✓" : "○"}
                              </motion.button>
                              <motion.button
                                onClick={() => { setShowDelItem(true); setDelItemId(item.id); setDelItemName(item.title); }}
                                whileHover={{ scale:1.12, color:"#c0392b" }} whileTap={{ scale:0.9 }}
                                style={{ background:"rgba(192,57,43,0.06)", border:"1px solid rgba(192,57,43,0.2)",
                                  color:"rgba(192,57,43,0.35)", borderRadius:2, width:26, height:26,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  cursor:"pointer", fontSize:15, transition:"color 0.15s",
                                  fontFamily:"monospace" }}>
                                ×
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ Confirm Dialogs ═══ */}
        <ConfirmDialog isOpen={showDelItem} title="מחיקה מהכספת"
          message={`למחוק את : ${delItemName}?`}
          confirmText="מחק" cancelText="ביטול" isDangerous
          onConfirm={() => { if (delItemId) deleteIntimacyItem(delItemId); setShowDelItem(false); }}
          onCancel={() => { setDelItemId(""); setDelItemName(""); setShowDelItem(false); }} />
        <ConfirmDialog isOpen={showDelCat} title="מחיקת קטגוריה"
          message={`למחוק את הקטגוריה : ${delCatName}?`}
          confirmText="מחק" cancelText="ביטול" isDangerous
          onConfirm={() => { if (delCatId) deleteIntimacyCategory(delCatId); setShowDelCat(false); }}
          onCancel={() => { setDelCatId(""); setDelCatName(""); setShowDelCat(false); }} />

        {/* ═══ Add Item Modal ═══ */}
        <AnimatePresence>
          {showAddModal && (
            <Modal onClose={() => setShowAddModal(false)}>
              <ModalTitle>הוסף לכספת</ModalTitle>
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                <div>
                  <EmojiPicker color="rgba(192,57,43,0.65)" value={newItem.emoji} onChange={emoji => setNewItem(p => ({ ...p, emoji }))} />
                </div>
                <div style={{ flex:1 }}>
                  <FieldLabel>שם הפעולה</FieldLabel>
                  <DarkInput placeholder="לדוגמא: כבילות" value={newItem.title}
                    onChange={e => setNewItem(p => ({...p, title:e.target.value}))} />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <FieldLabel>תיאור (אופציונלי)</FieldLabel>
                <DarkInput placeholder="פרטים נוספים..." value={newItem.description}
                  onChange={e => setNewItem(p => ({...p, description:e.target.value}))} />
              </div>
              <div style={{ marginBottom:24 }}>
                <FieldLabel>קטגוריה</FieldLabel>
                <select value={newItem.category} onChange={e => setNewItem(p => ({...p, category:e.target.value}))}
                  style={{ width:"100%", background:"rgba(10,4,4,0.9)", border:"1px solid rgba(192,57,43,0.25)",
                    borderRadius:2, padding:"10px 14px", color:"#f0d8d0", fontSize:14,
                    cursor:"pointer", fontFamily:"'Oswald', sans-serif", letterSpacing:"0.06em" }}>
                  {intimacyCategories.map(({id,label}) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <ModalActions onCancel={() => setShowAddModal(false)} onConfirm={handleAddItem} confirmLabel="הוסף לכספת" />
            </Modal>
          )}
        </AnimatePresence>

        {/* ═══ Edit Item Modal ═══ */}
        <AnimatePresence>
          {editingItem && (
            <Modal onClose={() => setEditingItem(null)}>
              <ModalTitle>עריכה</ModalTitle>
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                <div>
                  <EmojiPicker color="rgba(192,57,43,0.65)" value={editForm.emoji} onChange={emoji => setEditForm(p => ({ ...p, emoji }))} />
                </div>
                <div style={{ flex:1 }}>
                  <FieldLabel>שם הפעולה</FieldLabel>
                  <DarkInput value={editForm.title} onChange={e => setEditForm(p => ({...p, title:e.target.value}))} />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <FieldLabel>תיאור</FieldLabel>
                <DarkInput value={editForm.description} onChange={e => setEditForm(p => ({...p, description:e.target.value}))} />
              </div>
              <div style={{ marginBottom:24 }}>
                <FieldLabel>קטגוריה</FieldLabel>
                <select value={editForm.category} onChange={e => setEditForm(p => ({...p, category:e.target.value}))}
                  style={{ width:"100%", background:"rgba(10,4,4,0.9)", border:"1px solid rgba(192,57,43,0.25)",
                    borderRadius:2, padding:"10px 14px", color:"#f0d8d0", fontSize:14,
                    cursor:"pointer", fontFamily:"'Oswald', sans-serif", letterSpacing:"0.06em" }}>
                  {intimacyCategories.map(({id,label}) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <ModalActions onCancel={() => setEditingItem(null)} onConfirm={handleUpdate} confirmLabel="שמור" />
            </Modal>
          )}
        </AnimatePresence>

        {/* ═══ Categories Modal ═══ */}
        <AnimatePresence>
          {showCatModal && (
            <Modal onClose={() => setShowCatModal(false)}>
              <ModalTitle>קטגוריות</ModalTitle>

              {intimacyCategories.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>קיימות</FieldLabel>
                  <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:8 }}>
                    {intimacyCategories.map(cat => (
                      <div key={cat.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        background:"rgba(192,57,43,0.04)", border:"1px solid rgba(192,57,43,0.15)",
                        borderRadius:2, padding:"8px 12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:10, height:10, borderRadius:0, rotate:"45deg",
                            background:cat.color, flexShrink:0 }} />
                          <span style={{ fontFamily:"'Oswald', sans-serif", fontSize:13,
                            letterSpacing:"0.1em", textTransform:"uppercase", color:"#f0d8d0" }}>
                            {cat.emoji} {cat.label}
                          </span>
                        </div>
                        <motion.button
                          onClick={() => { setShowDelCat(true); setDelCatId(cat.id); setDelCatName(cat.label); }}
                          whileHover={{ color:"#c0392b" }} whileTap={{ scale:0.9 }}
                          style={{ background:"transparent", border:"none", color:"rgba(192,57,43,0.3)",
                            cursor:"pointer", fontSize:20, lineHeight:1, transition:"color 0.15s" }}>
                          ×
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SectionDivider label="קטגוריה חדשה" />

              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div>
                  <EmojiPicker color="rgba(192,57,43,0.65)" value={newCat.emoji} onChange={emoji => setNewCat(p => ({ ...p, emoji }))} />
                </div>
                <div style={{ flex:1 }}>
                  <FieldLabel>שם</FieldLabel>
                  <DarkInput placeholder="לדוגמא: ספונטני" value={newCat.label}
                    onChange={e => setNewCat(p => ({...p, label:e.target.value}))} />
                </div>
              </div>

              <div style={{ marginBottom:22 }}>
                <FieldLabel>צבע</FieldLabel>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                  {COLOR_PALETTE.map(color => (
                    <motion.button key={color} onClick={() => setNewCat(p => ({...p, color}))}
                      whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}
                      style={{ width:26, height:26, borderRadius:0, rotate:"0deg",
                        background:color, border:"none", cursor:"pointer",
                        outline:newCat.color===color?`2px solid ${color}`:"2px solid transparent",
                        outlineOffset:3, transition:"outline 0.12s", transform:newCat.color===color?"rotate(45deg)":"none" }} />
                  ))}
                </div>
              </div>

              <ModalActions onCancel={() => setShowCatModal(false)}
                onConfirm={handleAddCat} confirmLabel={catSubmitting?"...":"הוסף קטגוריה"} disabled={catSubmitting} />
            </Modal>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}