// Augment the File System Access API surface that isn't in the default TS lib.
export {};

declare global {
  interface FileSystemHandle {
    queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  }

  interface Window {
    showDirectoryPicker?(options?: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: FileSystemHandle | string;
    }): Promise<FileSystemDirectoryHandle>;
  }
}
