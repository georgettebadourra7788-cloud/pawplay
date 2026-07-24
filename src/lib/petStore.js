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
  animalId: "lion",
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
        animalId: data.animal_id ?? "lion",
      };
      writeLocalState(state); // keep local cache warm as an offline fallback
      return state;
    }
  }

  return readLocalState();
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
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id" }
      )
      .then(({ error }) => {
        if (error) console.error("PawPlay: failed to sync to Supabase", error);
      });
  }, 500);
}
