import { describe, expect, it } from "vitest";

import { CreateUserRequest, UpdateUserRequest } from "./users.schemas.ts";

const valid = {
  email: "jane@example.com",
  password: "correct-horse-battery",
  firstName: "Jane",
  lastName: "Doe",
  address: "Main street 1",
  phoneNumber: "+381601234567",
  country: "RS",
};

describe("CreateUserRequest", () => {
  it("accepts a valid body and normalizes the email", () => {
    expect(CreateUserRequest.parse({ ...valid, email: "  Jane@Example.COM " }).email).toBe(
      "jane@example.com",
    );
  });

  it.each(Object.keys(valid))("requires %s", (field) => {
    const body: Record<string, unknown> = { ...valid };
    delete body[field];
    const result = CreateUserRequest.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });

  it("rejects a bad phone number and a bad country", () => {
    expect(CreateUserRequest.safeParse({ ...valid, phoneNumber: "381 60 123" }).success).toBe(
      false,
    );
    expect(CreateUserRequest.safeParse({ ...valid, country: "XX" }).success).toBe(false);
    expect(CreateUserRequest.safeParse({ ...valid, country: "rs" }).success).toBe(false);
  });

  it("strips a role field", () => {
    expect(CreateUserRequest.parse({ ...valid, role: "administrator" })).not.toHaveProperty("role");
  });
});

describe("UpdateUserRequest", () => {
  it("rejects an empty body", () => {
    expect(UpdateUserRequest.safeParse({}).success).toBe(false);
  });

  it("accepts a partial body with a role", () => {
    expect(UpdateUserRequest.parse({ role: "administrator" })).toEqual({ role: "administrator" });
  });
});
