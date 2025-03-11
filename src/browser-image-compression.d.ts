declare module 'browser-image-compression' {
  export interface Options {
    maxSizeMB: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    quality?: number;
    initialQuality?: number;
  }

  export default function imageCompression(file: File, options: Options): Promise<Blob>;
}