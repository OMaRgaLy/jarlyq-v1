/** Path prefix of files uploaded through POST /uploads (served by the backend). */
export const UPLOAD_PREFIX = '/api/v1/uploads/';

export function isUpload(url?: string | null): boolean {
  return !!url && url.startsWith(UPLOAD_PREFIX);
}

/** True when `url` can be put into <img src>: an http(s) link or one of our uploads. */
export function isImageSrc(url?: string | null): url is string {
  return !!url && (url.startsWith('http') || isUpload(url));
}
