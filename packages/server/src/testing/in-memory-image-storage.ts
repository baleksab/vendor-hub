import type { ImageStorage } from "../products/image-storage.ts";

export class InMemoryImageStorage implements ImageStorage {
  readonly files = new Map<string, Buffer>();

  async save(id: string, data: Buffer): Promise<void> {
    this.files.set(id, data);
  }

  async read(id: string): Promise<Buffer | undefined> {
    return this.files.get(id);
  }

  async remove(id: string): Promise<void> {
    this.files.delete(id);
  }
}
