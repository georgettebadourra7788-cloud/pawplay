import React, { useState, useRef, useEffect } from "react";
import {
  Home, Shirt, Music2, Heart, Thermometer, Bandage, Pill,
  Sparkles, ChevronLeft, PartyPopper, Volume2, Camera, X
} from "lucide-react";
import { loadPetState, savePetState, DEFAULT_STATE } from "./lib/petStore";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import leoImage from "./assets/leo.jpg";
import lionSound from "./assets/sounds/lion.mp3";
import elephantSound from "./assets/sounds/elephant.mp3";
import duckSound from "./assets/sounds/duck.ogg";
import cowSound from "./assets/sounds/cow.mp3";
import frogSound from "./assets/sounds/frog.mp3";
import monkeySound from "./assets/sounds/monkey.mp3";

// ---- Design tokens (matches Stitch: seed #FFD93D yellow, pink secondary, green accent) ----
const YELLOW = "#FFD93D";
const YELLOW_DARK = "#F5B800";
const PINK = "#FF6FA5";
const GREEN = "#5FCB8C";
const CREAM = "#FFFBF0";

const ANIMALS = [
  { id: "dog", name: "Dog", emoji: "🐶", color: "#FFDFB8", note: "Barks joyfully", image: leoImage },
  { id: "lion", name: "Lion", emoji: "🦁", color: "#FFE8A3", note: "Roars proudly", sound: lionSound },
  { id: "elephant", name: "Elephant", emoji: "🐘", color: "#CDEBFB", note: "Trumpets loud", sound: elephantSound },
  { id: "duck", name: "Duck", emoji: "🦆", color: "#FFF3B0", note: "Quacks happily", sound: duckSound },
  { id: "cow", name: "Cow", emoji: "🐄", color: "#E3D9CF", note: "Moos gently", sound: cowSound },
  { id: "frog", name: "Frog", emoji: "🐸", color: "#C9EFD1", note: "Ribbits with a hop", sound: frogSound },
  { id: "monkey", name: "Monkey", emoji: "🐵", color: "#E9D2B8", note: "Chatters away", sound: monkeySound },
];

// Rendered as SVG (not emoji) for the on-pet overlay: emoji glyphs are drawn
// by the OS/browser's own font and vary in size and vertical anchor across
// platforms (iOS vs Android vs desktop), which was throwing off the
// calibrated placement on real phones even though it looked right in
// testing. An SVG has fixed, identical geometry everywhere.
function PirateHatIcon({ width }) {
  return (
    <svg viewBox="0 0 64 40" width={width} height={(width * 40) / 64} style={{ display: "block" }}>
      <ellipse cx="32" cy="32" rx="30" ry="7" fill="#2b2b2b" />
      <path d="M10 30 Q10 6 32 6 Q54 6 54 30 Z" fill="#2b2b2b" />
      <rect x="8" y="26" width="48" height="6" rx="3" fill="#D64545" />
    </svg>
  );
}
function SunglassesIcon({ width }) {
  return (
    <svg viewBox="0 0 64 24" width={width} height={(width * 24) / 64} style={{ display: "block" }}>
      <rect x="2" y="4" width="24" height="16" rx="8" fill="#1a1a1a" />
      <rect x="38" y="4" width="24" height="16" rx="8" fill="#1a1a1a" />
      <rect x="26" y="10" width="12" height="4" fill="#1a1a1a" />
    </svg>
  );
}
function BowTieIcon({ width }) {
  return (
    <svg viewBox="0 0 60 36" width={width} height={(width * 36) / 60} style={{ display: "block" }}>
      <polygon points="2,4 28,18 2,32" fill="#FF6FA5" />
      <polygon points="58,4 32,18 58,32" fill="#FF6FA5" />
      <rect x="24" y="12" width="12" height="12" rx="2" fill="#D6407F" />
    </svg>
  );
}
// A cape is worn on the back, so front-on it should only read as a short
// flared collar with a clasp -- not a full frontal shape (that looked like
// a bib and swallowed the rest of the outfit).
function HeroCapeIcon({ width }) {
  return (
    <svg viewBox="0 0 100 30" width={width} height={(width * 30) / 100} style={{ display: "block" }}>
      <path d="M4 6 Q30 -3 50 2 Q70 -3 96 6 L82 28 Q50 18 18 28 Z" fill="#E0453C" />
      <rect x="41" y="0" width="18" height="7" rx="3" fill={YELLOW_DARK} />
    </svg>
  );
}

