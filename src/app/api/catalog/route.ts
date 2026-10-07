import { api } from "@/lib/http";
import { getProducts, getSettings } from "@/lib/repository";

export async function GET() {
  return api(async () => {
    const [products, settings] = await Promise.all([
      getProducts(),
      getSettings(),
    ]);
    return { products, settings };
  });
}
