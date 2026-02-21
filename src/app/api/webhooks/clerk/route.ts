import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type WebhookEvent } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { prisma } from "~/lib/prisma";
import { env } from "~/env.js";

export async function POST(req: NextRequest) {
  let event: WebhookEvent;

  try {
    event = await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.deleted") {
    await prisma.user.deleteMany({ where: { id: data.id } });
    return new Response(null, { status: 204 });
  }

  if (type === "user.created" || type === "user.updated") {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );

    if (!primaryEmail) {
      return new Response("No primary email found", { status: 400 });
    }

    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { id: data.id },
      create: { id: data.id, email: primaryEmail.email_address, name },
      update: { email: primaryEmail.email_address, name },
    });
  }

  return new Response(null, { status: 204 });
}
