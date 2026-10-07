import { revalidatePath } from "next/cache";
import { api, browserMutation, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { productSchema, deleteSchema } from "@/lib/validation";
import { saveProduct, deleteProduct } from "@/lib/repository";

async function save(request: Request) {
  return api(async () => {
    await browserMutation(request, "admin-products");
    await requireAdmin();
    const product = await readJson(request, productSchema);
    const result = await saveProduct(product);
    revalidatePath("/", "layout");
    return { product: result };
  });
}
export const POST = save;
export const PUT = save;
export async function DELETE(request: Request) {
  return api(async () => {
    await browserMutation(request, "admin-products");
    await requireAdmin();
    const { id } = await readJson(request, deleteSchema, 4096);
    await deleteProduct(id);
    revalidatePath("/", "layout");
    return { success: true };
  });
}
