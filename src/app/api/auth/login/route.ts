import { api, browserMutation, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { loginAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  return api(async () => {
    await browserMutation(request, "login", 5, 300);
    const input = await readJson(request, loginSchema, 4096);
    return {
      success: true,
      ...(await loginAdmin(input.email, input.password)),
    };
  });
}
