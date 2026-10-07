import { z } from "zod";

const text = (maximum: number) => z.string().trim().max(maximum);
const id = text(100).min(1);
const positiveMoney = z.number().int().min(0).max(20000000000);
const isHttps = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};
const isInternal = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
const imageUrl = text(2048).refine(
  (v) => v === "" || isInternal(v) || isHttps(v),
  "URL ảnh phải dùng HTTPS hoặc đường dẫn nội bộ.",
);
const externalUrl = text(2048).refine(
  (v) => v === "" || isHttps(v),
  "URL phải dùng HTTPS.",
);
const phone = text(25)
  .transform((v) => v.replace(/[\s.()-]/g, ""))
  .refine(
    (v) => /^(?:0|\+84|84)[0-9]{9}$/.test(v),
    "Số điện thoại Việt Nam không hợp lệ.",
  );
const email = z.union([z.email().max(254), z.literal("")]).default("");
export const loginSchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});
const variantSchema = z.strictObject({
  id,
  colorName: text(80).min(1),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu không hợp lệ."),
  images: z.array(imageUrl).min(1).max(15),
  stock: z.number().int().min(0).max(100000),
});
const numericSpec = z.number().min(0).max(100000).nullable();
export const productSchema = z
  .strictObject({
    id,
    slug: z
      .string()
      .min(1)
      .max(150)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: text(160).min(1),
    brand: text(100).min(1),
    type: z.enum(["gasoline", "electric", "accessory"]),
    price: positiveMoney,
    salePrice: positiveMoney.nullable(),
    description: text(12000),
    featured: z.boolean(),
    inStock: z.boolean(),
    published: z.boolean(),
    createdAt: z.iso.datetime(),
    engineCc: numericSpec,
    motorKw: numericSpec,
    batteryKwh: numericSpec,
    rangeKm: numericSpec,
    seatHeight: numericSpec,
    brake: text(100),
    variants: z.array(variantSchema).min(1).max(30),
    specs: z
      .array(
        z.strictObject({
          key: text(120).min(1),
          value: text(1000),
          group: text(120),
        }),
      )
      .max(100),
    sourceUrl: externalUrl,
    sourceDate: z.union([z.iso.date(), z.literal("")]),
    priceNote: text(1000),
  })
  .refine(
    (v) => v.salePrice === null || v.salePrice <= v.price,
    "Giá khuyến mãi không được cao hơn giá gốc.",
  )
  .refine(
    (v) => new Set(v.variants.map((x) => x.id)).size === v.variants.length,
    "Mã biến thể phải duy nhất.",
  );
export const settingsSchema = z.strictObject({
  siteName: text(120).min(1),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: imageUrl,
  faviconUrl: imageUrl,
  contactPhone: text(40),
  contactEmail: email,
  address: text(500),
  topBar: text(500),
  popup: text(2000),
  heroBanners: z
    .array(
      z.strictObject({
        id,
        title: text(180),
        subtitle: text(500),
        image: imageUrl,
        href: text(500).refine(
          (v) => isInternal(v),
          "Liên kết banner phải là đường dẫn nội bộ.",
        ),
        label: text(100),
      }),
    )
    .max(10),
  showrooms: z
    .array(
      z.strictObject({
        id,
        name: text(160),
        address: text(500),
        hours: text(160),
        mapUrl: externalUrl,
      }),
    )
    .max(50),
  reviews: z
    .array(
      z.strictObject({
        id,
        name: text(120).min(1),
        model: text(160),
        quote: text(1200).min(1),
        rating: z.number().int().min(1).max(5),
      }),
    )
    .max(20)
    .optional(),
  blocks: z.strictObject({
    featured: z.boolean(),
    electric: z.boolean(),
    news: z.boolean(),
    showrooms: z.boolean(),
    reviews: z.boolean(),
  }),
  depositPercent: z.number().min(1).max(100),
  annualInterestRate: z.number().min(0).max(100),
  bankBin: text(20).regex(/^[0-9]*$/),
  bankAccount: text(40).regex(/^[0-9]*$/),
  bankName: text(120),
});
export const testDriveSchema = z
  .strictObject({
    productId: id,
    fullName: text(120).min(2),
    phone,
    email,
    preferredDate: z.iso.date(),
    preferredTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    preferredLocation: text(180).min(1),
    notes: text(2000).default(""),
  })
  .refine(
    (v) =>
      v.preferredDate >=
      new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10),
    "Vui lòng chọn ngày từ hôm nay trở đi.",
  );
export const orderSchema = z
  .strictObject({
    fullName: text(120).min(2),
    phone,
    email,
    address: text(500).min(5),
    notes: text(2000).default(""),
    paymentMethod: z.enum(["cod", "bank"]),
    items: z
      .array(
        z.strictObject({
          productId: id,
          variantId: id,
          quantity: z.number().int().min(1).max(10),
        }),
      )
      .min(1)
      .max(30),
    idempotencyKey: z
      .string()
      .min(16)
      .max(100)
      .regex(/^[a-zA-Z0-9_-]+$/),
  })
  .refine(
    (v) =>
      new Set(v.items.map((x) => `${x.productId}:${x.variantId}`)).size ===
      v.items.length,
    "Giỏ hàng có biến thể trùng lặp.",
  );
export const lookupSchema = z.strictObject({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(8)
    .max(40)
    .regex(/^[A-Z0-9-]+$/),
  phone,
});
export const deleteSchema = z.strictObject({ id });
export const orderUpdateSchema = z.strictObject({
  id,
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  paymentStatus: z.enum(["unpaid", "paid"]).optional(),
});
export const testDriveUpdateSchema = z.strictObject({
  id,
  status: z.enum([
    "pending",
    "confirmed",
    "completed",
    "purchased",
    "cancelled",
  ]),
});
export const sepaySchema = z.object({
  id: z.union([z.string(), z.number()]),
  transferType: z.enum(["in", "out"]),
  transferAmount: z.number().int().min(0),
  content: text(2000),
  accountNumber: text(100),
  code: text(100).nullable().optional(),
});
export type OrderInput = z.infer<typeof orderSchema>;
export type TestDriveInput = z.infer<typeof testDriveSchema>;
