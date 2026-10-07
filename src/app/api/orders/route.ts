import { api, browserMutation, readJson } from "@/lib/http";
import { orderSchema } from "@/lib/validation";
import { createOrder } from "@/lib/repository";

export async function POST(request: Request) {
  return api(async () => {
    await browserMutation(request, "orders", 10, 300);
    return createOrder(await readJson(request, orderSchema, 16384));
  });
}
