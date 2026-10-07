import { api, sameOrigin } from "@/lib/http";
import { logoutAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await logoutAdmin();
    return { success: true };
  });
}
