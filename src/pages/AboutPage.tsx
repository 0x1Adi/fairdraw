import { useState } from "react";
import { ChevronDown, ChevronUp, Github } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { getCopyValue } from "@/hooks/useCopy";
import { useBrand } from "@/hooks/useBrand";

export function AboutPage() {
  const [techOpen, setTechOpen] = useState(false);
  const brand = useBrand();

  const howItReallyWorks = [
    {
      title: getCopyValue("about.how_it_really_works.steps.0.title"),
      description: getCopyValue("about.how_it_really_works.steps.0.description"),
    },
    {
      title: getCopyValue("about.how_it_really_works.steps.1.title"),
      description: getCopyValue("about.how_it_really_works.steps.1.description"),
    },
    {
      title: getCopyValue("about.how_it_really_works.steps.2.title"),
      description: getCopyValue("about.how_it_really_works.steps.2.description"),
    },
    {
      title: getCopyValue("about.how_it_really_works.steps.3.title"),
      description: getCopyValue("about.how_it_really_works.steps.3.description"),
    },
  ];

  const storyParagraphs = [
    getCopyValue("about.story.paragraphs.0"),
    getCopyValue("about.story.paragraphs.1"),
    getCopyValue("about.story.paragraphs.2"),
    getCopyValue("about.story.paragraphs.3"),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
          {getCopyValue("about.hero.title")}
        </h1>
        <p className="text-lg text-[#8899AA] max-w-2xl mx-auto leading-relaxed">
          {getCopyValue("about.hero.description")}
        </p>
      </section>

      <Separator />

      {/* The Problem */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
          {getCopyValue("about.story.title")}
        </h2>
        <div className="space-y-4">
          {storyParagraphs.map((paragraph, i) => (
            <p key={i} className="text-[#8899AA] leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <Separator />

      {/* How it really works */}
      <section className="space-y-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
            {getCopyValue("about.how_it_really_works.title")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {howItReallyWorks.map((step, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full border border-teal/40 bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-teal text-xs font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-[#8899AA] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Attribution — Narayana Pandita */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
          {getCopyValue("about.attribution.title")}
        </h2>
        <p className="text-[#8899AA] leading-relaxed">
          {getCopyValue("about.attribution.description")}
        </p>

        <Card className="border-teal/20 bg-teal/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-teal/30 bg-teal/10 flex items-center justify-center shrink-0">
                <span className="text-teal font-display font-bold text-lg">न</span>
              </div>
              <div className="space-y-2">
                <p className="font-display font-bold text-white text-lg">
                  {getCopyValue("about.attribution.narayana.name")}
                </p>
                <p className="text-sm text-teal font-mono">
                  {getCopyValue("about.attribution.narayana.work")} · {getCopyValue("about.attribution.narayana.year")}
                </p>
                <p className="text-sm text-[#8899AA] leading-relaxed">
                  {getCopyValue("about.attribution.narayana.contribution")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-[#8899AA]">
          Full attribution: {brand.attribution.narayana_pandita.text} ({brand.attribution.narayana_pandita.date}, {brand.attribution.narayana_pandita.location}).{" "}
          {brand.attribution.narayana_pandita.contribution}
        </p>
      </section>

      <Separator />

      {/* For developers toggle */}
      <section>
        <Collapsible open={techOpen} onOpenChange={setTechOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-left hover:bg-card transition-colors"
              aria-expanded={techOpen}
            >
              <span className="font-medium text-[#F0F4F8]">
                {getCopyValue("about.technical_details.toggle_label")}
              </span>
              {techOpen ? (
                <ChevronUp className="h-4 w-4 text-[#8899AA]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#8899AA]" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="rounded-b-lg border border-t-0 border-border bg-card p-6 space-y-4">
              <pre className="font-mono text-sm text-[#8899AA] whitespace-pre-wrap leading-relaxed">
                {getCopyValue("about.technical_details.content")}
              </pre>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-white mb-3">Algorithm comparison</h3>
                <div className="overflow-auto">
                  <table className="w-full text-xs text-[#8899AA]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-[#F0F4F8]">Method</th>
                        <th className="text-left py-2 pr-4">Verifiable</th>
                        <th className="text-left py-2 pr-4">Constraint-safe</th>
                        <th className="text-left py-2 pr-4">Uniform</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {[
                        ["Rejection sampling", "✗", "✗", "✓ (slow)"],
                        ["Fisher-Yates", "✓", "✗", "✓"],
                        ["Our approach (FPE + cycle-walking)", "✓", "✓", "✓"],
                      ].map(([method, ...rest]) => (
                        <tr key={method} className="border-b border-border/50">
                          <td className="py-2 pr-4 text-[#F0F4F8]">{method}</td>
                          {rest.map((v, i) => (
                            <td key={i} className={`py-2 pr-4 ${v === "✓" ? "text-teal" : "text-destructive"}`}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <a
                  href={brand.legal.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-teal hover:underline"
                  aria-label="View source on GitHub"
                >
                  <Github className="h-4 w-4" />
                  View source on GitHub
                </a>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Author */}
      <section className="text-center space-y-2 pb-8">
        <p className="text-sm text-[#8899AA]">
          {getCopyValue("about.author.credit")} · {getCopyValue("about.author.project")}
        </p>
      </section>
    </div>
  );
}
