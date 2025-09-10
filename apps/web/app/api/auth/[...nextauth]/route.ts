export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handlers } from "@/auth";   // <-- import handlers
export const { GET, POST } = handlers; // <-- destructure GET/POST from it



