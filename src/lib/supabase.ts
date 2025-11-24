import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버사이드에서 사용하는 Supabase 클라이언트 (쿠키 기반 인증)
export async function createServerSupabaseClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          return cookieStore.get(key)?.value;
        },
        setItem: async (key: string, value: string) => {
          cookieStore.set(key, value);
        },
        removeItem: async (key: string) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}
