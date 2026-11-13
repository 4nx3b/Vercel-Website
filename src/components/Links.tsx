import { ArrowUpRight } from "lucide-react";
import { useContent } from "../content/store";
import { Blocks, EField, EText } from "../content/Editable";
import { Reveal } from "./Reveal";
import { Kicker } from "./ui";

export function Links() {
  const { content, editing } = useContent();
  const socials = content.socials;
  return (
    <section id="links" aria-labelledby="links-title" className="sunk-scope border-t border-rule">
      <div className="page grid gap-10 py-20 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16 lg:py-24">
        <Reveal>
          <Kicker className="text-ink-soft">
            <EText path="links.sectionLabel" label="Links section label" />
          </Kicker>
          <EText path="links.title" as="h2" className="mt-4 block font-display text-page font-normal text-ink" label="Links heading" />
          <EText path="links.description" as="p" multiline className="mt-4 block max-w-[44ch] text-lg text-ink-soft" label="Links description" />
        </Reveal>

        <Reveal delay={80}>
          <ul className="scroll-stagger grid border-t border-ink sm:grid-cols-2 sm:gap-x-10">
            {socials.map((social, index) => (
              <li key={`${social.name}-${index}`} className="border-b border-rule">
                <a
                  href={social.url}
                  target={social.url.startsWith("#") ? undefined : "_blank"}
                  rel="noreferrer"
                  onClick={(event) => editing && event.preventDefault()}
                  className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors duration-[var(--dur-2)]"
                >
                  <span className="text-lg text-ink group-hover:text-vermilion-ink">
                    <EText path={`socials.${index}.name`} label={`Social link ${index + 1} name`} />
                  </span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate font-mono text-xs text-ink-soft">
                      <EText path={`socials.${index}.handle`} label={`Social link ${index + 1} handle`} />
                    </span>
                    <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-ink-soft group-hover:text-ink" strokeWidth={1.75} />
                  </span>
                </a>
                <EField path={`socials.${index}.url`} label={`${social.name} URL`} type="url" />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <div className="page pb-16"><Blocks section="links" /></div>
    </section>
  );
}
