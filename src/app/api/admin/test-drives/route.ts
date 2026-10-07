import { api, browserMutation, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { testDriveUpdateSchema } from "@/lib/validation";
import { updateTestDrive } from "@/lib/repository";

export async function PATCH(request: Request) {
  return api(async () => {
    await browserMutation(request, "admin-test-drives");
    await requireAdmin();
    const { id, status } = await readJson(request, testDriveUpdateSchema, 4096);
    await updateTestDrive(id, status);
    return { success: true };
  });
}