const WARDROBE = [
  { id: "pirate", name: "Pirate Hat", emoji: "🏴‍☠️", Icon: PirateHatIcon },
  { id: "sunglasses", name: "Sunglasses", emoji: "🕶️", Icon: SunglassesIcon },
  { id: "bow", name: "Bow Tie", emoji: "🎀", Icon: BowTieIcon },
  { id: "hero", name: "Hero Cape", emoji: "🦸", Icon: HeroCapeIcon },
];

// Wardrobe item placement within the Dress Up preview box (top/left as %,
// width in px). A real photo (Leo's default portrait or an uploaded photo,
// for any species) fills the box edge-to-edge, so it always uses
// WARDROBE_PHOTO_POSITIONS. Without a photo the box instead shows a single
// centered emoji glyph -- much smaller than the box, and shaped completely
// differently per animal (front-facing head only for lion/frog/monkey vs.
// a side-profile full body facing left for elephant/duck/cow) -- so each
// species needs its own calibration in WARDROBE_EMOJI_POSITIONS, measured
// against that animal's actual glyph bounding box within the box.
const WARDROBE_PHOTO_POSITIONS = {
  pirate: { top: "6%", left: "50%", width: 64 },
  sunglasses: { top: "37%", left: "50%", width: 62 },
  bow: { top: "66%", left: "50%", width: 40 },
  hero: { top: "93%", left: "50%", width: 92 },
};

const WARDROBE_EMOJI_POSITIONS = {
  // Front-facing head-only glyphs: hat/sunglasses centered on the face,
  // bow at the chin (there's no visible neck/body), cape as a small
  // flourish peeking in at the very bottom of the box.
  lion: {
    pirate: { top: "23%", left: "50%", width: 34 },
    sunglasses: { top: "40%", left: "50%", width: 32 },
    bow: { top: "64%", left: "50%", width: 22 },
    hero: { top: "88%", left: "50%", width: 44 },
  },
  frog: {
    pirate: { top: "29%", left: "50%", width: 32 },
    sunglasses: { top: "41%", left: "50%", width: 32 },
    bow: { top: "60%", left: "50%", width: 20 },
    hero: { top: "88%", left: "50%", width: 42 },
  },
  monkey: {
    pirate: { top: "29%", left: "50%", width: 32 },
    sunglasses: { top: "44%", left: "50%", width: 30 },
    bow: { top: "62%", left: "50%", width: 20 },
    hero: { top: "88%", left: "50%", width: 42 },
  },
  // Side-profile full-body glyphs facing left: head/eye sit left of
  // center, the neck/collar is just right of the head, and the body
  // (where a cape would drape) is further right and lower still --
  // pulled well clear of the bow so the two don't visually merge.
  elephant: {
    pirate: { top: "28%", left: "45%", width: 26 },
    sunglasses: { top: "40%", left: "45%", width: 24 },
    bow: { top: "45%", left: "51%", width: 16 },
    hero: { top: "56%", left: "61%", width: 30 },
  },
  duck: {
    pirate: { top: "24%", left: "46%", width: 24 },
    sunglasses: { top: "31%", left: "47%", width: 22 },
    bow: { top: "40%", left: "46%", width: 15 },
    hero: { top: "50%", left: "59%", width: 28 },
  },
  cow: {
    pirate: { top: "30%", left: "46%", width: 26 },
    sunglasses: { top: "40%", left: "44%", width: 24 },
    bow: { top: "46%", left: "50%", width: 16 },
    hero: { top: "50%", left: "60%", width: 30 },
  },
};

function getWardrobePositions(animalId, hasPhoto) {
  if (hasPhoto) return WARDROBE_PHOTO_POSITIONS;
  return WARDROBE_EMOJI_POSITIONS[animalId] ?? WARDROBE_PHOTO_POSITIONS;
}

function getAnimal(id) {
  return ANIMALS.find((a) => a.id === id) ?? ANIMALS[0];
}

