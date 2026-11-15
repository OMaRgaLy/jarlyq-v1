'use client';

import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { adminApi } from '../lib/admin-api';

const MAX_BYTES = 1_700_000; // server accepts up to 1.8 MB
const MAX_SIDE = 1600;

/** Shrinks big photos in the browser so phone pictures fit under the server limit. */
async function shrink(file: File): Promise<File> {
  if (file.type === 'image/gif') return file; // would lose the animation
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_BYTES) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const q of [0.9, 0.8, 0.65]) {
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/webp', q));
    if (blob && blob.size <= MAX_BYTES) return new File([blob], 'image.webp', { type: 'image/webp' });
  }
  return file;
}

/**
 * "Upload from computer" button. Sends the picture to the server and hands the stored
 * address back through `onUploaded`, ready to be put into a logo / cover / photo field.
 * `as="admin"` signs the request with the admin token, `as="user"` with the user's cookies.
 */
export function ImageUpload({ onUploaded, as = 'user', label = '📁 Загрузить файл' }: {
  onUploaded: (url: string) => void;
  as?: 'user' | 'admin';
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(file?: File) {
    if (!file) return;
    setError('');
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError('Подойдут PNG, JPG, WebP или GIF');
      return;
    }
    setBusy(true);
    try {
      const ready = await shrink(file);
      if (ready.size > MAX_BYTES) {
        setError('Файл слишком большой, выберите поменьше (до 1.7 МБ)');
        return;
      }
      const body = new FormData();
      body.append('file', ready);
      const client = as === 'admin' ? adminApi : api;
      const { data } = await client.post<{ url: string }>('/uploads', body);
      onUploaded(data.url);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Не удалось загрузить файл');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        {busy ? 'Загружаем…' : label}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
