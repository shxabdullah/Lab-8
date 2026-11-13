import { forwardToNest } from "@/lib/nest-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return forwardToNest("/orders");
}

export async function POST(request: Request) {
  return forwardToNest("/orders", {
    method: "POST",
    body: await request.text(),
  });
}
