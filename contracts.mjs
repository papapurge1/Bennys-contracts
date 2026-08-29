import { getStore } from "@netlify/blobs";

const store = getStore({ name: "contract-board", consistency: "strong" });
const key = "contracts";
const seed = () => [
  { id: crypto.randomUUID(), title: "Performance Parts Run", item: "Steel", amount: 180, payout: 8500, hours: 24, notes: "Deliver clean, ready-to-use stock to the main workshop.", status: "available", createdAt: Date.now() },
  { id: crypto.randomUUID(), title: "Garage Restock", item: "Aluminum", amount: 120, payout: 6200, hours: 18, notes: "Priority restock for the fabrication bay.", status: "available", createdAt: Date.now() }
];

async function readContracts() {
  const saved = await store.get(key, { type: "json" });
  if (Array.isArray(saved)) return saved;
  const initial = seed();
  await store.setJSON(key, initial);
  return initial;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export default async (request) => {
  if (request.method === "GET") return json(await readContracts());
  if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);

  const body = await request.json();
  const contracts = Array.isArray(body) ? body : body.contracts;
  if (!Array.isArray(contracts)) return json({ error: "Invalid contracts data" }, 400);
  await store.setJSON(key, contracts);

  if (body.notification?.type === "contract-accepted" || body.notification?.type === "test-webhook") {
    const webhookUrl = Netlify.env.get("DISCORD_WEBHOOK_URL");
    if (!webhookUrl) return json({ ok: true, notificationSent: false, error: "Discord webhook is not configured" });

    const contract = body.notification.contract;
    const content = body.notification.type === "test-webhook"
      ? "✅ **BENNY'S Contract Board** webhook test succeeded."
      : `🔧 **Contract Accepted**\n**${contract.title}** — ${contract.amount} × ${contract.item}\nAccepted by: **${contract.acceptedBy}**\nPayout: **$${contract.payout}**\nDue: ${contract.dueAt}`;
    try {
      const discord = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      if (!discord.ok) return json({ ok: true, notificationSent: false, error: `Discord returned ${discord.status}` });
      return json({ ok: true, notificationSent: true });
    } catch {
      return json({ ok: true, notificationSent: false, error: "Discord webhook URL could not be reached" });
    }
  }

  return json({ ok: true });
};
