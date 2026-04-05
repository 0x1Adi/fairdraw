import { getPresetsConfig } from "@/config/loader";
import type { PresetConfig } from "@/config/types";

export function usePresets() {
  return getPresetsConfig().presets;
}

export function useFeaturedPresets(): PresetConfig[] {
  return getPresetsConfig().presets.filter((p) => p.featured);
}

export function usePreset(id: string): PresetConfig | undefined {
  return getPresetsConfig().presets.find((p) => p.id === id);
}
