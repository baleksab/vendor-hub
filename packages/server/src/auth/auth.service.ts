import { UnauthorizedError } from "../shared/errors.ts";
import type { UserCredentialsLookup } from "../users/user.ts";
import type { LoginRequest, TokenResponse } from "./auth.schemas.ts";
import type { PasswordHasher } from "./password.service.ts";
import type { TokenService } from "./token.service.ts";

export class AuthService {
  private readonly lookup: UserCredentialsLookup;
  private readonly passwords: PasswordHasher;
  private readonly tokens: TokenService;
  private dummyHash: Promise<string> | undefined;

  constructor(lookup: UserCredentialsLookup, passwords: PasswordHasher, tokens: TokenService) {
    this.lookup = lookup;
    this.passwords = passwords;
    this.tokens = tokens;
  }

  async login(request: LoginRequest): Promise<TokenResponse> {
    const credentials = await this.lookup.findByEmail(request.email);

    if (credentials === undefined) {
      this.dummyHash ??= this.passwords.hash(crypto.randomUUID());
      await this.passwords.verify(await this.dummyHash, request.password);

      throw new UnauthorizedError("Invalid email or password");
    }

    if (!(await this.passwords.verify(credentials.passwordHash, request.password))) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const { accessToken, expiresIn } = await this.tokens.sign(credentials.id, credentials.role);

    return { accessToken, tokenType: "Bearer", expiresIn };
  }
}
