export function bucketFormatter(locale: string): (bucket: string) => string {
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (bucket) => format.format(new Date(`${bucket}T00:00:00.000Z`));
}
