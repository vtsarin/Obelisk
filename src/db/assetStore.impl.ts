import { getDB } from './idb';
import { newId } from '@/lib/ids';
import type { AssetStore } from './interfaces';
import type { ID, AssetRecord } from '@/types/models';

class AssetStoreImpl implements AssetStore {
  private urlCache = new Map<string, string>();

  async put(docId: ID, file: File | Blob, filename?: string): Promise<string> {
    const db = await getDB();
    const name = filename ?? `${newId()}.${this.guessExtension(file)}`;
    const path = `assets/${docId}/images/${name}`;

    const record: AssetRecord = {
      path,
      docId,
      blob: file,
      mime: file.type || 'application/octet-stream',
      createdAt: Date.now(),
    };

    await db.put('assets', record);
    return path;
  }

  async getURL(path: string): Promise<string> {
    const cached = this.urlCache.get(path);
    if (cached) return cached;

    const blob = await this.getBlob(path);
    if (!blob) return '';

    const url = URL.createObjectURL(blob);
    this.urlCache.set(path, url);
    return url;
  }

  async getBlob(path: string): Promise<Blob | null> {
    const db = await getDB();
    const record = await db.get('assets', path);
    return record?.blob ?? null;
  }

  async list(docId: ID): Promise<AssetRecord[]> {
    const db = await getDB();
    const records = await db.getAllFromIndex('assets', 'by-doc', docId);
    return records as AssetRecord[];
  }

  async remove(path: string): Promise<void> {
    const db = await getDB();
    await db.delete('assets', path);

    const url = this.urlCache.get(path);
    if (url) {
      URL.revokeObjectURL(url);
      this.urlCache.delete(path);
    }
  }

  destroy(): void {
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.urlCache.clear();
  }

  private guessExtension(file: File | Blob): string {
    if ('name' in file && file.name) {
      const ext = file.name.split('.').pop();
      if (ext) return ext;
    }
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    return mimeMap[file.type] ?? 'bin';
  }
}

export const assetStore = new AssetStoreImpl();
