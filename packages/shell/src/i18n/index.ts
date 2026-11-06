import type { Locale } from "./locales";
import { en } from "./messages/en";
import { sr } from "./messages/sr";

export type Messages = Record<keyof typeof en, string>;

export type MessageKey = keyof Messages;

type ParamNames<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | ParamNames<Rest>
  : never;

export type PlainMessageKey = {
  [K in MessageKey]: [ParamNames<(typeof en)[K]>] extends [never] ? K : never;
}[MessageKey];

type Params<K extends MessageKey> = Record<ParamNames<(typeof en)[K]>, string | number>;

type TArgs<K extends MessageKey> = [ParamNames<(typeof en)[K]>] extends [never]
  ? [params?: undefined]
  : [params: Params<K>];

export type T = <K extends MessageKey>(key: K, ...args: TArgs<K>) => string;

const catalogs: Record<Locale, Messages> = { en, sr };

export function createT(locale: Locale): T {
  const messages = catalogs[locale];
  const plurals = new Intl.PluralRules(locale);

  return (key, ...[params]) => {
    const values: Record<string, string | number> = params ?? {};
    const count = values["count"];
    const pluralKey = typeof count === "number" ? `${key}.${plurals.select(count)}` : null;
    const message =
      pluralKey !== null && Object.hasOwn(messages, pluralKey)
        ? messages[pluralKey as MessageKey]
        : messages[key];

    return message.replace(/\{(\w+)\}/g, (_match, name: string) => String(values[name]));
  };
}

export function isMessageKey(value: string): value is PlainMessageKey {
  return Object.hasOwn(en, value) && !/\{\w+\}/.test(en[value as MessageKey]);
}
