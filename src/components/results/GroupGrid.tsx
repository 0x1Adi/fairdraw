import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupAssignment } from "@/config/types";

interface GroupGridProps {
  assignment: GroupAssignment;
}

export function GroupGrid({ assignment }: GroupGridProps) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Draw results by group"
    >
      {assignment.groups.map((group) => (
        <Card key={group.group_label} role="listitem" className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base font-bold text-teal tracking-wide uppercase">
              Group {group.group_label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ol className="space-y-1.5">
              {group.teams.map((team, i) => (
                <li
                  key={`${team.name}-${i}`}
                  className="flex items-center justify-between text-sm"
                  aria-label={`${team.name}${team.confederation ? `, ${team.confederation}` : ""}`}
                >
                  <span className="font-medium text-[#F0F4F8]">{team.name}</span>
                  {team.confederation && (
                    <span className="text-xs text-[#8899AA] shrink-0 ml-2">
                      {team.confederation}
                    </span>
                  )}
                  {team.country && !team.confederation && (
                    <span className="text-xs text-[#8899AA] shrink-0 ml-2">
                      {team.country}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
