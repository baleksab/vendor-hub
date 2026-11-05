import pg from "pg";

const UNIQUE_VIOLATION = "23505";

export function findUniqueViolation(error: unknown): pg.DatabaseError | undefined {
  const cause = error instanceof Error ? error.cause : undefined;

  return [error, cause].find(
    (candidate): candidate is pg.DatabaseError =>
      candidate instanceof pg.DatabaseError && candidate.code === UNIQUE_VIOLATION,
  );
}