function PhoneShell({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EFEAE0] p-6">
      <div
        className="relative w-[380px] h-[780px] rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border-[6px]"
        style={{ borderColor: "#2b2b2b" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2b2b2b] rounded-b-2xl z-20" />
        <div className="h-full w-full flex flex-col" style={{ background: CREAM }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-9 pb-3 bg-white/70 backdrop-blur-sm border-b border-black/5">
      <div className="flex items-center gap-2 w-8">
        {onBack ? (
          <button onClick={onBack} aria-label="Go back" className="p-1 -ml-1 rounded-full active:bg-black/5">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        ) : (
          <span className="text-xl">🐾</span>
        )}
      </div>
      <h1 className="font-extrabold text-[17px] tracking-tight" style={{ color: "#3a3226" }}>
        {title}
      </h1>
      <div className="w-8 flex justify-end">{right}</div>
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "dressup", label: "Dress Up", icon: Shirt },
    { id: "sounds", label: "Sounds", icon: Music2 },
    { id: "care", label: "Care", icon: Heart },
  ];
  return (
    <div className="flex items-stretch justify-around border-t border-black/5 bg-white px-2 pb-5 pt-2">
      {items.map(({ id, label, icon: Icon }) => {
        const active = screen === id || (id === "care" && screen === "hospital");
        return (
          <button
            key={id}
            onClick={() => setScreen(id)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-colors"
            style={{ background: active ? YELLOW : "transparent" }}
          >
            <Icon size={18} strokeWidth={2.5} color={active ? "#3a3226" : "#9c9483"} />
            <span
              className="text-[10px] font-bold"
              style={{ color: active ? "#3a3226" : "#9c9483" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- HOME ----------
function HomeScreen({
  setScreen, petName, loveMeter, petPhoto, onUploadClick, onRemovePhoto,
  animalId, onSelectAnimal, fetchCount,
}) {
  const selectedAnimal = getAnimal(animalId);
  const petImage = petPhoto || selectedAnimal.image;
  const cards = [
    { id: "hospital", label: "Dress Up Party", sub: "6 New Outfits", bg: PINK, emoji: "👗", go: "dressup" },
    { id: "jukebox", label: "Animal Jukebox", sub: "12 Catchy Tunes", bg: GREEN, emoji: "🎵", go: "sounds" },
    { id: "hospital2", label: "Pet Hospital", sub: "Keep Leo healthy", bg: "#FFD9E8", emoji: "🩺", go: "hospital" },
    { id: "play", label: "Pet & Play", sub: "Daily Care Bonus", bg: YELLOW, emoji: "🖐️", go: "care" },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3">
      <div className="rounded-3xl p-4 relative overflow-hidden" style={{ background: YELLOW }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            aria-label="Upload a photo of your pet"
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-transform overflow-hidden"
            style={{ background: petImage ? "transparent" : "rgba(255,255,255,0.5)" }}
          >
            {petImage ? (
              <img src={petImage} alt="Your pet" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{selectedAnimal.emoji}</span>
            )}
            <span className="absolute bottom-0.5 right-0.5 bg-white rounded-full p-1 shadow">
              <Camera size={11} color="#3a3226" strokeWidth={2.5} />
            </span>
          </button>
          <div className="flex-1">
            <p className="font-extrabold text-lg text-[#3a3226] leading-tight">Hello, Pal!</p>
            <p className="text-sm text-[#5c5340] mt-0.5">Ready for some tail-wagging fun today?</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setScreen("dressup")}
            className="bg-[#3a3226] text-white text-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
          >
            Let's Play!
          </button>
          <button
            onClick={onUploadClick}
            className="text-xs font-bold px-3 py-2 rounded-full active:scale-95 transition-transform bg-white/60 text-[#3a3226]"
          >
            {petPhoto ? "Change photo" : "Add pet photo"}
          </button>
          {petPhoto && (
            <button
              onClick={onRemovePhoto}
              aria-label="Remove photo"
              className="ml-auto p-1.5 rounded-full bg-white/60 active:scale-95 transition-transform"
            >
              <X size={14} color="#3a3226" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-3 bg-white border border-black/5">
        <p className="text-xs font-bold text-[#9c9483] mb-2">
          CHOOSE YOUR PET · {selectedAnimal.name}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ANIMALS.map((a) => {
            const on = a.id === animalId;
            return (
              <button
                key={a.id}
                onClick={() => onSelectAnimal(a.id)}
                aria-label={`Choose ${a.name}`}
                className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform active:scale-95 border-2"
                style={{
                  background: on ? a.color : "white",
                  borderColor: on ? YELLOW_DARK : "rgba(0,0,0,0.06)",
                }}
              >
                {a.emoji}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setScreen(c.go)}
            className="rounded-2xl p-3 text-left active:scale-95 transition-transform h-28 flex flex-col justify-between"
            style={{ background: c.bg }}
          >
            <span className="text-2xl">{c.emoji}</span>
            <div>
              <p className="font-bold text-sm text-[#3a3226] leading-tight">{c.label}</p>
              <p className="text-[11px] text-[#5c5340]">{c.sub}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setScreen("park")}
        className="w-full rounded-2xl p-3 text-left active:scale-95 transition-transform flex items-center gap-3"
        style={{ background: GREEN }}
      >
        <span className="text-2xl">🎾</span>
        <div className="flex-1">
          <p className="font-bold text-sm text-[#3a3226] leading-tight">Pet Park</p>
          <p className="text-[11px] text-[#5c5340]">
            Play fetch with {petName} · {fetchCount} today
          </p>
        </div>
      </button>

      <div className="rounded-2xl p-3 bg-white border border-black/5 flex items-center gap-3">
        <div className="text-2xl">💛</div>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#3a3226]">{petName} loves you {loveMeter}%</p>
          <div className="h-2 rounded-full bg-black/5 mt-1 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${loveMeter}%`, background: PINK }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- PET HOSPITAL ----------
function HospitalScreen({ vitality, setVitality, petName, petPhoto, animalId }) {
  const [done, setDone] = useState({ temp: false, bandage: false, vitamin: false });
  const [celebrate, setCelebrate] = useState(false);
  const [pulse, setPulse] = useState(null);
  const selectedAnimal = getAnimal(animalId);
  const petImage = petPhoto || selectedAnimal.image;

  const actions = [
    { key: "temp", label: "Check Temp", icon: Thermometer, bg: YELLOW, amount: 34 },
    { key: "bandage", label: "Apply Bandage", icon: Bandage, bg: GREEN, amount: 33 },
    { key: "vitamin", label: "Give Vitamin", icon: Pill, bg: "#FFB8D2", amount: 33 },
  ];

  const doAction = (key, amount) => {
    if (done[key]) return;
    const next = Math.min(100, vitality + amount);
    setVitality(next);
    setDone((d) => ({ ...d, [key]: true }));
    setPulse(key);
    setTimeout(() => setPulse(null), 500);
    if (next >= 100) {
      setTimeout(() => setCelebrate(true), 400);
    }
  };

  const resetPet = () => {
    setVitality(20);
    setDone({ temp: false, bandage: false, vitamin: false });
    setCelebrate(false);
  };

  if (celebrate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <PartyPopper size={48} color={YELLOW_DARK} className="mb-3" />
        <h2 className="text-2xl font-extrabold text-[#3a3226]">Pet is All Better!</h2>
        <p className="text-sm text-[#5c5340] mt-2">
          {petName} is bursting with energy and ready for new adventures!
        </p>
        <div className="flex items-center justify-center gap-2 mt-6 mb-6">
          {petImage ? (
            <img src={petImage} alt={petName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow" />
          ) : (
            <span className="text-6xl">{selectedAnimal.emoji}</span>
          )}
          <span className="text-4xl">✨</span>
        </div>
        <div className="rounded-2xl p-4 w-full" style={{ background: CREAM, border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="font-bold text-sm text-[#3a3226]">🏅 Master Caretaker</p>
          <p className="text-xs text-[#5c5340] mt-1">
            You've successfully nurtured {petName} back to full health.
          </p>
        </div>
        <button
          onClick={resetPet}
          className="mt-5 text-sm font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
          style={{ background: YELLOW, color: "#3a3226" }}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl p-4" style={{ background: YELLOW }}>
        <div className="flex justify-between items-center">
          <p className="font-bold text-sm text-[#3a3226]">Pet Hospital</p>
          <p className="text-xs font-bold text-[#3a3226]">{vitality}% Happy</p>
        </div>
        <div className="h-2.5 rounded-full bg-white/60 mt-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${vitality}%`, background: GREEN }}
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden h-40 flex items-center justify-center text-6xl bg-[#EAF6FF]">
        {petImage ? (
          <img src={petImage} alt={petName} className="w-full h-full object-cover" />
        ) : (
          selectedAnimal.emoji
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ key, label, icon: Icon, bg, amount }) => (
          <button
            key={key}
            onClick={() => doAction(key, amount)}
            disabled={done[key]}
            className={`rounded-2xl py-3 flex flex-col items-center gap-1.5 transition-transform ${
              done[key] ? "opacity-50" : "active:scale-95"
            } ${pulse === key ? "scale-105" : ""}`}
            style={{ background: bg }}
          >
            <Icon size={20} color="#3a3226" strokeWidth={2.5} />
            <span className="text-[11px] font-bold text-[#3a3226] text-center leading-tight px-1">
              {label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-[#9c9483]">
        Tap each card once to bring {petName} back to full health.
      </p>
    </div>
  );
}

// ---------- DRESS UP ----------
function DressUpScreen({ equipped, toggleEquip, petName, petPhoto, animalId }) {
  const selectedAnimal = getAnimal(animalId);
  const petImage = petPhoto || selectedAnimal.image;
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl h-44 flex items-center justify-center relative overflow-hidden" style={{ background: "#F3E9DD" }}>
        {petImage ? (
          <img src={petImage} alt={petName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{selectedAnimal.emoji}</span>
        )}
        {equipped.map((id) => {
          const item = WARDROBE.find((w) => w.id === id);
          const Icon = item.Icon;
          const positions = getWardrobePositions(animalId, Boolean(petImage));
          const pos = positions[id];
          return (
            <div
              key={id}
              className="absolute pointer-events-none select-none"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
              }}
            >
              <Icon width={pos.width} />
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-xs font-bold text-[#9c9483] mb-2">MY WARDROBE · {equipped.length} equipped</p>
        <div className="grid grid-cols-2 gap-3">
          {WARDROBE.map((item) => {
            const on = equipped.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleEquip(item.id)}
                className="rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-transform active:scale-95 border-2"
                style={{
                  background: on ? PINK : "white",
                  borderColor: on ? PINK : "rgba(0,0,0,0.06)",
                }}
              >
                <span className="text-3xl">{item.emoji}</span>
                <span className={`text-xs font-bold ${on ? "text-white" : "text-[#3a3226]"}`}>
                  {item.name}
                </span>
                <span className={`text-[10px] font-bold ${on ? "text-white/90" : "text-[#9c9483]"}`}>
                  {on ? "Equipped" : "Tap to wear"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-[11px] text-[#9c9483]">
        {petName} loves showing off a new look!
      </p>
    </div>
  );
}

// ---------- ANIMAL JUKEBOX ----------
function JukeboxScreen() {
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  const jukeboxAnimals = ANIMALS.filter((a) => a.sound);

  const play = (animal) => {
    if (audioRef.current) audioRef.current.pause();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setPlaying(animal.id);
    const audio = new Audio(animal.sound);
    audioRef.current = audio;
    audio.addEventListener("ended", () => setPlaying(null));
    audio.play().catch(() => {});
    // Fallback in case playback is blocked or the "ended" event never fires.
    timeoutRef.current = setTimeout(() => setPlaying(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="text-center">
        <p className="font-extrabold text-lg text-[#3a3226]">Animal Sounds</p>
        <p className="text-xs text-[#9c9483]">Tap a friend to hear them speak!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {jukeboxAnimals.map((a) => {
          const isPlaying = playing === a.id;
          return (
            <button
              key={a.id}
              onClick={() => play(a)}
              className="rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-all active:scale-95"
              style={{
                background: a.color,
                boxShadow: isPlaying ? `0 0 0 3px ${GREEN}` : "none",
                transform: isPlaying ? "scale(1.04)" : "scale(1)",
              }}
            >
              <span className="text-4xl">{a.emoji}</span>
              <span className="text-sm font-bold text-[#3a3226]">{a.name}</span>
              {isPlaying && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#3a3226]">
                  <Volume2 size={12} /> {a.note}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: YELLOW }}>
        <Sparkles size={16} color="#3a3226" />
        <p className="text-[11px] font-bold text-[#3a3226]">
          Try turning up the volume to get your pet's attention!
        </p>
      </div>
    </div>
  );
}

// ---------- PET & PLAY (Care) ----------
function CareScreen({ loveMeter, setLoveMeter, petName, petPhoto, animalId }) {
  const [heartBurst, setHeartBurst] = useState(false);
  const selectedAnimal = getAnimal(animalId);
  const petImage = petPhoto || selectedAnimal.image;

  const feed = () => {
    setLoveMeter((m) => Math.min(100, m + 12));
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 500);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl h-52 flex items-center justify-center relative overflow-hidden" style={{ background: "#F3E9DD" }}>
        {petImage ? (
          <img src={petImage} alt={petName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{selectedAnimal.emoji}</span>
        )}
        {heartBurst && (
          <span className="absolute top-6 right-8 text-3xl animate-bounce">💗</span>
        )}
        <div className="absolute bottom-3 left-3 right-3 bg-white/85 rounded-xl px-3 py-2">
          <p className="text-xs font-bold text-[#3a3226]">{petName} is feeling loved</p>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-white border border-black/5">
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs font-bold text-[#3a3226]">Love Meter</p>
          <p className="text-xs font-bold" style={{ color: PINK }}>{loveMeter}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${loveMeter}%`, background: PINK }}
          />
        </div>
      </div>

      <button
        onClick={feed}
        className="w-full rounded-2xl py-3 font-bold text-sm active:scale-95 transition-transform"
        style={{ background: YELLOW, color: "#3a3226" }}
      >
        🍖 Feed {petName}
      </button>
      <p className="text-center text-[11px] text-[#9c9483]">
        Feed, groom, and shower {petName} with love to fill the meter.
      </p>
    </div>
  );
}

// ---------- PET PARK ----------
function PetParkScreen({ petName, petPhoto, animalId, fetchCount, onFetch }) {
  const [stage, setStage] = useState("idle"); // idle -> throwing -> fetching -> returning -> idle
  const selectedAnimal = getAnimal(animalId);
  const petImage = petPhoto || selectedAnimal.image;
  const timersRef = useRef([]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const throwBall = () => {
    if (stage !== "idle") return;
    setStage("throwing");
    timersRef.current.push(setTimeout(() => setStage("fetching"), 300));
    timersRef.current.push(setTimeout(() => setStage("returning"), 1000));
    timersRef.current.push(
      setTimeout(() => {
        setStage("idle");
        onFetch();
      }, 1700)
    );
  };

  const petLeft = stage === "fetching" || stage === "returning" ? "66%" : "8%";
  const ballLeft = stage === "idle" ? "8%" : "74%";
  const ballVisible = stage === "throwing" || stage === "fetching";
  const isRunning = stage === "fetching" || stage === "returning";
  const statusText = {
    idle: `${petName} is ready to play!`,
    throwing: "Ball away!",
    fetching: `${petName} is chasing it...`,
    returning: `${petName} is bringing it back!`,
  }[stage];

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl h-44 relative overflow-hidden" style={{ background: "#DCF2DE" }}>
        <div className="absolute bottom-0 left-0 right-0 h-9" style={{ background: "#BFE6C4" }} />

        <span
          className="absolute text-3xl"
          style={{
            left: ballLeft,
            bottom: "22px",
            opacity: ballVisible ? 1 : 0,
            transition: "left 300ms ease-out, opacity 200ms",
          }}
        >
          🎾
        </span>

        <div
          className={`absolute w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center ${isRunning ? "animate-bounce" : ""}`}
          style={{ left: petLeft, bottom: "8px", transition: "left 650ms ease-in-out" }}
        >
          {petImage ? (
            <img src={petImage} alt={petName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">{selectedAnimal.emoji}</span>
          )}
        </div>

        <div className="absolute top-3 left-3 right-3 bg-white/85 rounded-xl px-3 py-2">
          <p className="text-xs font-bold text-[#3a3226]">{statusText}</p>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-white border border-black/5 flex items-center gap-3">
        <div className="text-2xl">🏆</div>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#3a3226]">Fetches today</p>
          <p className="text-2xl font-extrabold" style={{ color: GREEN }}>
            {fetchCount}
          </p>
        </div>
      </div>

      <button
        onClick={throwBall}
        disabled={stage !== "idle"}
        className={`w-full rounded-2xl py-3 font-bold text-sm transition-transform ${
          stage === "idle" ? "active:scale-95" : "opacity-60"
        }`}
        style={{ background: YELLOW, color: "#3a3226" }}
      >
        {stage === "idle" ? "🎾 Throw Ball" : "Fetching..."}
      </button>
      <p className="text-center text-[11px] text-[#9c9483]">
        Play fetch with {petName} at the Pet Park!
      </p>
    </div>
  );
}

export default function PawPlayPrototype() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home");
  const [vitality, setVitality] = useState(DEFAULT_STATE.vitality);
  const [equipped, setEquipped] = useState(DEFAULT_STATE.equipped);
  const [loveMeter, setLoveMeter] = useState(DEFAULT_STATE.loveMeter);
  const [petPhoto, setPetPhoto] = useState(DEFAULT_STATE.petPhoto);
  const [animalId, setAnimalId] = useState(DEFAULT_STATE.animalId);
  const [fetchCount, setFetchCount] = useState(DEFAULT_STATE.fetchCount);
  const [fetchDate, setFetchDate] = useState(DEFAULT_STATE.fetchDate);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const petName = "Leo";

  // Load persisted state once on mount (Supabase if configured, else localStorage).
  useEffect(() => {
    let cancelled = false;
    loadPetState().then((state) => {
      if (cancelled) return;
      setVitality(state.vitality);
      setEquipped(state.equipped);
      setLoveMeter(state.loveMeter);
      setPetPhoto(state.petPhoto);
      setAnimalId(state.animalId);
      // The fetch count is "today's" count: if the saved date isn't today,
      // start the display back at 0 rather than carrying over an old day's
      // total.
      const today = new Date().toDateString();
      setFetchCount(state.fetchDate === today ? state.fetchCount : 0);
      setFetchDate(state.fetchDate === today ? state.fetchDate : today);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist any state change after the initial load has completed.
  useEffect(() => {
    if (!loaded) return;
    savePetState({ vitality, loveMeter, equipped, petPhoto, animalId, fetchCount, fetchDate });
  }, [loaded, vitality, loveMeter, equipped, petPhoto, animalId, fetchCount, fetchDate]);

  const toggleEquip = (id) => {
    setEquipped((eq) => (eq.includes(id) ? eq.filter((x) => x !== id) : [...eq, id]));
  };

  const handleFetch = () => {
    setFetchCount((c) => c + 1);
    setFetchDate(new Date().toDateString());
  };

  const handleUploadClick = () => {
    setUploadError("");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (like a photo).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("That photo is a bit large — try one under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPetPhoto(reader.result);
      setUploadError("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = () => setPetPhoto(null);

  const titles = {
    home: "PawPlay",
    dressup: "Dress Up Party",
    sounds: "Animal Jukebox",
    hospital: "Pet Hospital",
    care: "Pet & Play",
    park: "Pet Park",
  };

  if (!loaded) {
    return (
      <PhoneShell>
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl animate-bounce">🐾</span>
          <p className="text-sm font-bold text-[#9c9483]">Loading PawPlay…</p>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar
        title={titles[screen]}
        onBack={screen !== "home" ? () => setScreen("home") : null}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {uploadError && (
        <div className="mx-4 mt-2 rounded-xl px-3 py-2 text-[11px] font-bold" style={{ background: "#FFE3E3", color: "#8a2c2c" }}>
          {uploadError}
        </div>
      )}
      {!isSupabaseConfigured && screen === "home" && (
        <div className="mx-4 mt-2 rounded-xl px-3 py-2 text-[10px] font-bold" style={{ background: "#FFF3CE", color: "#7a5b00" }}>
          Saving on this device only. Connect Supabase to sync across devices — see README.
        </div>
      )}
      {screen === "home" && (
        <HomeScreen
          setScreen={setScreen}
          petName={petName}
          loveMeter={loveMeter}
          petPhoto={petPhoto}
          onUploadClick={handleUploadClick}
          onRemovePhoto={handleRemovePhoto}
          animalId={animalId}
          onSelectAnimal={setAnimalId}
          fetchCount={fetchCount}
        />
      )}
      {screen === "hospital" && (
        <HospitalScreen vitality={vitality} setVitality={setVitality} petName={petName} petPhoto={petPhoto} animalId={animalId} />
      )}
      {screen === "dressup" && (
        <DressUpScreen equipped={equipped} toggleEquip={toggleEquip} petName={petName} petPhoto={petPhoto} animalId={animalId} />
      )}
      {screen === "sounds" && <JukeboxScreen />}
      {screen === "care" && (
        <CareScreen loveMeter={loveMeter} setLoveMeter={setLoveMeter} petName={petName} petPhoto={petPhoto} animalId={animalId} />
      )}
      {screen === "park" && (
        <PetParkScreen petName={petName} petPhoto={petPhoto} animalId={animalId} fetchCount={fetchCount} onFetch={handleFetch} />
      )}
      <BottomNav screen={screen} setScreen={setScreen} />
    </PhoneShell>
  );
}
