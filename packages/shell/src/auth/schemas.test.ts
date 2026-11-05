import { describe, expect, it } from "vitest";

import { createRegisterSchema, loginSchema, toCreateUserRequest } from "./schemas";

const valid = {
  email: "  Jane@Example.com ",
  password: "correct-horse",
  confirmPassword: "correct-horse",
  firstName: " Jane ",
  lastName: "Doe",
  address: "Main street 1",
  phoneNumber: "+381601234567",
  country: "RS",
};

const schema = createRegisterSchema(["RS", "DE"]);

function messagesFor(input: object, path: string): string[] {
  const result = schema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.filter((issue) => issue.path.join(".") === path).map((i) => i.message);
}

describe("loginSchema", () => {
  it("normalizes email and only requires a password", () => {
    expect(loginSchema.parse({ email: " A@B.io ", password: "x" })).toEqual({
      email: "a@b.io",
      password: "x",
    });
  });

  it("rejects an empty password and a bad email", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      "validation.email",
      "validation.required",
    ]);
  });
});

describe("register schema", () => {
  it("accepts valid input and trims and lowercases", () => {
    const parsed = schema.parse(valid);

    expect(parsed.email).toBe("jane@example.com");
    expect(parsed.firstName).toBe("Jane");
  });

  it("builds a request without confirmPassword", () => {
    const request = toCreateUserRequest(schema.parse(valid));

    expect(request).not.toHaveProperty("confirmPassword");
    expect(request.country).toBe("RS");
  });

  it("enforces password length 8..128", () => {
    expect(
      messagesFor({ ...valid, password: "short", confirmPassword: "short" }, "password"),
    ).toEqual(["validation.password.min"]);
    const long = "x".repeat(129);

    expect(messagesFor({ ...valid, password: long, confirmPassword: long }, "password")).toEqual([
      "validation.password.max",
    ]);
  });

  it("requires matching passwords", () => {
    expect(messagesFor({ ...valid, confirmPassword: "other-pass" }, "confirmPassword")).toEqual([
      "validation.passwordMismatch",
    ]);
  });

  it.each(["0601234567", "+0601234567", "+38160", "+381 60 1234567"])(
    "rejects phone %s",
    (phoneNumber) => {
      expect(messagesFor({ ...valid, phoneNumber }, "phoneNumber")).toEqual(["validation.phone"]);
    },
  );

  it("requires names and address within limits", () => {
    expect(messagesFor({ ...valid, firstName: "  " }, "firstName")).toEqual([
      "validation.required",
    ]);
    expect(messagesFor({ ...valid, lastName: "x".repeat(101) }, "lastName")).toEqual([
      "validation.tooLong",
    ]);
    expect(messagesFor({ ...valid, address: "x".repeat(256) }, "address")).toEqual([
      "validation.tooLong",
    ]);
  });

  it("limits email length", () => {
    const email = `${"a".repeat(250)}@b.io`;

    expect(messagesFor({ ...valid, email }, "email")).toContain("validation.tooLong");
  });

  it("only accepts countries from the fetched list", () => {
    expect(messagesFor({ ...valid, country: "FR" }, "country")).toEqual(["validation.country"]);
    expect(messagesFor({ ...valid, country: "" }, "country")).toContain("validation.required");
  });
});
