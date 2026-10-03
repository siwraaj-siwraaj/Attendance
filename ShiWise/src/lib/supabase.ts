import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mqopljtfdxblgivqtjas.supabase.co";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_bt6FL74d9JaPrFMTtE7dLw_ZHywJ0qJ";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
