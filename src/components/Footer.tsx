import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useIstClock } from "../hooks/useInView";
import { StatusDot } from "./ui";
import { useScrollVar } from "../hooks/useScrollVar";
import { FooterFlow } from "./AnimeFx";
import { useContent } from "../content/store";
import { Blocks, EField, EImage, EText } from "../content/Editable";

/** Responsive default key visual; owner uploads use the single optimized source. */
const BAND = {
  src1280: "art/footer-band-1280.webp",
  src1920: "art/footer-band-1920.webp",
  width: 1280,
  height: 720,
};

function ArtBand() {
  const ref = useRef<HTMLElement>(null);
  const { content, editing } = useContent();
  const footer = content.footer;
  useScrollVar(ref);
  return (
    <figure ref={ref} className="art-band relative m-0 overflow-clip border-b border-ink bg-paper-deep">
      <EImage srcPath="footer.band" altPath="footer.bandAlt">
        {(src, alt) => (
          <picture>
            {src === BAND.src1280 && (
              <source type="image/webp" srcSet={`${BAND.src1280} 1280w, ${BAND.src1920} 1920w`} sizes="100vw" />
            )}
            <img
              src={src}
              width={BAND.width}
              height={BAND.height}
              alt={alt}
              loading="lazy"
              decoding="async"
              className="block aspect-video max-h-[70vh] min-h-[320px] w-full object-cover object-[right_bottom] sm:object-center"
            />
          </picture>
        )}
      </EImage>
      <figcaption className="relative p-4 sm:absolute sm:p-0 sm:top-1/2 sm:left-[max(var(--gutter),calc((100vw-var(--page-max))/2+var(--gutter)))] sm:max-w-[380px] sm:-translate-y-1/2">
        <div className="rounded-[var(--radius-xs)] border border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-ink)]">
          <p className="kicker text-ink-soft"><EText path="footer.bandKicker" label="Footer image kicker" /></p>
          <EText path="footer.bandLine" as="p" multiline className="mt-2 block font-display text-title text-ink sm:text-[30px] sm:leading-[1.1]" label="Footer image headline" />
          <div className="mt-4 flex flex-wrap gap-x-5">
            <a
              href={footer.telegramUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => editing && event.preventDefault()}
              className="group inline-flex min-h-11 items-center gap-1.5 text-md font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
            >
              <EText path="footer.telegramLabel" label="Telegram link label" />
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </a>
            <a
              href={footer.githubUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => editing && event.preventDefault()}
              className="group inline-flex min-h-11 items-center gap-1.5 text-md font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
            >
              <EText path="footer.githubLabel" label="GitHub link label" />
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </a>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <EField path="footer.telegramUrl" label="Telegram URL" type="url" />
            <EField path="footer.githubUrl" label="GitHub URL" type="url" />
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Footer() {
  const clock = useIstClock();
  return (
    <footer className="relative overflow-clip border-t border-ink bg-paper">
      <ArtBand />
      <div className="relative">
        <FooterFlow />
        <div className="page relative pt-16">
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-rule-strong bg-paper/70 px-4 py-2">
              <StatusDot tone="moss" label={<EText path="footer.availability" label="Availability status" />} />
              <span aria-hidden className="h-3 w-px bg-rule-strong" />
              <span className="font-mono text-xs text-graphite tabular">IST {clock}</span>
            </div>
          </div>

          <div className="relative mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
            <span className="font-mono text-xs text-graphite">© {new Date().getFullYear()} <EText path="brand.name" label="Site name" /></span>
            <span className="flex items-center gap-4">
              <EText path="footer.line" className="font-mono text-xs text-graphite" label="Footer line" />
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("v3:open-owner"))}
                className="inline-flex min-h-11 items-center font-mono text-xs text-graphite underline decoration-rule-strong underline-offset-4 transition-colors duration-[var(--dur-2)] hover:text-ink"
              >
                Owner
              </button>
            </span>
          </div>
          <p
            className="sig mt-12 -mb-[0.24em] select-none whitespace-nowrap font-display leading-[0.8] tracking-[-0.03em]"
            style={{ fontSize: "clamp(80px, 16vw, 240px)" }}
          >
            <EText path="footer.signature" label="Footer signature" />
          </p>
          <Blocks section="footer" />
        </div>
      </div>
    </footer>
  );
}
