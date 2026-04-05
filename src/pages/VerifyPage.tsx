import { useLocation } from "react-router-dom";
import { VerifyPanel } from "@/components/verify/VerifyPanel";
import { getCopyValue } from "@/hooks/useCopy";

export function VerifyPage() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-2 mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          {getCopyValue("verify.title")}
        </h1>
        <p className="text-[#8899AA]">
          {getCopyValue("verify.subtitle")}
        </p>
      </div>

      <VerifyPanel initialFragment={location.hash || undefined} />
    </div>
  );
}
