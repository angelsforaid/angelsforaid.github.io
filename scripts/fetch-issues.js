// Reads the Substack feed and saves the newest issues to issues.json, which the homepage shows.
// Run by .github/workflows/substack-issues.yml; the Substack address comes from content.js.
const fs = require("fs");

const window = {};
new Function("window", fs.readFileSync("content.js", "utf8"))(window);
const sub = (window.SITE.socials?.substack?.url || "").replace(/\/$/, "");
const MAX = 5;

const decode = (s) => s
  .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
  .replace(/<[^>]+>/g, " ")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1].trim()) : ""; };

function parse(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, MAX).map(([, item]) => {
    const date = new Date(tag(item, "pubDate"));
    let summary = tag(item, "description");
    if (summary.length > 200) summary = summary.slice(0, 197).replace(/\s+\S*$/, "") + "…";
    return { title: tag(item, "title"), date: isNaN(date) ? "" : date.toISOString().slice(0, 10), url: tag(item, "link"), summary };
  }).filter((i) => i.title && i.url);
}

// Substack often turns away requests from GitHub's servers, so if asking directly fails,
// read the same feed through rss2json, a free feed-reading service.
async function direct() {
  const res = await fetch(`${sub}/feed`, { headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8"
  } });
  if (!res.ok) throw new Error(`Substack feed returned ${res.status}`);
  return parse(await res.text());
}

async function viaRss2json() {
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(sub + "/feed")}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "ok") throw new Error(`rss2json returned ${res.status} ${data.message || ""}`);
  return (data.items || []).slice(0, MAX).map((i) => {
    const date = new Date(String(i.pubDate).replace(" ", "T") + "Z");
    let summary = decode(i.description || "");
    if (summary.length > 200) summary = summary.slice(0, 197).replace(/\s+\S*$/, "") + "…";
    return { title: decode(i.title || ""), date: isNaN(date) ? "" : date.toISOString().slice(0, 10), url: i.link, summary };
  }).filter((i) => i.title && i.url);
}

async function main() {
  if (!sub) throw new Error("No Substack address in content.js");
  let issues;
  try { issues = await direct(); }
  catch (e) { console.log(e.message + "; trying rss2json instead."); issues = await viaRss2json(); }
  // An empty feed is more likely a hiccup than a real change, so keep what's there.
  if (!issues.length) { console.log("No issues found in the feed; leaving issues.json alone."); return; }
  fs.writeFileSync("issues.json", JSON.stringify(issues, null, 2) + "\n");
  console.log(`Saved ${issues.length} issues.`);
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { parse };
