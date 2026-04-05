import { Trophy, Star, Shuffle, Gamepad2, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeaturedPresets } from "@/hooks/usePresets";
import { getCopyValue } from "@/hooks/useCopy";
import type { PresetConfig } from "@/config/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  shuffle: Shuffle,
  gamepad: Gamepad2,
  "graduation-cap": GraduationCap,
};

interface PresetSelectorProps {
  selected: PresetConfig | null;
  onSelect: (preset: PresetConfig | null) => void;
}

export function PresetSelector({ selected, onSelect }: PresetSelectorProps) {
  const presets = useFeaturedPresets();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#F0F4F8]">
          {getCopyValue("home.preset_cards.title")}
        </h3>
        <p className="text-xs text-[#8899AA] mt-0.5">
          {getCopyValue("home.preset_cards.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const Icon = ICONS[preset.icon] ?? Shuffle;
          const copyKey = `presets.${preset.id}`;
          const name = getCopyValue(`${copyKey}.name`) !== `${copyKey}.name`
            ? getCopyValue(`${copyKey}.name`)
            : preset.name;
          const description = getCopyValue(`${copyKey}.description`) !== `${copyKey}.description`
            ? getCopyValue(`${copyKey}.description`)
            : preset.description;
          const badge = getCopyValue(`${copyKey}.badge`);
          const isSelected = selected?.id === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelect(isSelected ? null : preset)}
              className={`text-left w-full transition-all rounded-lg ${
                isSelected
                  ? "ring-2 ring-teal ring-offset-2 ring-offset-navy"
                  : "hover:ring-1 hover:ring-border"
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${name} preset`}
            >
              <Card className={isSelected ? "border-teal/50 bg-teal/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Icon
                      className={`h-5 w-5 mt-0.5 ${isSelected ? "text-teal" : "text-[#8899AA]"}`}
                    />
                    {badge && badge !== `${copyKey}.badge` && (
                      <Badge variant="default" className="text-xs shrink-0">
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <p className={`font-medium text-sm ${isSelected ? "text-teal" : "text-[#F0F4F8]"}`}>
                    {name}
                  </p>
                  <p className="text-xs text-[#8899AA] mt-1 leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            </button>
          );
        })}

        {/* Custom option */}
        <button
          onClick={() => onSelect(null)}
          className={`text-left w-full transition-all rounded-lg ${
            selected === null
              ? "ring-2 ring-teal ring-offset-2 ring-offset-navy"
              : "hover:ring-1 hover:ring-border"
          }`}
          aria-pressed={selected === null}
          aria-label="Build your own draw"
        >
          <Card className={selected === null ? "border-teal/50 bg-teal/5" : ""}>
            <CardContent className="p-4">
              <Shuffle
                className={`h-5 w-5 mb-2 ${selected === null ? "text-teal" : "text-[#8899AA]"}`}
              />
              <p className={`font-medium text-sm ${selected === null ? "text-teal" : "text-[#F0F4F8]"}`}>
                Build your own
              </p>
              <p className="text-xs text-[#8899AA] mt-1 leading-relaxed">
                Start from scratch — set your own items, groups, and rules.
              </p>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}
