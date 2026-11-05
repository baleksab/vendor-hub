import type { Messages } from "../index";

export const sr = {
  "app.title": "Vendor Hub",
  "nav.home": "Početna",
  "nav.remoteTest": "Remote test",
  "nav.menu": "Otvori navigaciju",
  "nav.label": "Glavna navigacija",
  "language.label": "Jezik",
  "home.title": "Vendor Hub",
  "home.subtitle":
    "Jedno mesto za vaše dobavljače, sastavljeno od nezavisno isporučenih micro frontend-ova.",
  "home.cta": "Otvori remote test",
  "remoteTest.title": "Remote test",
  "remoteTest.hint": "Shell koristi React i Mantine.",
  "remoteTest.error.title": "Greška",
  "remoteTest.error.message": "Nije moguće učitati remote.",
  "notFound.title": "Stranica nije pronađena",
  "notFound.message": "Stranica koju tražite ne postoji.",
  "notFound.back": "Nazad na početnu",
  "error.title": "Nešto je pošlo naopako",
  "error.message": "Došlo je do neočekivane greške. Pokušajte ponovo kasnije.",
  "seo.home.title": "Vendor Hub",
  "seo.home.description":
    "Jedno mesto za vaše dobavljače, sastavljeno od nezavisno isporučenih micro frontend-ova.",
  "seo.remoteTest.title": "Remote test",
  "seo.remoteTest.description":
    "Micro frontend koji se u shell učitava u toku rada preko Module Federation-a.",
  "seo.notFound.title": "Stranica nije pronađena",
  "seo.notFound.description": "Stranica koju tražite ne postoji.",
} as const satisfies Messages;
