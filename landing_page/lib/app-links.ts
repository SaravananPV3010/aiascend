/**
 * Centralised link targets for the PillMate landing page → app mapping.
 *
 * In development the main PillMate app runs on port 3000 while the
 * landing page runs on port 3001 (npm run dev -- -p 3001).
 * In production, replace PILLMATE_APP_URL with your deployed domain.
 */
export const PILLMATE_APP_URL =
  process.env.NEXT_PUBLIC_PILLMATE_APP_URL ?? "http://localhost:3000";

export const APP_LINKS = {
  /** Landing page root */
  home: "/",

  /** PillMate home page – primary CTA destination */
  getStarted: `${PILLMATE_APP_URL}`,

  /** Dashboard demo – lets visitors browse without signing in */
  viewDemo: `${PILLMATE_APP_URL}/medications`,

  /** Upload prescription flow */
  upload: `${PILLMATE_APP_URL}/upload`,

  /** Placeholder until app-store listings are live */
  appStore: "#",
  googlePlay: "#",
} as const;
