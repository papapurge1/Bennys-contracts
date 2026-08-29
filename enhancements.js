// Add the new-contract Discord automation without changing existing contract behaviour.
function postRoleId() {
  return (settings()?.directPostRoleId || "").trim();
}

async function savePostRoleId(roleId) {
  let config = settings();
  if (!config) {
    await saveDirectWebhook("post", directWebhookUrl("post"));
    config = settings();
  }
  config.directPostRoleId = roleId;
  return saveContracts();
}

async function sendPostWebhook(content) {
  const url = directWebhookUrl("post");
  const roleId = postRoleId();
  if (!url) return { ok: false, error: "No new-contract webhook URL has been saved." };
  if (!/^https:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/\d+\/[\w-]+/i.test(url)) {
    return { ok: false, error: "This is not a Discord webhook URL." };
  }
  if (roleId && !/^\d{17,20}$/.test(roleId)) {
    return { ok: false, error: "The Role ID must contain 17–20 digits." };
  }
  const requestUrl = `${url}${url.includes("?") ? "&" : "?"}wait=true`;
  const payload = roleId
    ? { content: `<@&${roleId}>\n${content}`, allowed_mentions: { parse: [], roles: [roleId] } }
    : { content, allowed_mentions: { parse: [] } };
  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return { ok: false, error: `Discord rejected the webhook (error ${response.status}).` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Discord could not be reached by this browser." };
  }
}

document.querySelector("#managerUnlockForm").addEventListener("submit", () => {
  setTimeout(() => {
    document.querySelector("#directPostWebhookUrl").value = directWebhookUrl("post");
    document.querySelector("#directPostRoleId").value = postRoleId();
  }, 0);
});

document.querySelector("#savePostWebhook").addEventListener("click", async () => {
  const result = document.querySelector("#webhookTestResult");
  const url = document.querySelector("#directPostWebhookUrl").value.trim();
  if (!url) {
    result.textContent = "Enter a New Contract webhook URL first.";
    return;
  }
  await saveDirectWebhook("post", url);
  result.textContent = "New Contract webhook saved for the shared board.";
});

document.querySelector("#savePostRole").addEventListener("click", async () => {
  const result = document.querySelector("#webhookTestResult");
  const roleId = document.querySelector("#directPostRoleId").value.trim();
  if (roleId && !/^\d{17,20}$/.test(roleId)) {
    result.textContent = "Role ID must be 17–20 digits. Enable Developer Mode in Discord, then right-click the role and choose Copy Role ID.";
    return;
  }
  const saved = await savePostRoleId(roleId);
  result.textContent = saved.ok ? (roleId ? "New Contract role saved." : "New Contract role cleared.") : "Could not save the New Contract role.";
});

document.querySelector("#testPostWebhook").addEventListener("click", async () => {
  const result = document.querySelector("#webhookTestResult");
  result.textContent = "Sending New Contract Discord test…";
  const response = await sendPostWebhook("**BENNY'S Contract Board** new-contract webhook test.");
  result.textContent = response.ok ? "New Contract test sent." : `Test failed: ${response.error}`;
});

document.querySelector("#contractForm").addEventListener("submit", event => {
  const form = event.currentTarget;
  const contract = {
    title: form.contractTitle.value.trim(),
    approvedBy: form.contractApprovedBy.value.trim(),
    item: form.contractItem.value.trim(),
    amount: Number(form.contractAmount.value),
    payout: Number(form.contractPayout.value),
    durationSeconds: Number(form.contractDuration.value) * unitSeconds[form.contractDurationUnit.value]
  };

  setTimeout(async () => {
    if (!directWebhookUrl("post")) return;
    const message = `**New Contract Posted**\n**${contract.title}** — ${contract.amount} × ${contract.item}\nApproved by: **${contract.approvedBy || "Manager"}**\nPayout: **${money(contract.payout)}**\nTime to complete: ${formatTime(contract.durationSeconds)}`;
    const response = await sendPostWebhook(message);
    if (!response.ok) showToast(`Contract posted. New-contract Discord alert failed: ${response.error}`);
  }, 0);
}, true);

document.addEventListener("click", event => {
  const button = event.target.closest("[data-material-jump]");
  if (!button) return;
  const group = document.querySelector(`#${button.dataset.materialJump}`);
  if (group) group.scrollIntoView({ behavior: "smooth", block: "start" });
});
