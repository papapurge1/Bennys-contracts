// Add the new-contract Discord automation without changing existing contract behaviour.
document.querySelector("#managerUnlockForm").addEventListener("submit", () => {
  setTimeout(() => {
    document.querySelector("#directPostWebhookUrl").value = directWebhookUrl("post");
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

document.querySelector("#testPostWebhook").addEventListener("click", async () => {
  const result = document.querySelector("#webhookTestResult");
  result.textContent = "Sending New Contract Discord test…";
  const response = await sendDirectWebhook("BENNY'S Contract Board new-contract webhook test.", "post");
  result.textContent = response.ok ? "New Contract test sent." : `Test failed: ${response.error}`;
});

document.querySelector("#contractForm").addEventListener("submit", async () => {
  const contract = contracts[0];
  if (!contract || !directWebhookUrl("post")) return;

  const saved = await saveContracts();
  if (!saved.ok) {
    showToast("Contract posted, but the shared board did not save the webhook alert.");
    return;
  }

  const message = `**New Contract Posted**\n**${contract.title}** — ${contract.amount} × ${contract.item}\nApproved by: **${contract.approvedBy || "Manager"}**\nPayout: **${money(contract.payout)}**\nTime to complete: ${formatTime(seconds(contract))}`;
  const response = await sendDirectWebhook(message, "post");
  if (!response.ok) showToast(`Contract posted. New-contract Discord alert failed: ${response.error}`);
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-material-jump]");
  if (!button) return;
  const group = document.querySelector(`#${button.dataset.materialJump}`);
  if (group) group.scrollIntoView({ behavior: "smooth", block: "start" });
});
