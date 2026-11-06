import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ImageStorage = {
  save(id: string, data: Buffer): Promise<void>;
  read(id: string): Promise<Buffer | undefined>;
  remove(id: string): Promise<void>;
};

export class FileSystemImageStorage implements ImageStorage {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  async save(id: string, data: Buffer): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.pathOf(id), data);
  }

  async read(id: string): Promise<Buffer | undefined> {
    try {
      return await readFile(this.pathOf(id));
    } catch (error) {
      if (isMissingFile(error)) {
        return undefined;
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await rm(this.pathOf(id), { force: true });
  }

  private pathOf(id: string): string {
    return join(this.directory, id);
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
