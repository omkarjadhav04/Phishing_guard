const form = document.querySelector("#checker-form");
const input = document.querySelector("#message-input");
const inputLabel = document.querySelector("#input-label");
const inputHint = document.querySelector("#input-hint");
const tabs = document.querySelectorAll(".tab");
const panel = document.querySelector("#checker-panel");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const resultSummary = document.querySelector("#result-summary");
const scoreValue = document.querySelector("#score-value");
const scoreBar = document.querySelector("#score-bar");
const findingsHeading = document.querySelector(".findings-heading");
const findingsList = document.querySelector("#findings-list");

let mode = "url";

const shortenerDomains = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "ow.ly",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
]);

const suspiciousTerms = [
  "login",
  "verify",
  "account",
  "password",
  "secure",
  "billing",
  "wallet",
  "update",
  "support",
];

function addFinding(findings, points, message) {
  findings.push({ points, message });
}

function inspectUrl(value) {
  const findings = [];
  const raw = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    return {
      score: 0,
      findings: [],
      error: "That does not look like a valid web address. Check it and try again.",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      score: 0,
      findings: [],
      error: "Please enter a web address that starts with http:// or https://.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const fullAddress = `${hostname}${parsed.pathname}${parsed.search}`.toLowerCase();

  if (parsed.username || parsed.password || raw.includes("@")) {
    addFinding(findings, 25, "The address contains an @ sign or embedded login details.");
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    addFinding(findings, 25, "The site uses a numeric IP address instead of a familiar domain name.");
  }

  if (hostname.includes("xn--")) {
    addFinding(findings, 20, "The domain contains encoded characters that can make look-alike names harder to spot.");
  }

  if (shortenerDomains.has(hostname)) {
    addFinding(findings, 20, "This is a shortened link, so its final destination is not visible here.");
  }

  if (hostname.split(".").length > 4) {
    addFinding(findings, 10, "The address has several subdomain levels, which can make the actual site harder to identify.");
  }

  const matchedTerms = suspiciousTerms.filter((term) => fullAddress.includes(term));
  if (matchedTerms.length > 0) {
    addFinding(findings, Math.min(20, matchedTerms.length * 10), `The address uses terms often seen in sign-in or account messages: ${matchedTerms.join(", ")}.`);
  }

  if (parsed.protocol === "http:") {
    addFinding(findings, 5, "The connection does not use HTTPS.");
  }

  if (raw.length > 120) {
    addFinding(findings, 10, "The address is unusually long.");
  }

  return {
    score: Math.min(100, findings.reduce((total, finding) => total + finding.points, 0)),
    findings,
  };
}

function inspectEmail(value) {
  const findings = [];
  const text = value.toLowerCase();
  const urgencyTerms = [
    "urgent",
    "immediately",
    "act now",
    "suspended",
    "expires today",
    "final warning",
    "within 24 hours",
  ];
  const matchedUrgency = urgencyTerms.filter((term) => text.includes(term));
  const sensitiveRequests = [
    "password",
    "verification code",
    "security code",
    "credit card",
    "bank account",
    "gift card",
    "wire transfer",
  ];
  const matchedRequests = sensitiveRequests.filter((term) => text.includes(term));

  if (matchedUrgency.length > 0) {
    addFinding(findings, Math.min(25, matchedUrgency.length * 15), "The message uses urgent or threatening language to pressure you.");
  }

  if (matchedRequests.length > 0) {
    addFinding(findings, Math.min(30, matchedRequests.length * 15), `It mentions sensitive information or payments: ${matchedRequests.join(", ")}.`);
  }

  const urls = value.match(/(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi) || [];
  if (urls.length > 0) {
    const urlFindings = urls.map((url) => inspectUrl(url.replace(/[.,!?;:]+$/, "")));
    const riskyUrls = urlFindings.filter((item) => item.score >= 10);

    if (riskyUrls.length > 0) {
      const linkCount = riskyUrls.length;
      const verb = linkCount === 1 ? "has" : "have";
      addFinding(findings, Math.min(40, riskyUrls.reduce((total, item) => total + item.score, 0)), `${linkCount} link${linkCount === 1 ? "" : "s"} in the message ${verb} common warning signs.`);
    } else {
      addFinding(findings, 0, "The message includes link(s); check that each destination matches the sender.");
    }
  }

  if (urls.length > 3) {
    addFinding(findings, 10, "The message contains an unusually high number of links.");
  }

  if (findings.length === 0) {
    addFinding(findings, 0, "No common urgency, sensitive-information request, or suspicious-link clues were found.");
  }

  return {
    score: Math.min(100, findings.reduce((total, finding) => total + finding.points, 0)),
    findings,
  };
}

function showResult(analysis) {
  result.hidden = false;
  findingsList.replaceChildren();

  if (analysis.error) {
    resultTitle.textContent = "Please check your input";
    resultSummary.textContent = analysis.error;
    scoreValue.textContent = "—";
    scoreBar.style.width = "0%";
    scoreBar.style.backgroundColor = "";
    findingsHeading.hidden = true;
    findingsList.hidden = true;
    result.querySelector(".disclaimer").hidden = true;
    return;
  }

  findingsHeading.hidden = false;
  findingsList.hidden = false;
  result.querySelector(".disclaimer").hidden = false;

  const score = analysis.score;
  const level = score >= 50 ? "High risk indicators" : score >= 25 ? "Some warning signs" : "No obvious warning signs";
  const color = score >= 50 ? "#ff8585" : score >= 25 ? "#ffc779" : "#79e6c2";

  resultTitle.textContent = level;
  scoreValue.textContent = String(score);
  scoreBar.style.width = `${score}%`;
  scoreBar.style.backgroundColor = color;
  resultSummary.textContent = score >= 50
    ? "This content has several common phishing clues. Avoid clicking links or sharing information."
    : score >= 25
      ? "Some details deserve a closer look. Verify the sender and destination using a trusted source."
      : "The check found few common clues. Stay cautious, especially with unexpected messages.";

  for (const finding of analysis.findings) {
    const item = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "finding-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = finding.points > 0 ? "!" : "i";
    item.append(icon, document.createTextNode(finding.message));
    findingsList.append(item);
  }

  if (analysis.findings.length === 0) {
    const item = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "finding-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "i";
    item.append(icon, document.createTextNode("No common warning signs were detected in this address."));
    findingsList.append(item);
  }
}

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    mode = tab.dataset.mode;
    for (const item of tabs) {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    }

    panel.setAttribute("aria-labelledby", tab.id);
    input.value = "";
    result.hidden = true;
    input.focus();

    if (mode === "email") {
      inputLabel.textContent = "Paste the email text you want to check";
      inputHint.textContent = "Include the subject, message, sender details, and links if you have them.";
      input.placeholder = "Subject: Your account needs attention...";
      input.rows = 6;
    } else {
      inputLabel.textContent = "Paste a website address to check";
      inputHint.textContent = "You can paste a full link, even if it does not start with https://.";
      input.placeholder = "https://example.com/sign-in";
      input.rows = 4;
    }
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) {
    input.focus();
    return;
  }

  showResult(mode === "url" ? inspectUrl(value) : inspectEmail(value));
});
