export const queryKeys = {
  session: {
    all: ["session"] as const,
    current: () => [...queryKeys.session.all, "current"] as const,
  },
  countries: {
    list: () => ["countries", "list"] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
};
