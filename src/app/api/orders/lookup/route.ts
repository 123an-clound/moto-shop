import { api, browserMutation, readJson } from "@/lib/http";
import { lookupSchema } from "@/lib/validation";
import { lookupOrder } from "@/lib/repository";

export async function POST(request: Request) {
  return api(async () => {
    await browserMutation(request, "lookup", 10, 300);
    const { code, phone } = await readJson(request, lookupSchema, 4096);
    return { order: await lookupOrder(code, phone) };
  });
}
