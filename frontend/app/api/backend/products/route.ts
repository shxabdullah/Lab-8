import { forwardToNest } from "@/lib/nest-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return forwardToNest("/products");
}

export async function POST(request: Request) {
  return forwardToNest("/products", {
    method: "POST",
    body: await request.text(),
  });
}
