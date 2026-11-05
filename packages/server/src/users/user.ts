import type { UserRole } from "./user-role.ts";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  country: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt"> & {
  passwordHash: string;
};

export type UserPatch = Partial<Omit<User, "id" | "createdAt" | "updatedAt">> & {
  passwordHash?: string;
};

export type UserCredentials = {
  id: string;
  role: UserRole;
  passwordHash: string;
};

export type UserCredentialsLookup = {
  findByEmail(email: string): Promise<UserCredentials | undefined>;
};
