import { Link } from "react-router-dom";
import { Github, ShieldCheck } from "lucide-react";
import { useBrand } from "@/hooks/useBrand";
import { getCopyValue } from "@/hooks/useCopy";

export function Footer() {
  const brand = useBrand();

  return (
    <footer className="border-t border-border bg-[#060E1C] mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal" />
              <span className="font-display text-lg font-semibold text-white">{brand.name}</span>
            </div>
            <p className="text-sm text-[#8899AA] max-w-xs">
              {getCopyValue("footer.tagline")}
            </p>
            <p className="text-xs text-[#8899AA]/60">
              {getCopyValue("footer.attribution")}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6 text-sm text-[#8899AA]">
              <Link to="/" className="hover:text-teal transition-colors">Home</Link>
              <Link to="/draw" className="hover:text-teal transition-colors">Run a Draw</Link>
              <Link to="/verify" className="hover:text-teal transition-colors">Check a Result</Link>
              <Link to="/about" className="hover:text-teal transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#8899AA]">
              <a
                href={brand.legal.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-teal transition-colors"
                aria-label="View source code on GitHub"
              >
                <Github className="h-4 w-4" />
                {getCopyValue("footer.github_label")}
              </a>
              <span className="text-[#8899AA]/40">·</span>
              <span>{getCopyValue("footer.open_source")}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8899AA]/50">
          <span>© {new Date().getFullYear()} {brand.legal.copyright_holder}. {brand.legal.license} License.</span>
          <span>Built by {brand.attribution.author}</span>
        </div>
      </div>
    </footer>
  );
}
