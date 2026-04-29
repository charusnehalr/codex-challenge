const fallbackUrl = "http://localhost:54321";
const fallbackKey = "placeholder-anon-key";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabaseConfig() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return {
    url: isHttpUrl(configuredUrl) ? configuredUrl : fallbackUrl,
    key: configuredKey.length > 0 ? configuredKey : fallbackKey,
  };
}
