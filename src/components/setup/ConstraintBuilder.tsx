import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { ConstraintConfig } from "@/config/types";

interface ConstraintBuilderProps {
  constraints: ConstraintConfig[];
  onChange: (constraints: ConstraintConfig[]) => void;
}

const CONSTRAINT_TYPES = [
  {
    type: "max_per_group" as const,
    label: "Limit per group",
    description: "No more than N items with the same tag in one group",
    example: "e.g. No more than 2 European teams in one group",
  },
  {
    type: "fixed_position" as const,
    label: "Lock someone in place",
    description: "Always put a specific item in a specific group",
    example: "e.g. Host country always in Group A",
  },
];

export function ConstraintBuilder({ constraints, onChange }: ConstraintBuilderProps) {
  function addConstraint() {
    onChange([
      ...constraints,
      { type: "max_per_group", field: "", max: 2, description: "" },
    ]);
  }

  function removeConstraint(index: number) {
    onChange(constraints.filter((_, i) => i !== index));
  }

  function updateConstraint(index: number, updates: Partial<ConstraintConfig>) {
    onChange(
      constraints.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#F0F4F8]">Any rules?</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addConstraint}
          className="gap-1"
          aria-label="Add a rule"
        >
          <Plus className="h-3 w-3" />
          Add a rule
        </Button>
      </div>

      {constraints.length === 0 ? (
        <p className="text-sm text-[#8899AA] border border-dashed border-border rounded-md p-4 text-center">
          No rules yet. The draw will be completely random.
        </p>
      ) : (
        <div className="space-y-2">
          {constraints.map((constraint, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md border border-border bg-card p-3"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  value={constraint.type}
                  onValueChange={(v) =>
                    updateConstraint(index, { type: v as ConstraintConfig["type"] })
                  }
                >
                  <SelectTrigger aria-label="Rule type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRAINT_TYPES.map((t) => (
                      <SelectItem key={t.type} value={t.type}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Tag (e.g. confederation)"
                  value={constraint.field}
                  onChange={(e) => updateConstraint(index, { field: e.target.value })}
                  aria-label="Field to check"
                />

                {constraint.type === "max_per_group" && (
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    placeholder="Max"
                    value={constraint.max ?? 2}
                    onChange={(e) =>
                      updateConstraint(index, { max: parseInt(e.target.value) || 2 })
                    }
                    aria-label="Maximum per group"
                  />
                )}
                {constraint.type === "fixed_position" && (
                  <Input
                    type="number"
                    min={0}
                    placeholder="Group index (0 = A)"
                    value={constraint.group ?? 0}
                    onChange={(e) =>
                      updateConstraint(index, { group: parseInt(e.target.value) || 0 })
                    }
                    aria-label="Group index"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeConstraint(index)}
                className="text-[#8899AA] hover:text-destructive transition-colors mt-1"
                aria-label={`Remove rule ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {constraints.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {CONSTRAINT_TYPES.find((t) => t.type === constraints[0]?.type) && (
            <Badge variant="outline" className="text-xs text-[#8899AA]">
              {CONSTRAINT_TYPES.find((t) => t.type === constraints[0]?.type)?.example}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
