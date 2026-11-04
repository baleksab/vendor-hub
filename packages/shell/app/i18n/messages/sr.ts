import type { Messages } from "../index";

export const sr = {
  "app.title": "Shell",
  "nav.home": "Početna",
  "nav.remoteTest": "Remote test",
  "language.label": "Jezik",
  "home.title": "Shell",
  "remoteTest.title": "Remote test",
  "remoteTest.hint": "Shell koristi React i Mantine.",
  "remoteTest.error.title": "Greška",
  "remoteTest.error.message": "Nije moguće učitati remote.",
} as const satisfies Messages;
