import { api, browserMutation, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { orderUpdateSchema } from "@/lib/validation";
import { updateOrder } from "@/lib/repository";

export async function PATCH(request: Request) {
  return api(async () => {
    await browserMutation(request, "admin-orders");
    await requireAdmin();
    const { id, status, paymentStatus } = await readJson(
      request,
      orderUpdateSchema,
      4096,
    );
    await updateOrder(id, status, paymentStatus);
    return { success: true };
  });
}
