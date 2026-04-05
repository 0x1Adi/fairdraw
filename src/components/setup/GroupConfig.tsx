import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

interface GroupConfigProps {
  groups: number;
  groupSize: number;
  totalTeams: number;
  onGroupsChange: (n: number) => void;
  onGroupSizeChange: (n: number) => void;
}

export function GroupConfig({
  groups,
  groupSize,
  totalTeams,
  onGroupsChange,
  onGroupSizeChange,
}: GroupConfigProps) {
  const totalSlots = groups * groupSize;
  const balanced = totalTeams === totalSlots;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="group-count" className="text-sm font-medium text-[#F0F4F8]">
          How many groups?
        </Label>
        <Input
          id="group-count"
          type="number"
          min={1}
          max={64}
          value={groups}
          onChange={(e) => onGroupsChange(Math.max(1, parseInt(e.target.value) || 1))}
          aria-label="Number of groups"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-size" className="text-sm font-medium text-[#F0F4F8]">
          How many per group?
        </Label>
        <Input
          id="group-size"
          type="number"
          min={1}
          max={32}
          value={groupSize}
          onChange={(e) => onGroupSizeChange(Math.max(1, parseInt(e.target.value) || 1))}
          aria-label="Items per group"
        />
      </div>
      {totalTeams > 0 && (
        <div className="col-span-2">
          <p className={`text-xs ${balanced ? "text-teal" : "text-amber"}`}>
            {totalTeams} items · {groups} groups of {groupSize} = {totalSlots} slots
            {!balanced && ` (${Math.abs(totalTeams - totalSlots)} ${totalTeams < totalSlots ? "short" : "extra"})`}
          </p>
        </div>
      )}
    </div>
  );
}
