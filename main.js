// Fills the page with everything in content.js. You shouldn't need to edit this file.
(function () {
  const S = window.SITE;

  const ICONS = {
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    substack: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 3h16v2.5H4zM4 7.5h16V10H4zM4 12h16v10l-8-4.5L4 22z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };
  const LABELS = { tiktok: "TikTok", instagram: "Instagram", substack: "Substack", youtube: "YouTube" };
  const CTA = { tiktok: "Watch", instagram: "See the looks", substack: "Read" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), S);
  const initials = (name) => name.replace(/TODO\s*/i, "").split(/\s+/).filter(Boolean)
    .slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "✦";
  const photo = (p, cls) => p.photo
    ? `<img class="${cls}" src="${esc(p.photo)}" alt="Photo of ${esc(p.name)}" loading="lazy">`
    : `<div class="${cls} initials" aria-hidden="true">${esc(initials(p.name))}</div>`;
  const ext = 'target="_blank" rel="noopener"';

  // Simple text fields
  document.querySelectorAll("[data-field]").forEach((el) => {
    const v = get(el.dataset.field);
    if (v) el.textContent = v;
  });

  // Ticker (content repeated so the scroll loops seamlessly)
  const words = (S.ticker || []).map((t) => `<span>${esc(t)}</span><span class="tick-star">✦</span>`).join("");
  document.getElementById("ticker").innerHTML = `<div>${words.repeat(3)}</div><div>${words.repeat(3)}</div>`;

  // About pillars
  document.getElementById("pillars").innerHTML = (S.pillars || []).map((p) => `
    <div class="pillar"><span class="pillar-tag">${esc(p.title)}</span><p>${esc(p.text)}</p></div>`).join("");

  // Socials
  const socials = Object.entries(S.socials || {}).filter(([, s]) => s && s.url);
  document.querySelectorAll('[data-socials="icons"]').forEach((el) => {
    el.innerHTML = socials.map(([k, s]) =>
      `<a class="icon-link" href="${esc(s.url)}" ${ext} aria-label="${LABELS[k] || k}">${ICONS[k] || ICONS.link}</a>`).join("");
  });
  document.querySelectorAll('[data-socials="cards"]').forEach((el) => {
    el.innerHTML = socials.map(([k, s]) => `
      <a class="arch" href="${esc(s.url)}" ${ext}>
        <span class="arch-inner">
          <svg class="arch-sparkle"><use href="#sparkle"/></svg>
          <span class="arch-icon">${ICONS[k] || ICONS.link}</span>
          <span class="arch-name">${LABELS[k] || k}</span>
          <span class="arch-handle">${esc(s.handle)}</span>
          <span class="arch-cta">${CTA[k] || "visit"}</span>
        </span>
      </a>`).join("");
  });

  // Newsletter
  const sub = S.socials?.substack?.url?.replace(/\/$/, "");
  const signup = document.getElementById("signup");
  if (S.newsletter?.showSignup && sub) {
    signup.innerHTML = `
      <div class="embed-frame"><iframe src="${esc(sub)}/embed" title="Subscribe to the ${esc(S.name)} newsletter" frameborder="0" scrolling="no"></iframe></div>
      <p class="fine">or <a href="${esc(sub)}" ${ext}>read it on Substack</a> first</p>`;
  } else if (sub) {
    signup.innerHTML = `<a class="btn btn-pearl" href="${esc(sub)}" ${ext}>Subscribe on Substack</a>`;
  }
  const issues = S.newsletter?.issues || [];
  if (issues.length) {
    document.getElementById("issues").innerHTML = issues.map((i) => `
      <li><a href="${esc(i.url)}" ${ext}>
        <time datetime="${esc(i.date)}">${esc(new Date(i.date + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))}</time>
        <strong>${esc(i.title)}</strong>
        ${i.summary ? `<span>${esc(i.summary)}</span>` : ""}
      </a></li>`).join("");
    const archive = document.getElementById("archive-link");
    if (sub) archive.href = `${sub}/archive`; else archive.remove();
  } else {
    document.getElementById("issues-wrap").remove();
  }

  // Editorial board, as arched portraits
  const board = S.board || [];
  const portrait = (p) => `
    <article class="portrait${p.lead ? " lead" : ""}">
      <div class="frame">
        <svg class="frame-halo"><use href="#halo"/></svg>
        ${photo(p, "pt-photo")}
      </div>
      <h3 class="pt-name">${esc(p.name)}</h3>
      <p class="pt-role">${esc(p.role)}</p>
      <p class="pt-bio">${esc(p.bio)}</p>
    </article>`;
  // Leads (the CEO) get their own line above everyone else.
  const leads = board.filter((p) => p.lead), rest = board.filter((p) => !p.lead);
  document.getElementById("board").innerHTML =
    (leads.length ? `<div class="board-lead">${leads.map(portrait).join("")}</div>` : "") + rest.map(portrait).join("");

  // Collaborators, as cameos
  const collabs = S.collaborators || [];
  if (collabs.length) {
    document.getElementById("collabs").innerHTML = collabs.map((c) => `
      <a class="cameo" href="${esc(c.url)}" ${ext}>
        <span class="cameo-pic">
          <svg class="cameo-halo"><use href="#halo"/></svg>
          ${photo(c, "cm-photo")}
        </span>
        <strong>${esc(c.name)}</strong>
        <span class="cm-handle">${ICONS[c.platform] || ICONS.link}${esc(c.handle)}</span>
      </a>`).join("");
  } else {
    document.getElementById("collaborators").remove();
    document.querySelector('a[href="#collaborators"]')?.remove();
  }

  // Brands we've worked with
  const brands = S.brands || [];
  if (brands.length) {
    document.getElementById("brands-list").innerHTML = brands.map((b) => {
      const inner = b.logo ? `<img src="${esc(b.logo)}" alt="${esc(b.name)}">` : `<span>${esc(b.name)}</span>`;
      return b.url ? `<a class="brand-tile" href="${esc(b.url)}" ${ext}>${inner}</a>` : `<div class="brand-tile">${inner}</div>`;
    }).join("");
  } else {
    document.getElementById("brands").remove();
  }

  // Feathered wings behind the title (built from layered feathers)
  const wing = (side) => {
    const rows = [
      { n: 11, from: -78, to: 12, len: [230, 330], w: 0.085, r0: 40 },
      { n: 10, from: -70, to: 5,  len: [150, 200], w: 0.11,  r0: 30 },
      { n: 8,  from: -60, to: 0,  len: [80, 110],  w: 0.15,  r0: 18 }
    ];
    let out = "";
    rows.forEach((row) => {
      for (let i = 0; i < row.n; i++) {
        const t = i / (row.n - 1);
        const ang = row.from + (row.to - row.from) * t;
        const len = row.len[0] + (row.len[1] - row.len[0]) * Math.sin(Math.PI * (0.25 + t * 0.6));
        const rad = (ang * Math.PI) / 180;
        const cx = Math.cos(rad) * (row.r0 + len / 2), cy = Math.sin(rad) * (row.r0 + len / 2);
        out += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(len / 2).toFixed(1)}" ry="${(len * row.w).toFixed(1)}"
          transform="rotate(${ang.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="url(#feather-fill)" stroke="#d3d3de" stroke-width="1.2"/>`;
      }
    });
    return `<g class="wing wing-${side}" transform="translate(${side === "l" ? -200 : 200} 40) scale(${side === "l" ? -1 : 1} 1)">${out}</g>`;
  };
  document.getElementById("wings").innerHTML = wing("l") + wing("r");

  // Floating feathers and sparkles in the hero
  const drift = document.getElementById("drift");
  let bits = "";
  for (let i = 0; i < 10; i++) {
    bits += `<svg class="float-feather" style="left:${(i * 37 + 7) % 96}%;animation-delay:-${(i * 2.3).toFixed(1)}s;animation-duration:${14 + (i % 4) * 3}s;--rot:${(i % 2 ? 1 : -1) * (20 + i * 9)}deg"><use href="#feather"/></svg>`;
  }
  for (let i = 0; i < 26; i++) {
    bits += `<svg class="glint" style="left:${(i * 53 + 11) % 98}%;top:${(i * 29 + 5) % 92}%;animation-delay:-${(i * 0.37).toFixed(2)}s;width:${6 + (i % 4) * 4}px"><use href="#sparkle"/></svg>`;
  }
  drift.innerHTML = bits;

  // Footer
  const email = document.getElementById("email-link");
  email.href = `mailto:${S.email}`;
  email.textContent = S.email;
  document.getElementById("year").textContent = new Date().getFullYear();
})();
