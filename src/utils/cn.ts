import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge taught about the custom --text-* size tokens, so `text-display` and `text-ink` never collide. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["micro", "md", "lede", "title", "page", "display", "hero"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
