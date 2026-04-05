import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useBrand } from "@/hooks/useBrand";

export function Header() {
  const brand = useBrand();
  const location = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/draw", label: "Run a Draw" },
    { href: "/verify", label: "Check a Result" },
    { href: "/about", label: "How it Works" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-navy/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-teal transition-colors"
            aria-label={`${brand.name} home`}
          >
            <ShieldCheck className="h-6 w-6 text-teal" />
            <span className="font-display text-xl font-semibold">{brand.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "text-teal"
                    : "text-[#8899AA] hover:text-[#F0F4F8]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu placeholder */}
          <div className="md:hidden flex items-center">
            <Link
              to="/draw"
              className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-navy hover:bg-teal/90 transition-colors"
            >
              Run a Draw
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
