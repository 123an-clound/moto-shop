import { randomUUID, randomBytes, createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import productSeed from "@/data/products.json";
import settingSeed from "@/data/settings.json";
import type {
  AdminSnapshot,
  Product,
  SiteSettings,
  Order,
  OrderItem,
  TestDrive,
} from "@/types";
import type { OrderInput, TestDriveInput } from "./validation";
import { HttpError, requirePersistence } from "./http";
import { hasSupabase, supabaseConfig } from "@/utils/supabase/config";
import { createServiceSupabase } from "@/utils/supabase/service";

type StoredOrder = Order & {
  idempotencyKey: string;
  fingerprint: string;
  bankAccount: string;
  bankBin: string;
  bankName: string;
};
type LocalStore = {
  version: 1;
  products: Product[];
  settings: SiteSettings;
  orders: StoredOrder[];
  testDrives: TestDrive[];
  paymentEvents: string[];
};
type DbProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  type: Product["type"];
  price_original: number;
  price_sale: number | null;
  description: string;
  featured: boolean;
  in_stock: boolean;
  published: boolean;
  created_at: string;
  engine_cc: number | null;
  motor_kw: number | null;
  battery_kwh: number | null;
  range_km: number | null;
  seat_height: number | null;
  brake: string;
  source_url: string;
  source_date: string;
  price_note: string;
  product_variants: {
    id: string;
    color_name: string;
    color_hex: string;
    image_urls: string[];
    stock_quantity: number;
  }[];
  specifications: {
    spec_key: string;
    spec_value: string;
    group_name: string;
    sort_order: number;
  }[];
};
type DbOrder = {
  id: string;
  code: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  payment_method: Order["paymentMethod"];
  status: Order["status"];
  payment_status: Order["paymentStatus"];
  total: number;
  deposit: number;
  created_at: string;
  order_items: {
    product_id: string;
    variant_id: string;
    name: string;
    color: string;
    image: string;
    quantity: number;
    unit_price: number;
  }[];
};
type DbTestDrive = {
  id: string;
  product_id: string;
  product_name: string;
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  preferred_location: string;
  notes: string;
  status: TestDrive["status"];
  created_at: string;
};

