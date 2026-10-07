import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
const customer = "Kiểm thử E2E MotoShop";
const productName = "Xe kiểm thử E2E MotoShop";
const testPhone = "0901234567";
async function login(page: Page) {
  await page.goto("/admin/dang-nhap");
  await page.getByLabel("Email quản trị").fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tổng quan", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Dữ liệu cục bộ", { exact: true })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function a11y(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      description: v.description,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}
test.afterAll(() => {
  if (existsSync(".local/store.json")) {
    const store = JSON.parse(readFileSync(".local/store.json", "utf8"));
    for (const order of store.orders.filter(
      (o: { fullName: string; status: string }) =>
        o.fullName === customer && o.status !== "cancelled",
    )) {
      for (const item of order.items) {
        const variant = store.products
          .find((p: { id: string }) => p.id === item.productId)
          ?.variants.find((v: { id: string }) => v.id === item.variantId);
        if (variant) variant.stock += item.quantity;
      }
    }
    store.orders = store.orders.filter(
      (o: { fullName: string }) => o.fullName !== customer,
    );
    store.testDrives = store.testDrives.filter(
      (l: { fullName: string }) => l.fullName !== customer,
    );
    store.products = store.products.filter(
      (p: { name: string }) => p.name !== productName,
    );
    writeFileSync(".local/store.json", JSON.stringify(store, null, 2));
  }
});
test("storefront filters, colors, estimates and accessible test ride modal", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Chọn xe",
  );
  await page.screenshot({
    path: "docs/artifacts/home-desktop.png",
    fullPage: true,
  });
  await a11y(page);
  await noOverflow(page);
  await page.goto("/xe?loai=electric");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Xe máy điện",
  );
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.getByLabel("Thương hiệu", { exact: true }).selectOption("VinFast");
  await expect(page.locator(".product-card")).toHaveCount(5);
  await page.getByLabel("Tìm tên xe hoặc thương hiệu").fill("zz-no-match");
  await expect(
    page.getByRole("heading", { name: "Chưa tìm thấy mẫu xe phù hợp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.goto("/xe/honda-vision");
  const firstSrc = await page.locator(".detail-photo img").getAttribute("src");
  await page.getByRole("button", { name: "Chọn màu Đen", exact: true }).click();
  expect(
    await page.locator(".detail-photo img").getAttribute("src"),
  ).not.toEqual(firstSrc);
  const initial = await page.locator(".installment-result strong").innerText();
  await page.getByLabel("Kỳ hạn", { exact: true }).selectOption("24");
  expect(
    await page.locator(".installment-result strong").innerText(),
  ).not.toEqual(initial);
  await page
    .getByRole("button", { name: "Đăng ký lái thử", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await a11y(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Đăng ký lái thử", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Đăng ký lái thử", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Họ và tên").fill(customer);
  await dialog.getByLabel("Số điện thoại").fill(testPhone);
  await dialog
    .getByLabel("Ngày mong muốn")
    .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  await dialog
    .getByLabel("Showroom", { exact: false })
    .selectOption({ index: 1 });
  await dialog.getByRole("button", { name: "Gửi đăng ký lái thử" }).click();
  await expect(dialog.getByRole("status")).toContainText("Đã nhận đăng ký");
  await page.keyboard.press("Escape");
  await a11y(page);
  await page.screenshot({
    path: "docs/artifacts/product-desktop.png",
    fullPage: true,
  });
});
test("cart order persists, tracking requires code and phone, admin confirms/cancels", async ({
  page,
}) => {
  await page.goto("/xe/honda-vision");
  await page.getByRole("button", { name: "Đặt xe trực tuyến" }).click();
  await page.getByRole("link", { name: /Xem giỏ & đặt xe/ }).click();
  await page.getByLabel("Họ và tên").fill(customer);
  await page.getByLabel("Số điện thoại").fill(testPhone);
  await page.getByLabel("Địa chỉ liên hệ").fill("Địa chỉ dữ liệu kiểm thử");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận đặt xe" }).click();
  await expect(
    page.getByRole("heading", { name: "Đã nhận yêu cầu đặt xe" }),
  ).toBeVisible();
  const code = (await page.getByTestId("order-code").innerText()).trim();
  await page.getByRole("link", { name: "Tra cứu trạng thái đơn" }).click();
  await page.getByLabel("Số điện thoại đã đặt xe").fill("0907654321");
  await page
    .getByRole("button", { name: "Tra cứu đơn hàng", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Không tìm thấy" }),
  ).toBeVisible();
  await page.getByLabel("Số điện thoại đã đặt xe").fill(testPhone);
  await page
    .getByRole("button", { name: "Tra cứu đơn hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đơn " + code }),
  ).toBeVisible();
  await expect(page.getByText("Chờ xác nhận", { exact: true })).toBeVisible();
  await login(page);
  await page.getByRole("button", { name: "Đơn đặt xe", exact: true }).click();
  await page
    .getByLabel("Trạng thái đơn " + code, { exact: true })
    .selectOption("confirmed");
  await expect(page.getByRole("status")).toContainText("Đã cập nhật đơn");
  await page
    .getByLabel("Trạng thái đơn " + code, { exact: true })
    .selectOption("cancelled");
  await expect(page.getByRole("status")).toContainText("Đã cập nhật đơn");
  await page.goto("/tra-cuu?ma=" + code);
  await page.getByLabel("Số điện thoại đã đặt xe").fill(testPhone);
  await page
    .getByRole("button", { name: "Tra cứu đơn hàng", exact: true })
    .click();
  await expect(page.getByText("Đã hủy", { exact: true })).toBeVisible();
});
test("admin creates, edits and deletes products, saves blank optional settings, manages leads", async ({
  page,
}) => {
  await login(page);
  await page.screenshot({
    path: "docs/artifacts/admin-desktop.png",
    fullPage: true,
  });
  await a11y(page);
  await page.getByRole("button", { name: "Sản phẩm", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm sản phẩm", exact: true })
    .click();
  await page.getByLabel("Tên sản phẩm", { exact: true }).fill(productName);
  await page.getByLabel("Thương hiệu", { exact: true }).fill("MotoShop");
  await page.getByLabel("Giá niêm yết (đ)", { exact: true }).fill("34567891");
  await page.getByLabel("Tên màu", { exact: true }).fill("Đen");
  await page.getByLabel("Số lượng tồn", { exact: true }).fill("2");
  await page
    .getByLabel("URL hình ảnh", { exact: false })
    .fill(
      "/images/products/honda-vision-0.webp\n/images/products/honda-vision-1.webp",
    );
  await page.getByLabel("Hiển thị trên website", { exact: true }).check();
  await page
    .getByRole("button", { name: "Thêm thông số", exact: true })
    .click();
  await page
    .getByLabel("Thuộc tính 1", { exact: true })
    .fill("Dung tích thử nghiệm");
  await page.getByLabel("Giá trị 1", { exact: true }).fill("125 cc");
  await page
    .getByRole("button", { name: "Lưu sản phẩm", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Đã lưu sản phẩm");
  await page
    .getByRole("button", { name: "Sửa " + productName, exact: true })
    .click();
  await page.getByLabel("Giá niêm yết (đ)", { exact: true }).fill("35567891");
  await page
    .getByRole("button", { name: "Lưu sản phẩm", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Đã lưu sản phẩm");
  const response = await page.request.get("/api/catalog");
  const { products } = await response.json();
  const edited = products.find((p: { name: string }) => p.name === productName);
  expect(edited.price).toBe(35567891);
  expect(edited.variants[0].images).toHaveLength(2);
  expect(edited.specs[0].value).toBe("125 cc");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Xóa " + productName, exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Đã xóa sản phẩm");
  await page
    .getByRole("button", { name: "Giao diện & cấu hình", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lưu cấu hình", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Đã lưu cấu hình");
  await page.getByRole("button", { name: "Lịch lái thử", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: customer });
  if (await row.count()) {
    await row.getByRole("combobox").selectOption("confirmed");
    await expect(page.getByRole("status")).toContainText(
      "Đã cập nhật lịch lái thử",
    );
  }
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Đăng nhập quản trị" }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin")).status()).toBe(401);
});
test("mobile and dark mode remain usable with no overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await noOverflow(page);
  await expect(
    page.getByRole("navigation", { name: "Điều hướng nhanh" }),
  ).toBeVisible();
  await a11y(page);
  await page.screenshot({
    path: "docs/artifacts/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await a11y(page);
  await page.screenshot({
    path: "docs/artifacts/home-dark.png",
    fullPage: true,
  });
  await page.goto("/xe");
  await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
  await expect(page.getByLabel("Thương hiệu", { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.goto("/xe/honda-vision");
  await noOverflow(page);
  await a11y(page);
  await page.screenshot({
    path: "docs/artifacts/product-mobile.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".detail-photo")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
test("private APIs reject anonymous changes and public HTML has product metadata", async ({
  request,
}) => {
  expect((await request.get("/api/admin")).status()).toBe(401);
  expect(
    (
      await request.put("/api/admin/settings", {
        data: {},
        headers: { Origin: "http://127.0.0.1:3000" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/orders", {
        data: {},
        headers: { Origin: "https://example.com" },
      })
    ).status(),
  ).toBe(403);
  const html = await (await request.get("/xe/honda-vision")).text();
  expect(html).toContain("application/ld+json");
  expect(html).toContain('"@type":"Product"');
  expect(html).toContain("og:image");
  expect(html).toContain('rel="canonical"');
  const catalog = await (await request.get("/api/catalog")).json();
  expect(catalog.products).toHaveLength(30);
  expect(catalog).not.toHaveProperty("orders");
});

test("admin uploads images and publishes branding, reviews and mobile banners", async ({
  page,
}) => {
  await login(page);
  const original = (await (await page.request.get("/api/admin")).json())
    .settings;
  let uploaded = "";
  try {
    await page
      .getByRole("button", { name: "Giao diện & cấu hình", exact: true })
      .click();
    await a11y(page);
    const upload = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/admin/upload") &&
        r.request().method() === "POST",
    );
    await page
      .getByLabel("Tải Logo", { exact: true })
      .setInputFiles("public/images/products/honda-vision-0.webp");
    const response = await upload;
    expect(response.status()).toBe(200);
    uploaded = (await response.json()).url;
    await expect(page.getByLabel("URL Logo", { exact: true })).toHaveValue(
      uploaded,
    );
    await page.getByLabel("URL Favicon", { exact: true }).fill(uploaded);
    await page
      .getByLabel("Tên website", { exact: true })
      .fill("MotoShop kiểm thử");
    await page.getByLabel("Đánh giá khách hàng", { exact: true }).check();
    await page
      .getByRole("button", { name: "Thêm đánh giá", exact: true })
      .click();
    await page
      .getByLabel("Tên khách 1", { exact: true })
      .fill("Nội dung kiểm thử");
    await page
      .getByLabel("Mẫu xe đánh giá 1", { exact: true })
      .fill("Honda Vision");
    await page
      .getByLabel("Nội dung đánh giá 1", { exact: true })
      .fill("Nội dung kiểm thử tự động, sẽ được xóa sau kiểm tra.");
    await page
      .getByRole("button", { name: "Lưu cấu hình", exact: true })
      .first()
      .click();
    await expect(page.getByRole("status")).toContainText("Đã lưu cấu hình");
    await page.goto("/");
    await expect(page).toHaveTitle(/MotoShop kiểm thử/);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      uploaded,
    );
    await expect(
      page.getByRole("heading", { name: "Khách hàng kể chuyện xe" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".brand-logo")
          .first()
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Xem banner 2" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Điện năng",
    );
    await noOverflow(page);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Tổng quan", exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await a11y(page);
    await page.screenshot({
      path: "docs/artifacts/admin-mobile.png",
      fullPage: true,
    });
    const invalid = await page.request.post("/api/admin/upload", {
      headers: { Origin: "http://127.0.0.1:3000" },
      multipart: {
        file: {
          name: "fake.png",
          mimeType: "image/png",
          buffer: Buffer.from("not an image"),
        },
      },
    });
    expect(invalid.status()).toBe(400);
  } finally {
    const restored = await page.request.put("/api/admin/settings", {
      headers: { Origin: "http://127.0.0.1:3000" },
      data: original,
    });
    expect(restored.status()).toBe(200);
    if (
      /^\/uploads\/[a-f0-9-]+\.webp$/.test(uploaded) &&
      existsSync("public" + uploaded)
    )
      unlinkSync("public" + uploaded);
  }
});
