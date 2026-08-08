function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const webhookUrl = Netlify.env.get("DISCORD_WEBHOOK_URL");
  if (!webhookUrl) return json({ error: "Discord webhook is not configured on Netlify" }, 503);

  const contract = await request.json();
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🔧 **Contract Accepted**\n**${contract.title}** — ${contract.amount} × ${contract.item}\nAccepted by: **${contract.acceptedBy}**\nPayout: **${contract.payout}**\nDue: ${contract.dueAt}`
    })
  });

  if (!response.ok) return json({ error: "Discord rejected the webhook request" }, 502);
  return json({ ok: true });
};
