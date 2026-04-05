import copyYaml from "../../config/copy.yml?raw";
import yaml from "js-yaml";

type CopyData = Record<string, unknown>;

let _copy: CopyData | null = null;

function getCopy(): CopyData {
  if (!_copy) _copy = yaml.load(copyYaml) as CopyData;
  return _copy;
}

export function useCopy() {
  return getCopy();
}

export function getCopyValue(path: string): string {
  const copy = getCopy();
  const parts = path.split(".");
  let current: unknown = copy;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}
