// Storage abstraction layer for Vercel-compatible file storage
// Configurable via STORAGE_PROVIDER env var (supabase | s3 | local-demo)

export interface StorageProvider {
  uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getPrivateFileUrl(key: string): Promise<string>;
}

// Demo/local storage that stores files as base64 in memory (NOT for production)
class DemoStorageProvider implements StorageProvider {
  private store = new Map<string, { data: string; mimeType: string }>();

  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const ext = mimeType.split('/')[1] || 'bin';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    this.store.set(key, { data: buffer.toString('base64'), mimeType });
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getPrivateFileUrl(key: string): Promise<string> {
    const file = this.store.get(key);
    if (!file) return '';
    return `data:${file.mimeType};base64,${file.data}`;
  }
}

// Supabase storage provider (for production/Vercel)
class SupabaseStorageProvider implements StorageProvider {
  private url: string;
  private key: string;
  private bucket: string;

  constructor() {
    this.url = process.env.SUPABASE_URL || '';
    this.key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'kisti-uploads';
  }

  async uploadFile(buffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    const ext = fileName.split('.').pop() || 'bin';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // In production, this would use Supabase client:
    // const { error } = await supabase.storage.from(this.bucket).upload(key, buffer);
    // For demo, we simulate
    console.log(`[Storage] Would upload ${key} to Supabase bucket ${this.bucket}`);
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    console.log(`[Storage] Would delete ${key} from Supabase`);
  }

  async getPrivateFileUrl(key: string): Promise<string> {
    console.log(`[Storage] Would generate signed URL for ${key}`);
    return `/api/verification/file?key=${encodeURIComponent(key)}`;
  }
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!provider) {
    const storageProvider = process.env.STORAGE_PROVIDER || 'local-demo';
    switch (storageProvider) {
      case 'supabase':
        provider = new SupabaseStorageProvider();
        break;
      case 's3':
        // Future: S3StorageProvider
        provider = new DemoStorageProvider();
        break;
      default:
        provider = new DemoStorageProvider();
    }
  }
  return provider;
}
