import { api, browserMutation, readJson } from "@/lib/http";
import { testDriveSchema } from "@/lib/validation";
import { createTestDrive } from "@/lib/repository";

export async function POST(request: Request) {
  return api(async () => {
    await browserMutation(request, "test-drives", 5, 300);
    const input = await readJson(request, testDriveSchema, 8192);
    return { booking: await createTestDrive(input) };
  });
}
