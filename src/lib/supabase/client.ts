import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

const { url, key } = getSupabaseConfig();

export const createClient = () => createBrowserClient(url, key);
