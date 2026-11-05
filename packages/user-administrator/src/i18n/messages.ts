import type { Locale } from "@vendor-hub/types";

const en = {
  "common.retry": "Try again",
  "role.administrator": "Administrator",
  "role.regular": "Regular",
  "users.title": "Users",
  "users.description": "All accounts on the platform.",
  "users.total": "{total} users",
  "users.col.name": "Name",
  "users.col.email": "Email",
  "users.col.role": "Role",
  "users.col.country": "Country",
  "users.empty.title": "No users yet",
  "users.empty.description": "Accounts show up here after people register.",
  "users.error.title": "Could not load the users",
  "users.error.message": "Something went wrong. Check the connection and try again.",
  "users.pagination": "Pagination",
  "user.back": "Back to users",
  "user.loadError.title": "Could not load the user",
  "user.loadError.message": "Something went wrong. Check the connection and try again.",
  "user.notFound.title": "User not found",
  "user.notFound.message": "This user does not exist or was removed.",
  "user.form.email": "Email",
  "user.form.firstName": "First name",
  "user.form.lastName": "Last name",
  "user.form.address": "Address",
  "user.form.phoneNumber": "Phone number",
  "user.form.country": "Country (code)",
  "user.form.role": "Role",
  "user.form.password": "New password",
  "user.form.passwordHint": "Leave empty to keep the current password.",
  "user.form.save": "Save changes",
  "user.form.saved": "Changes saved.",
  "user.form.noChanges": "Nothing to save yet.",
  "user.form.rejected": "The changes were rejected.",
  "user.form.conflict": "This email is already used by another account.",
  "user.form.failed": "Could not save the changes. Try again.",
} as const;

export type MessageKey = keyof typeof en;

const sr = {
  "common.retry": "Pokušaj ponovo",
  "role.administrator": "Administrator",
  "role.regular": "Običan korisnik",
  "users.title": "Korisnici",
  "users.description": "Svi nalozi na platformi.",
  "users.total": "Ukupno korisnika: {total}",
  "users.col.name": "Ime",
  "users.col.email": "Email",
  "users.col.role": "Uloga",
  "users.col.country": "Država",
  "users.empty.title": "Još nema korisnika",
  "users.empty.description": "Nalozi se pojavljuju ovde kad se ljudi registruju.",
  "users.error.title": "Nije moguće učitati korisnike",
  "users.error.message": "Nešto je pošlo naopako. Proveri vezu i pokušaj ponovo.",
  "users.pagination": "Paginacija",
  "user.back": "Nazad na korisnike",
  "user.loadError.title": "Nije moguće učitati korisnika",
  "user.loadError.message": "Nešto je pošlo naopako. Proveri vezu i pokušaj ponovo.",
  "user.notFound.title": "Korisnik nije pronađen",
  "user.notFound.message": "Ovaj korisnik ne postoji ili je uklonjen.",
  "user.form.email": "Email",
  "user.form.firstName": "Ime",
  "user.form.lastName": "Prezime",
  "user.form.address": "Adresa",
  "user.form.phoneNumber": "Broj telefona",
  "user.form.country": "Država (kod)",
  "user.form.role": "Uloga",
  "user.form.password": "Nova lozinka",
  "user.form.passwordHint": "Ostavi prazno da lozinka ostane ista.",
  "user.form.save": "Sačuvaj izmene",
  "user.form.saved": "Izmene su sačuvane.",
  "user.form.noChanges": "Još nema šta da se sačuva.",
  "user.form.rejected": "Izmene su odbijene.",
  "user.form.conflict": "Ovaj email već koristi drugi nalog.",
  "user.form.failed": "Nije moguće sačuvati izmene. Pokušaj ponovo.",
} as const satisfies Record<MessageKey, string>;

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, sr };

export type T = (key: MessageKey, params?: Record<string, string | number>) => string;

export function createT(locale: Locale): T {
  const messages = catalogs[locale];

  return (key, params = {}) =>
    messages[key].replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name]));
}
