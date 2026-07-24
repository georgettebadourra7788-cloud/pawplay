import React, { useState, useRef, useEffect } from "react";
import {
  Home, Shirt, Music2, Heart, Thermometer, Bandage, Pill,
  Sparkles, ChevronLeft, PartyPopper, Volume2, Camera, X
} from "lucide-react";
import { loadPetState, savePetState, DEFAULT_STATE } from "./lib/petStore";
import { isSupabaseConfigured } from "./lib/supabaseClient";

// ---- Design tokens (matches Stitch: seed #FFD93D yellow, pink secondary, green accent) ----
const YELLOW = "#FFD93D";
const YELLOW_DARK = "#F5B800";
const PINK = "#FF6FA5";
const GREEN = "#5FCB8C";
const CREAM = "#FFFBF0";

const ANIMALS = [
  { id: "dog", name: "Dog", emoji: "🐶", color: "#FFDFB8", note: "Barks joyfully" },
  { id: "lion", name: "Lion", emoji: "🦁", color: "#FFE8A3", note: "Roars proudly" },
  { id: "elephant", name: "Elephant", emoji: "🐘", color: "#CDEBFB", note: "Trumpets loud" },
  { id: "duck", name: "Duck", emoji: "🦆", color: "#FFF3B0", note: "Quacks happily" },
  { id: "cow", name: "Cow", emoji: "🐄", color: "#E3D9CF", note: "Moos gently" },
  { id: "frog", name: "Frog", emoji: "🐸", color: "#C9EFD1", note: "Ribbits with a hop" },
  { id: "monkey", name: "Monkey", emoji: "🐵", color: "#E9D2B8", note: "Chatters away" },
];

const WARDROBE = [
  { id: "pirate", name: "Pirate Hat", emoji: "🏴‍☠️" },
  { id: "sunglasses", name: "Sunglasses", emoji: "🕶️" },
  { id: "hero", name: "Hero Cape", emoji: "🦸" },
  { id: "bow", name: "Bow Tie", emoji: "🎀" },
];

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
  animalId, onSelectAnimal,
}) {
  const selectedAnimal = getAnimal(animalId);
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
            style={{ background: petPhoto ? "transparent" : "rgba(255,255,255,0.5)" }}
          >
            {petPhoto ? (
              <img src={petPhoto} alt="Your pet" className="w-full h-full object-cover" />
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
        <div className="text-6xl mt-6 mb-6">{selectedAnimal.emoji}✨</div>
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
        {petPhoto ? (
          <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
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
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl h-44 flex items-center justify-center relative overflow-hidden" style={{ background: "#F3E9DD" }}>
        {petPhoto ? (
          <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{selectedAnimal.emoji}</span>
        )}
        <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
          {equipped.map((id) => {
            const item = WARDROBE.find((w) => w.id === id);
            return (
              <span key={id} className="text-xl bg-white/80 rounded-full p-1">
                {item.emoji}
              </span>
            );
          })}
        </div>
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
  const timeoutRef = useRef(null);

  const play = (id) => {
    setPlaying(id);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPlaying(null), 1400);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="text-center">
        <p className="font-extrabold text-lg text-[#3a3226]">Animal Sounds</p>
        <p className="text-xs text-[#9c9483]">Tap a friend to hear them speak!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ANIMALS.map((a) => {
          const isPlaying = playing === a.id;
          return (
            <button
              key={a.id}
              onClick={() => play(a.id)}
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

  const feed = () => {
    setLoveMeter((m) => Math.min(100, m + 12));
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 500);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl h-52 flex items-center justify-center relative overflow-hidden" style={{ background: "#F3E9DD" }}>
        {petPhoto ? (
          <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
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

export default function PawPlayPrototype() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home");
  const [vitality, setVitality] = useState(DEFAULT_STATE.vitality);
  const [equipped, setEquipped] = useState(DEFAULT_STATE.equipped);
  const [loveMeter, setLoveMeter] = useState(DEFAULT_STATE.loveMeter);
  const [petPhoto, setPetPhoto] = useState(DEFAULT_STATE.petPhoto);
  const [animalId, setAnimalId] = useState(DEFAULT_STATE.animalId);
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
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist any state change after the initial load has completed.
  useEffect(() => {
    if (!loaded) return;
    savePetState({ vitality, loveMeter, equipped, petPhoto, animalId });
  }, [loaded, vitality, loveMeter, equipped, petPhoto, animalId]);

  const toggleEquip = (id) => {
    setEquipped((eq) => (eq.includes(id) ? eq.filter((x) => x !== id) : [...eq, id]));
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
      <BottomNav screen={screen} setScreen={setScreen} />
    </PhoneShell>
  );
}
