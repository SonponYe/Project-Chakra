import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB pre-compression guard

// Downscales + re-encodes as JPEG in the browser before upload, so large
// phone-camera photos don't chew through Supabase Storage quota.
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  return blob ?? file;
}

export async function uploadWorkerImage(
  supabase: SupabaseClient<Database>,
  workerId: string,
  moduleKey: string,
  file: File
): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image is too large (max 8MB).");
  }

  const compressed = await compressImage(file);
  const path = `${workerId}/${moduleKey}/${Date.now()}-${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from("worker-media").upload(path, compressed, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("worker-media").getPublicUrl(path);
  return data.publicUrl;
}
