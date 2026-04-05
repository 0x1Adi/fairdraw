import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle, EyeOff, CheckCircle, ClipboardList, Dice5, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PresetSelector } from "@/components/setup/PresetSelector";
import { useBrand } from "@/hooks/useBrand";
import { getCopyValue } from "@/hooks/useCopy";
import { useFeaturedPresets } from "@/hooks/usePresets";
import type { PresetConfig } from "@/config/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HOW_IT_WORKS_ICONS = [ClipboardList, Dice5, Shield];

const TRUST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "alert-triangle": AlertTriangle,
  "eye-off": EyeOff,
  "check-circle": CheckCircle,
};

export function HomePage() {
  const brand = useBrand();
  const navigate = useNavigate();
  const [_selectedPreset, setSelectedPreset] = useState<PresetConfig | null>(null);

  function handlePresetSelect(preset: PresetConfig | null) {
    setSelectedPreset(preset);
    if (preset) {
      navigate(`/draw/${preset.id}`);
    } else {
      navigate("/draw");
    }
  }

  const howItWorks = [
    {
      number: 1,
      title: getCopyValue("home.how_it_works.steps.0.title"),
      description: getCopyValue("home.how_it_works.steps.0.description"),
    },
    {
      number: 2,
      title: getCopyValue("home.how_it_works.steps.1.title"),
      description: getCopyValue("home.how_it_works.steps.1.description"),
    },
    {
      number: 3,
      title: getCopyValue("home.how_it_works.steps.2.title"),
      description: getCopyValue("home.how_it_works.steps.2.description"),
    },
  ];

  const trustPoints = [
    {
      iconKey: "alert-triangle",
      title: getCopyValue("home.trust_section.points.0.title"),
      description: getCopyValue("home.trust_section.points.0.description"),
    },
    {
      iconKey: "eye-off",
      title: getCopyValue("home.trust_section.points.1.title"),
      description: getCopyValue("home.trust_section.points.1.description"),
    },
    {
      iconKey: "check-circle",
      title: getCopyValue("home.trust_section.points.2.title"),
      description: getCopyValue("home.trust_section.points.2.description"),
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Geometric background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg
            className="absolute top-0 right-0 w-1/2 h-full opacity-5"
            viewBox="0 0 600 800"
            fill="none"
          >
            <polygon points="300,0 600,200 600,600 300,800 0,600 0,200" stroke="#00E5A0" strokeWidth="1" fill="none" />
            <polygon points="300,100 500,250 500,550 300,700 100,550 100,250" stroke="#00E5A0" strokeWidth="0.5" fill="none" />
            <polygon points="300,200 400,300 400,500 300,600 200,500 200,300" stroke="#00E5A0" strokeWidth="0.3" fill="none" />
            <line x1="300" y1="0" x2="300" y2="800" stroke="#00E5A0" strokeWidth="0.3" />
            <line x1="0" y1="400" x2="600" y2="400" stroke="#00E5A0" strokeWidth="0.3" />
          </svg>
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-teal/3 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-[#FFB547]/3 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 text-sm text-teal mb-8">
              <ShieldCheck className="h-4 w-4" />
              {brand.tagline}
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              {getCopyValue("home.hero.headline")}
            </h1>

            <p className="text-xl text-[#8899AA] mb-10 max-w-xl leading-relaxed">
              {getCopyValue("home.hero.subheadline")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/draw">
                <Button size="xl" className="w-full sm:w-auto font-semibold">
                  {getCopyValue("home.hero.cta_primary")}
                </Button>
              </Link>
              <Link to="/verify">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  {getCopyValue("home.hero.cta_secondary")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-[#060E1C]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              {getCopyValue("home.how_it_works.title")}
            </h2>
            <p className="text-[#8899AA] text-lg">
              {getCopyValue("home.how_it_works.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => {
              const Icon = HOW_IT_WORKS_ICONS[i];
              return (
                <div key={step.number} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-teal/30 bg-teal/10">
                      <span className="font-display font-bold text-teal text-lg">
                        {step.number}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-teal" />
                        <h3 className="font-semibold text-white">{step.title}</h3>
                      </div>
                      <p className="text-[#8899AA] text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 left-full w-8 border-t border-dashed border-border z-10 -ml-4" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why this matters */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              {getCopyValue("home.trust_section.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {trustPoints.map((point, i) => {
              const Icon = TRUST_ICONS[point.iconKey] ?? ShieldCheck;
              return (
                <Card key={i} className="border-border">
                  <CardContent className="p-6">
                    <Icon
                      className={`h-6 w-6 mb-4 ${
                        i === 0 ? "text-[#FFB547]" : i === 1 ? "text-[#8899AA]" : "text-teal"
                      }`}
                    />
                    <h3 className="font-semibold text-white mb-2">{point.title}</h3>
                    <p className="text-sm text-[#8899AA] leading-relaxed">
                      {point.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Presets */}
      <section className="py-20 bg-[#060E1C]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PresetSelector selected={null} onSelect={handlePresetSelect} />
        </div>
      </section>
    </div>
  );
}
