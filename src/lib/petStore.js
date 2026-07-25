import { supabase, isSupabaseConfigured } from "./supabaseClient";

// No accounts/login: each browser gets a random anonymous device id,
// generated once and kept in localStorage, used as the row key in Supabase.
const DEVICE_ID_KEY = "pawplay_device_id";
const LOCAL_STATE_KEY = "pawplay_state_v1";

export const DEFAULT_STATE = {
  vitality: 20,
  loveMeter: 92,
  equipped: [],
  petPhoto: null,
  animalId: "dog",
  fetchCount: 0,
  fetchDate: null,
};

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function readLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    // ignore malformed local cache
  }
  return DEFAULT_STATE;
}

function writeLocalState(state) {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

export async function loadPetState() {
  const deviceId = getDeviceId();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("pet_state")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (!error && data) {
      const state = {
        vitality: data.vitality,
        loveMeter: data.love_meter,
        equipped: data.equipped ?? [],
        petPhoto: data.pet_photo ?? null,
        animalId: DEFAULT_STATE.animalId,
        fetchCount: data.fetch_count ?? 0,
        fetchDate: data.fetch_date ?? null,
      };
      writeLocalState(state); // keep local cache warm as an offline fallback
      return state;
    }
  }

  // animalId is intentionally never restored from saved state: Leo (the
  // dog) is always the pet shown on load, for every visitor, on every
  // visit -- no previously saved (or stale/pre-Leo) selection can override
  // that. The species picker still works live within a session; it just
  // never persists across reloads.
  return { ...readLocalState(), animalId: DEFAULT_STATE.animalId };
}

let saveTimer = null;

// Debounced so rapid taps (e.g. filling the Love Meter) don't spam the DB.
export function savePetState(state) {
  writeLocalState(state);

  if (!isSupabaseConfigured) return;

  const deviceId = getDeviceId();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    supabase
      .from("pet_state")
      .upsert(
        {
          device_id: deviceId,
          vitality: state.vitality,
          love_meter: state.loveMeter,
          equipped: state.equipped,
          pet_photo: state.petPhoto,
          animal_id: state.animalId,
          fetch_count: state.fetchCount,
          fetch_date: state.fetchDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id" }
      )
      .then(({ error }) => {
        if (error) console.error("PawPlay: failed to sync to Supabase", error);
      });
  }, 500);
}
