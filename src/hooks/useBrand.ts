import { getBrandConfig } from "@/config/loader";

export function useBrand() {
  return getBrandConfig().brand;
}
