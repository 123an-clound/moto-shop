import { revalidatePath } from "next/cache";
import { api, browserMutation, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";
import { saveSettings } from "@/lib/repository";

export async function PUT(request: Request) {
  return api(async () => {
    await browserMutation(request, "admin-settings");
    await requireAdmin();
    const settings = await readJson(request, settingsSchema);
    await saveSettings(settings);
    revalidatePath("/", "layout");
    return { settings };
  });
}
