import { api } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/repository";

export async function GET() {
  return api(async () => {
    await requireAdmin();
    return getAdminSnapshot();
  });
}