function seedProducts() {
  return structuredClone(productSeed) as Product[];
}
function seedSettings() {
  return structuredClone(settingSeed) as SiteSettings;
}
const localDirectory = path.join(process.cwd(), ".local");
const storePath = path.join(localDirectory, "store.json");
let writeQueue: Promise<unknown> = Promise.resolve();
async function readLocal(): Promise<LocalStore> {
  try {
    return JSON.parse(await fs.readFile(storePath, "utf8")) as LocalStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      version: 1,
      products: seedProducts(),
      settings: seedSettings(),
      orders: [],
      testDrives: [],
      paymentEvents: [],
    };
  }
}
async function mutateLocal<T>(
  action: (store: LocalStore) => T | Promise<T>,
): Promise<T> {
  requirePersistence();
  const task = writeQueue.then(async () => {
    await fs.mkdir(localDirectory, { recursive: true });
    // An exclusive cross-process lock prevents Next.js workers from racing each other.
    const lockPath = path.join(localDirectory, "store.lock");
    let lock: Awaited<ReturnType<typeof fs.open>> | undefined;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        lock = await fs.open(lockPath, "wx");
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        // A crashed process can leave a lock; its maximum lifetime is two minutes.
        const stat = await fs.stat(lockPath).catch(() => null);
        if (stat && Date.now() - stat.mtimeMs > 120000)
          await fs.unlink(lockPath).catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    if (!lock)
      throw new HttpError(503, "Dữ liệu đang được cập nhật. Vui lòng thử lại.");
    const temporary = path.join(localDirectory, `${randomUUID()}.tmp`);
    try {
      const store = await readLocal();
      const result = await action(store);
      await fs.writeFile(temporary, JSON.stringify(store, null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
      await fs.rename(temporary, storePath);
      return result;
    } finally {
      await fs.unlink(temporary).catch(() => undefined);
      await lock.close();
      await fs.unlink(lockPath).catch(() => undefined);
    }
  });
  writeQueue = task.catch(() => undefined);
  return task;
}
function publicClient() {
  const { url, key } = supabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal || AbortSignal.timeout(15000),
        }),
    },
  });
}
function dbError(error: { message: string; code?: string }): never {
  if (error.message.includes("OUT_OF_STOCK"))
    throw new HttpError(
      409,
      "Một sản phẩm đã hết hàng hoặc không đủ số lượng. Vui lòng cập nhật giỏ hàng.",
    );
  if (error.message.includes("IDEMPOTENCY_CONFLICT"))
    throw new HttpError(409, "Mã yêu cầu đã được dùng với dữ liệu khác.");
  if (error.message.includes("BANK_NOT_CONFIGURED"))
    throw new HttpError(
      503,
      "Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản.",
    );
  if (error.message.includes("NOT_FOUND"))
    throw new HttpError(404, "Không tìm thấy dữ liệu.");
  if (error.message.includes("INVALID_TRANSITION"))
    throw new HttpError(
      409,
      "Không thể chuyển trạng thái này. Đơn hủy không thể mở lại.",
    );
  if (error.code === "23505")
    throw new HttpError(409, "Mã hoặc đường dẫn sản phẩm đã tồn tại.");
  throw new HttpError(
    503,
    "Không thể truy cập dữ liệu. Vui lòng kiểm tra kết nối Supabase.",
    "DATABASE_ERROR",
  );
}
function mapProduct(row: DbProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    type: row.type,
    price: Number(row.price_original),
    salePrice: row.price_sale === null ? null : Number(row.price_sale),
    description: row.description || "",
    featured: row.featured,
    inStock: row.in_stock,
    published: row.published,
    createdAt: row.created_at,
    engineCc: row.engine_cc,
    motorKw: row.motor_kw,
    batteryKwh: row.battery_kwh,
    rangeKm: row.range_km,
    seatHeight: row.seat_height,
    brake: row.brake || "",
    sourceUrl: row.source_url || "",
    sourceDate: row.source_date || "",
    priceNote: row.price_note || "",
    variants: row.product_variants.map((v) => ({
      id: v.id,
      colorName: v.color_name,
      colorHex: v.color_hex,
      images: v.image_urls,
      stock: v.stock_quantity,
    })),
    specs: row.specifications
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        key: s.spec_key,
        value: s.spec_value,
        group: s.group_name,
      })),
  };
}
function mapOrder(row: DbOrder): Order {
  return {
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email || "",
    address: row.address,
    notes: row.notes || "",
    paymentMethod: row.payment_method,
    status: row.status,
    paymentStatus: row.payment_status,
    total: Number(row.total),
    deposit: Number(row.deposit),
    createdAt: row.created_at,
    items: row.order_items.map((i) => ({
      productId: i.product_id,
      variantId: i.variant_id,
      name: i.name,
      color: i.color,
      image: i.image,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
    })),
  };
}
function mapTestDrive(row: DbTestDrive): TestDrive {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email || "",
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time.slice(0, 5),
    preferredLocation: row.preferred_location,
    notes: row.notes || "",
    status: row.status,
    createdAt: row.created_at,
  };
}
export async function getProducts(
  options: { includeUnpublished?: boolean } = {},
): Promise<Product[]> {
  if (hasSupabase()) {
    const client = options.includeUnpublished
      ? createServiceSupabase()
      : publicClient();
    let query = client
      .from("products")
      .select("*, product_variants(*), specifications(*)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (!options.includeUnpublished) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) dbError(error);
    return (data as DbProduct[]).map(mapProduct);
  }
  const products =
    process.env.NODE_ENV === "production"
      ? seedProducts()
      : (await readLocal()).products;
  return options.includeUnpublished
    ? products
    : products.filter((p) => p.published);
}
export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) || null;
}
export async function getSalesCounts(): Promise<Record<string, number>> {
  if (hasSupabase()) {
    if (!(
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    ))
      return {};
    const { data, error } =
      await createServiceSupabase().rpc("get_sales_counts");
    if (error) dbError(error);
    return (data || {}) as Record<string, number>;
  }
  if (process.env.NODE_ENV === "production") return {};
  const counts: Record<string, number> = {};
  for (const order of (await readLocal()).orders)
    if (order.status === "completed")
      for (const item of order.items)
        counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
  return counts;
}
export async function getSettings(): Promise<SiteSettings> {
  if (hasSupabase()) {
    const { data, error } = await publicClient()
      .from("site_settings")
      .select("config")
      .eq("id", 1)
      .single();
    if (error) dbError(error);
    return data.config as SiteSettings;
  }
  return process.env.NODE_ENV === "production"
    ? seedSettings()
    : (await readLocal()).settings;
}
export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  requirePersistence();
  if (!hasSupabase()) {
    const store = await readLocal();
    return {
      products: store.products,
      settings: store.settings,
      orders: store.orders.map((o) => ({
        id: o.id,
        code: o.code,
        fullName: o.fullName,
        phone: o.phone,
        email: o.email,
        address: o.address,
        notes: o.notes,
        paymentMethod: o.paymentMethod,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        deposit: o.deposit,
        items: o.items,
        createdAt: o.createdAt,
      })),
      testDrives: store.testDrives,
      mode: "local",
    };
  }
  const client = createServiceSupabase();
  const [products, settings, orders, testDrives] = await Promise.all([
    getProducts({ includeUnpublished: true }),
    getSettings(),
    client
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(500),
    client
      .from("test_drives")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (orders.error) dbError(orders.error);
  if (testDrives.error) dbError(testDrives.error);
  return {
    products,
    settings,
    orders: (orders.data as DbOrder[]).map(mapOrder),
    testDrives: (testDrives.data as DbTestDrive[]).map(mapTestDrive),
    mode: "supabase",
  };
}
export async function saveProduct(product: Product) {
  requirePersistence();
  if (hasSupabase()) {
    const { error } = await createServiceSupabase().rpc("upsert_product", {
      p_product: product,
    });
    if (error) dbError(error);
    return product;
  }
  return mutateLocal((store) => {
    if (
      store.products.some((p) => p.slug === product.slug && p.id !== product.id)
    )
      throw new HttpError(409, "Đường dẫn sản phẩm đã tồn tại.");
    const index = store.products.findIndex((p) => p.id === product.id);
    if (index >= 0) store.products[index] = product;
    else store.products.unshift(product);
    return product;
  });
}
export async function deleteProduct(id: string) {
  requirePersistence();
  if (hasSupabase()) {
    const { error } = await createServiceSupabase()
      .from("products")
      .delete()
      .eq("id", id);
    if (error) dbError(error);
    return;
  }
  await mutateLocal((store) => {
    if (!store.products.some((p) => p.id === id))
      throw new HttpError(404, "Không tìm thấy sản phẩm.");
    store.products = store.products.filter((p) => p.id !== id);
  });
}
export async function saveSettings(settings: SiteSettings) {
  requirePersistence();
  if (hasSupabase()) {
    const { error } = await createServiceSupabase()
      .from("site_settings")
      .upsert({
        id: 1,
        site_name: settings.siteName,
        primary_color: settings.primaryColor,
        logo_url: settings.logoUrl,
        contact_phone: settings.contactPhone,
        address: settings.address,
        hero_banners: settings.heroBanners,
        config: settings,
        updated_at: new Date().toISOString(),
      });
    if (error) dbError(error);
  } else
    await mutateLocal((store) => {
      store.settings = settings;
    });
  return settings;
}
export async function createTestDrive(input: TestDriveInput) {
  requirePersistence();
  const product = (await getProducts()).find((p) => p.id === input.productId);
  if (!product) throw new HttpError(404, "Không tìm thấy sản phẩm.");
  const settings = await getSettings();
  if (
    !settings.showrooms.some(
      (s) =>
        s.name === input.preferredLocation || s.id === input.preferredLocation,
    )
  )
    throw new HttpError(400, "Vui lòng chọn showroom trong danh sách.");
  const drive: TestDrive = {
    ...input,
    id: randomUUID(),
    productName: product.name,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (hasSupabase()) {
    const { error } = await createServiceSupabase()
      .from("test_drives")
      .insert({
        id: drive.id,
        product_id: drive.productId,
        product_name: drive.productName,
        full_name: drive.fullName,
        phone: drive.phone,
        email: drive.email,
        preferred_date: drive.preferredDate,
        preferred_time: drive.preferredTime,
        preferred_location: drive.preferredLocation,
        notes: drive.notes,
      });
    if (error) dbError(error);
  } else
    await mutateLocal((store) => {
      store.testDrives.unshift(drive);
    });
  return { id: drive.id, status: drive.status };
}
export async function updateTestDrive(id: string, status: TestDrive["status"]) {
  requirePersistence();
  if (hasSupabase()) {
    const { data, error } = await createServiceSupabase()
      .from("test_drives")
      .update({ status })
      .eq("id", id)
      .select("id")
      .single();
    if (error) dbError(error);
    return data;
  }
  return mutateLocal((store) => {
    const drive = store.testDrives.find((d) => d.id === id);
    if (!drive) throw new HttpError(404, "Không tìm thấy lịch hẹn.");
    drive.status = status;
    return { id };
  });
}
export function orderFingerprint(input: OrderInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        items: [...input.items].sort((a, b) =>
          `${a.productId}:${a.variantId}`.localeCompare(
            `${b.productId}:${b.variantId}`,
          ),
        ),
      }),
    )
    .digest("hex");
}
export function quoteItems(
  products: Product[],
  input: OrderInput,
): OrderItem[] {
  return input.items.map((item) => {
    const product = products.find(
      (p) => p.id === item.productId && p.published && p.inStock,
    );
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant || variant.stock < item.quantity)
      throw new HttpError(
        409,
        "Một sản phẩm đã hết hàng hoặc không đủ số lượng. Vui lòng cập nhật giỏ hàng.",
      );
    return {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      color: variant.colorName,
      image: variant.images[0] || "",
      quantity: item.quantity,
      unitPrice: product.salePrice ?? product.price,
    };
  });
}
function orderReceipt(order: Order) {
  return {
    id: order.id,
    code: order.code,
    total: order.total,
    deposit: order.deposit,
    items: order.items,
    paymentMethod: order.paymentMethod,
    status: order.status,
    paymentStatus: order.paymentStatus,
  };
}
export async function createOrder(input: OrderInput) {
  requirePersistence();
  const fingerprint = orderFingerprint(input);
  let order: Order & { bankAccount: string; bankBin: string; bankName: string };
  const settings = await getSettings();
  if (
    input.paymentMethod === "bank" &&
    (!settings.bankBin || !settings.bankAccount || !settings.bankName)
  )
    throw new HttpError(
      503,
      "Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản. Bạn có thể chọn thanh toán khi nhận xe.",
      "BANK_NOT_CONFIGURED",
    );
  if (hasSupabase()) {
    const { data, error } = await createServiceSupabase().rpc("create_order", {
      p_input: input,
      p_fingerprint: fingerprint,
    });
    if (error) dbError(error);
    order = data as Order & {
      bankAccount: string;
      bankBin: string;
      bankName: string;
    };
  } else {
    order = await mutateLocal((store) => {
      const previous = store.orders.find(
        (o) => o.idempotencyKey === input.idempotencyKey,
      );
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new HttpError(409, "Mã yêu cầu đã được dùng với dữ liệu khác.");
        return previous;
      }
      const items = quoteItems(store.products, input);
      const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      if (
        input.paymentMethod === "bank" &&
        (!store.settings.bankAccount ||
          !store.settings.bankBin ||
          !store.settings.bankName)
      )
        throw new HttpError(
          503,
          "Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản.",
        );
      const created: StoredOrder = {
        id: randomUUID(),
        code: `MS${randomBytes(6).toString("hex").toUpperCase()}`,
        ...input,
        status: "pending",
        paymentStatus: "unpaid",
        total,
        deposit:
          input.paymentMethod === "bank"
            ? Math.ceil((total * store.settings.depositPercent) / 100)
            : 0,
        items,
        createdAt: new Date().toISOString(),
        fingerprint,
        bankAccount: store.settings.bankAccount,
        bankBin: store.settings.bankBin,
        bankName: store.settings.bankName,
      };
      for (const item of items)
        store.products
          .find((p) => p.id === item.productId)!
          .variants.find((v) => v.id === item.variantId)!.stock -=
          item.quantity;
      store.orders.unshift(created);
      return created;
    });
  }
  const qrUrl =
    order.paymentMethod === "bank"
      ? `https://img.vietqr.io/image/${order.bankBin}-${order.bankAccount}-compact2.png?${new URLSearchParams({ amount: String(order.deposit), addInfo: order.code, accountName: order.bankName })}`
      : undefined;
  return { order: orderReceipt(order), ...(qrUrl ? { qrUrl } : {}) };
}
export async function lookupOrder(code: string, phone: string) {
  requirePersistence();
  let order: Order | undefined;
  if (hasSupabase()) {
    const { data, error } = await createServiceSupabase()
      .from("orders")
      .select("*, order_items(*)")
      .eq("code", code)
      .eq("phone", phone)
      .maybeSingle();
    if (error) dbError(error);
    if (data) order = mapOrder(data as DbOrder);
  } else
    order = (await readLocal()).orders.find(
      (o) => o.code === code && o.phone === phone,
    );
  if (!order)
    throw new HttpError(
      404,
      "Không tìm thấy đơn hàng khớp mã đơn và số điện thoại.",
    );
  return {
    code: order.code,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    deposit: order.deposit,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.name,
      color: i.color,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}
export async function updateOrder(
  id: string,
  status: Order["status"],
  paymentStatus?: Order["paymentStatus"],
) {
  requirePersistence();
  if (hasSupabase()) {
    const { error } = await createServiceSupabase().rpc("update_order_status", {
      p_id: id,
      p_status: status,
      p_payment_status: paymentStatus ?? null,
    });
    if (error) dbError(error);
    return { id };
  }
  return mutateLocal((store) => {
    const order = store.orders.find((o) => o.id === id);
    if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng.");
    if (order.status === "cancelled" && status !== "cancelled")
      throw new HttpError(409, "Đơn hủy không thể mở lại.");
    if (status === "cancelled" && order.status === "completed")
      throw new HttpError(409, "Không thể hủy đơn đã hoàn thành.");
    if (order.paymentStatus === "paid" && paymentStatus === "unpaid")
      throw new HttpError(409, "Không thể xóa xác nhận thanh toán.");
    if (order.status !== "cancelled" && status === "cancelled")
      for (const item of order.items) {
        const variant = store.products
          .find((p) => p.id === item.productId)
          ?.variants.find((v) => v.id === item.variantId);
        if (variant) variant.stock += item.quantity;
      }
    order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    return { id };
  });
}
export async function applyPayment(
  eventId: string,
  code: string,
  amount: number,
  account: string,
) {
  requirePersistence();
  if (hasSupabase()) {
    const { data, error } = await createServiceSupabase().rpc("apply_payment", {
      p_event_id: eventId,
      p_code: code,
      p_amount: amount,
      p_account: account,
    });
    if (error) dbError(error);
    return data;
  }
  return mutateLocal((store) => {
    if (store.paymentEvents.includes(eventId))
      return { success: true, duplicate: true };
    const order = store.orders.find(
      (o) =>
        o.code === code &&
        o.bankAccount === account &&
        o.paymentMethod === "bank",
    );
    if (
      !order ||
      order.status === "cancelled" ||
      amount < order.deposit ||
      order.deposit <= 0
    )
      return { success: true, matched: false };
    store.paymentEvents.push(eventId);
    order.paymentStatus = "paid";
    return { success: true, matched: true };
  });
}
