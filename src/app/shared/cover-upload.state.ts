import { signal } from '@angular/core';

type UploadFn = (title: string, file: File) => Promise<string>;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
]);

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg'];

/**
 * Encapsulates all cover-upload state and logic shared between detail components.
 * Instantiate once per component: `readonly coverUpload = new CoverUploadState(...)`.
 */
export class CoverUploadState {
  readonly uploading = signal(false);
  readonly previewUrl = signal('');
  readonly selectedFileName = signal('');
  readonly error = signal<string | null>(null);

  private inputRef: HTMLInputElement | null = null;

  constructor(private readonly uploadFn: UploadFn) {}

  reset(existingUrl = ''): void {
    this.uploading.set(false);
    this.previewUrl.set(existingUrl);
    this.selectedFileName.set('');
    this.error.set(null);
    this.inputRef = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputRef = input;
    const file = input.files?.[0] ?? null;
    this.selectedFileName.set(file?.name ?? '');
    this.error.set(null);
    if (!file) return;

    const lowerCaseName = file.name.toLowerCase();
    const hasAllowedMimeType = !file.type || ALLOWED_MIME_TYPES.has(file.type);
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => lowerCaseName.endsWith(ext));
    if (!hasAllowedMimeType || !hasAllowedExtension) {
      this.selectedFileName.set('');
      this.error.set('Please select a supported image file.');
      input.value = '';
    }
  }

  canUpload(readyCondition: boolean): boolean {
    return !this.uploading() && !!(this.selectedFileName()) && readyCondition;
  }

  async upload(title: string): Promise<void> {
    const file = this.inputRef?.files?.[0] ?? null;
    if (!file || !title) return;

    this.uploading.set(true);
    this.error.set(null);
    try {
      const url = await this.uploadFn(title, file);
      this.previewUrl.set(url);
      this.selectedFileName.set(file.name);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to upload cover image.');
    } finally {
      this.uploading.set(false);
    }
  }
}
