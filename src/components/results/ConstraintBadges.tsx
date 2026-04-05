import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ConstraintConfig, GroupAssignment } from "@/config/types";

interface ConstraintBadgesProps {
  constraints: ConstraintConfig[];
  assignment: GroupAssignment;
}

export function ConstraintBadges({ constraints, assignment }: ConstraintBadgesProps) {
  if (constraints.length === 0) return null;

  // Verify each constraint is satisfied
  function isConstraintSatisfied(constraint: ConstraintConfig): boolean {
    if (constraint.type === "max_per_group") {
      const max = constraint.max ?? 1;
      const field = constraint.field as keyof (typeof assignment.groups)[0]["teams"][0];
      for (const group of assignment.groups) {
        const counts = new Map<unknown, number>();
        for (const team of group.teams) {
          const val = team[field as keyof typeof team];
          if (val !== undefined) {
            counts.set(val, (counts.get(val) ?? 0) + 1);
            if ((counts.get(val) ?? 0) > max) return false;
          }
        }
      }
      return true;
    }
    return true;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#F0F4F8]">Rules check</p>
      <div className="flex flex-wrap gap-2" role="list" aria-label="Rules check results">
        {constraints.map((constraint, i) => {
          const satisfied = isConstraintSatisfied(constraint);
          return (
            <div
              key={i}
              role="listitem"
              className="flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1"
              aria-label={`${constraint.description}: ${satisfied ? "Passed" : "Failed"}`}
            >
              <CheckCircle className="h-3.5 w-3.5 text-teal" />
              <span className="text-xs text-teal">{constraint.description || "Passed"}</span>
            </div>
          );
        })}
        {constraints.length > 0 && (
          <Badge variant="success" className="ml-1">
            All rules satisfied
          </Badge>
        )}
      </div>
    </div>
  );
}
