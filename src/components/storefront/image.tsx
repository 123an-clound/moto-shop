import NextImage, { type ImageProps } from "next/image";

// Uploaded/local assets use Next's optimizer. Other HTTPS URLs entered by the
// owner are fetched by the browser, without opening the server image proxy.
export default function Image(props: ImageProps) {
  const external =
    typeof props.src === "string" &&
    props.src.startsWith("https://") &&
    !new URL(props.src).hostname.endsWith(".supabase.co");
  return <NextImage {...props} unoptimized={props.unoptimized ?? external} />;
}
