/**
 * Angels for Aid ✦ form receiver
 *
 * Paste this whole file into Extensions → Apps Script on your Google Sheet,
 * then deploy it as a web app (see SPOTTED-SETUP.md). It receives two forms:
 *   spotted.html → the "Submissions" tab, plus a folder for each angel (a Google Doc of their
 *                  answers and their photos) inside "Angels for Aid ✦ Angels spotted"
 *   write.html   → the "Newsletter pieces" tab, plus a folder for each piece (a formatted
 *                  Google Doc and its images) inside "Angels for Aid ✦ Pieces"
 *
 * Sending again replaces that person's earlier submission (same Instagram or name for spotted,
 * same email and title for pieces): their row is updated and the old folder goes to the Drive trash.
 *
 * After pasting a new version, run "tidy" once to neaten the tabs you already have.
 */
const FORMS = {
  spotted: {
    sheet: "Submissions",
    folder: "Angels for Aid ✦ Angels spotted",
    first: ["Sent", "Status", "Read it", "Folder", "Name", "Location", "Occupation", "Instagram", "Cause", "Connection to the cause"],
    last: ["Photos", "Formatted post", "Submission code", "Match key"],
    statuses: ["New", "Posted"],
    narrow: { "Sent": 140, "Status": 110, "Read it": 110, "Folder": 110, "Name": 150, "Location": 140, "Instagram": 140, "Cause": 180 },
    maxPhotos: 8
  },
  piece: {
    sheet: "Newsletter pieces",
    folder: "Angels for Aid ✦ Pieces",
    first: ["Sent", "Status", "Read it", "Folder", "Title", "Name", "Topic", "Word count", "Email", "Substack handle", "Location", "Subtitle"],
    last: ["Piece", "Bio", "Images", "Image credits", "Ready for Substack", "Match key"],
    statuses: ["New", "Reviewing", "Scheduled", "Published", "Declined"],
    narrow: { "Sent": 140, "Status": 120, "Read it": 110, "Folder": 110, "Title": 260, "Name": 150, "Topic": 170, "Word count": 100, "Email": 200 },
    maxPhotos: 4
  }
};
const HEADER_COLOR = "#f9e1ea";
const ROW_HEIGHT = 42;       // every answer row stays this tall; click a cell to read all of it
const WIDE = 260;            // width for long-answer columns

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    const form = FORMS[d.type] || FORMS.spotted;
    // Treat everything people type as plain text, never as a spreadsheet formula.
    const fields = {};
    Object.keys(d.fields || {}).forEach(k => {
      const v = d.fields[k];
      fields[k] = typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
    });
    const name = String(fields["Name"] || "").slice(0, 200);
    if (!name) return reply({ ok: false, error: "missing name" });

    // Each submission gets its own folder for its Doc and photos.
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
    const label = d.type === "piece" ? `${String(fields["Title"] || "Untitled").slice(0, 120)} by ${name}` : name;
    const folder = getFolder(form.folder).createFolder(`${label} (${stamp})`);
    // Photos: anyone with the link can view, so they can go on the blog.
    const files = [];
    (d.photos || []).slice(0, form.maxPhotos).forEach((b64, i) => {
      const blob = Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", `${name} ${stamp} (${i + 1}).jpg`);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      files.push(file);
    });
    const photoLinks = files.map(f => f.getUrl()).join("\n");

    const values = Object.assign({}, fields, { "Sent": new Date(), "Status": "New", "Match key": matchKey(d.type, d.fields || {}) });
    const docUrl = d.type === "piece" ? makePieceDoc(d.fields || {}, files, folder) : makeSpottedDoc(d.fields || {}, files, folder);
    values["Read it"] = `=HYPERLINK("${docUrl}","Open the doc")`;
    values["Folder"] = `=HYPERLINK("${folder.getUrl()}","Open folder")`;
    if (d.type === "piece") {
      values["Images"] = photoLinks;
      values["Ready for Substack"] = String(d.post || "");
    } else {
      values["Photos"] = photoLinks;
      values["Formatted post"] = String(d.post || "");
      values["Submission code"] = JSON.stringify({
        answers: d.answers || {},
        photos: files.map(f => "https://drive.google.com/thumbnail?id=" + f.getId() + "&sz=w1600")
      });
    }

    lock.waitLock(20000);
    const sheet = getSheet(form);
    renameHeader(sheet, "Instagram / TikTok", "Substack handle");
    const headers = ensureHeaders(sheet, Object.keys(values), form.last[0]);
    const row = findRow(sheet, headers, values["Match key"]);
    if (row) {
      // Sent before: keep their Status, swap in the new answers, and trash the old folder.
      values["Status"] = sheet.getRange(row, headers.indexOf("Status") + 1).getValue() || "New";
      trashOldFolder(sheet.getRange(row, headers.indexOf("Folder") + 1).getFormula(), folder.getId());
      sheet.getRange(row, 1, 1, headers.length).setValues([headers.map(h => (h in values ? values[h] : ""))]);
      formatRows(sheet, row, 1);
    } else {
      sheet.appendRow(headers.map(h => (h in values ? values[h] : "")));
      formatRows(sheet, sheet.getLastRow(), 1);
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) + " [v5] " + String(err.stack || "").split("\n").slice(0, 3).join(" ") });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, so you can check it's live.
// It also lists the spreadsheet and tabs this script writes to, to help spot setup problems.
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = ss.getSheets().map(s => `  ${s.getName()} (${s.getLastColumn()} columns)`).join("\n");
  return ContentService.createTextOutput(
    `Angels for Aid form receiver is running ✦ (v5)\n\nSpreadsheet: ${ss.getName()}\nTabs:\n${tabs}`);
}

/* ---------- spotting a repeat submission ---------- */
// Spotted: same Instagram (or same name if no Instagram). Pieces: same email and title.
function matchKey(type, f) {
  const norm = v => String(v || "").trim().toLowerCase().replace(/^'?@?/, "").replace(/\s+/g, " ");
  if (type === "piece") return "piece:" + norm(f["Email"]) + "|" + norm(f["Title"]);
  return f["Instagram"] ? "ig:" + norm(f["Instagram"]) : "name:" + norm(f["Name"]);
}

function findRow(sheet, headers, key) {
  const col = headers.indexOf("Match key") + 1, last = sheet.getLastRow();
  if (!col || !key || last < 2) return 0;
  const keys = sheet.getRange(2, col, last - 1, 1).getValues();
  for (let i = keys.length - 1; i >= 0; i--) if (keys[i][0] === key) return i + 2;
  return 0;
}

function trashOldFolder(formula, keepId) {
  const m = String(formula || "").match(/folders\/([\w-]+)/);
  if (!m || m[1] === keepId) return;
  try { DriveApp.getFolderById(m[1]).setTrashed(true); } catch (_) {}
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- the Google Doc for each newsletter piece ---------- */
function makePieceDoc(f, imageFiles, folder) {
  const title = String(f["Title"] || "Untitled");
  const doc = DocumentApp.create(`${title} by ${f["Name"]}`);
  const body = doc.getBody();
  body.setMarginLeft(72).setMarginRight(72);

  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
  if (f["Subtitle"]) body.appendParagraph(String(f["Subtitle"])).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  const byline = "By " + f["Name"] + (f["Substack handle"] ? " (" + f["Substack handle"] + ")" : "");
  body.appendParagraph(byline).editAsText().setItalic(true);
  const meta = [f["Topic"], f["Word count"] ? f["Word count"] + " words" : "", f["Location"]].filter(String).join("  ✦  ");
  if (meta) body.appendParagraph(meta).editAsText().setFontSize(9).setForegroundColor("#8a7680");

  if (imageFiles[0]) addImage(body, imageFiles[0]);

  String(f["Piece"] || "").split(/\r?\n/).forEach(line => {
    if (line.trim()) body.appendParagraph(line.trim()).setSpacingAfter(10).setLineSpacing(1.3);
  });

  imageFiles.slice(1).forEach(file => addImage(body, file));

  if (f["Bio"] || f["Image credits"]) {
    body.appendHorizontalRule();
    if (f["Bio"]) body.appendParagraph("About the angel author: " + f["Bio"]).editAsText().setItalic(true);
    if (f["Image credits"]) body.appendParagraph("Images: " + f["Image credits"]).editAsText().setFontSize(9);
  }

  return finishDoc(doc, folder);
}

/* ---------- the Google Doc for each spotted angel ---------- */
function makeSpottedDoc(f, imageFiles, folder) {
  const name = String(f["Name"] || "Angel");
  const doc = DocumentApp.create(`${name} ✦ Angel spotted`);
  const body = doc.getBody();
  body.setMarginLeft(72).setMarginRight(72);

  body.appendParagraph(name).setHeading(DocumentApp.ParagraphHeading.TITLE);
  const meta = [f["Occupation"], f["Location"], f["Instagram"]].filter(String).join("  ✦  ");
  if (meta) body.appendParagraph(meta).editAsText().setItalic(true);

  if (imageFiles[0]) addImage(body, imageFiles[0]);

  // Every other answer, as the question followed by what they wrote.
  const skip = ["Name", "Occupation", "Location", "Instagram"];
  Object.keys(f).filter(k => skip.indexOf(k) === -1 && String(f[k] || "").trim()).forEach(q => {
    body.appendParagraph(q).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    String(f[q]).split(/\r?\n/).forEach(line => {
      if (line.trim()) body.appendParagraph(line.trim()).setSpacingAfter(8).setLineSpacing(1.3);
    });
  });

  imageFiles.slice(1).forEach(file => addImage(body, file));
  return finishDoc(doc, folder);
}

function finishDoc(doc, folder) {
  const body = doc.getBody(), first = body.getChild(0);
  if (body.getNumChildren() > 1 && first.getType() === DocumentApp.ElementType.PARAGRAPH && !first.asParagraph().getText()) {
    body.removeChild(first);
  }
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  return file.getUrl();
}

function addImage(body, file) {
  const img = body.appendImage(file.getBlob());
  const max = 450;
  if (img.getWidth() > max) {
    img.setHeight(Math.round(img.getHeight() * max / img.getWidth())).setWidth(max);
  }
  img.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(12);
}

/* ---------- sheet layout ---------- */
function getSheet(form) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(form.sheet);
  if (!sheet) sheet = ss.insertSheet(form.sheet);
  // A brand-new or empty tab gets its header row.
  if (sheet.getLastColumn() === 0) {
    sheet.appendRow(form.first.concat(form.last));
    layout(sheet, form);
  }
  return sheet;
}

// Header colors, frozen header row, column widths, the Status dropdown, and compact rows.
function layout(sheet, form) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, lastCol)
    .setFontWeight("bold").setBackground(HEADER_COLOR).setWrap(true).setVerticalAlignment("middle");
  sheet.setRowHeight(1, 48);
  headers.forEach((h, i) => sheet.setColumnWidth(i + 1, form.narrow[h] || WIDE));

  const statusCol = headers.indexOf("Status") + 1;
  if (statusCol > 0) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(form.statuses, true).setAllowInvalid(true).build();
    sheet.getRange(2, statusCol, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
  }
  const sentCol = headers.indexOf("Sent") + 1;
  if (sentCol > 0) sheet.getRange(2, sentCol, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("mmm d, yyyy h:mm am/pm");

  if (sheet.getLastRow() > 1) formatRows(sheet, 2, sheet.getLastRow() - 1);
}

// Keeps rows short: long answers are clipped to one line. Click a cell (or open the Doc) to read it all.
function formatRows(sheet, startRow, count) {
  const range = sheet.getRange(startRow, 1, count, sheet.getLastColumn());
  range.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment("middle");
  sheet.setRowHeightsForced(startRow, count, ROW_HEIGHT);
}

// Adds a column for any field the sheet doesn't have yet, so new questions just work.
function ensureHeaders(sheet, keys, insertBefore) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  keys.filter(k => headers.indexOf(k) === -1).forEach(k => {
    const at = headers.indexOf(insertBefore);
    if (at > -1) {
      sheet.insertColumnBefore(at + 1);
      sheet.getRange(1, at + 1).setValue(k).setFontWeight("bold").setBackground(HEADER_COLOR);
      headers.splice(at, 0, k);
    } else {
      sheet.getRange(1, headers.length + 1).setValue(k).setFontWeight("bold").setBackground(HEADER_COLOR);
      headers.push(k);
    }
  });
  return headers;
}

// Renames a column header in place, so older sheets keep their data in the right column.
function renameHeader(sheet, from, to) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const at = headers.indexOf(from);
  if (at > -1 && headers.indexOf(to) === -1) sheet.getRange(1, at + 1).setValue(to);
}

function getFolder(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/** Run this once from the editor to create the tabs and folders and approve permissions. */
function setup() {
  Object.keys(FORMS).forEach(k => {
    getSheet(FORMS[k]);
    getFolder(FORMS[k].folder);
  });
}

// Gives rows sent before "Match key" existed a key, so a resend from that person replaces them too.
function backfillKeys(sheet, type) {
  const headers = ensureHeaders(sheet, ["Match key"], FORMS[type].last[0]);
  const last = sheet.getLastRow();
  if (last < 2) return;
  const rows = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  const col = headers.indexOf("Match key");
  const keys = rows.map(r => {
    if (r[col]) return [r[col]];
    const f = {};
    headers.forEach((h, i) => { f[h] = r[i]; });
    return [matchKey(type, f)];
  });
  sheet.getRange(2, col + 1, keys.length, 1).setValues(keys);
}

/**
 * Run this once to clear out repeat submissions already in the Sheet. For each person it keeps
 * the newest row, deletes their older rows, and moves those older folders to the Drive trash.
 * (Drive keeps trashed items for 30 days.)
 */
function removeDuplicates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = [];
  Object.keys(FORMS).forEach(k => {
    const sheet = ss.getSheetByName(FORMS[k].sheet);
    if (!sheet || sheet.getLastRow() < 3) return;
    backfillKeys(sheet, k);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const keyCol = headers.indexOf("Match key"), sentCol = headers.indexOf("Sent"), folderCol = headers.indexOf("Folder");
    const n = sheet.getLastRow() - 1;
    const rows = sheet.getRange(2, 1, n, headers.length).getValues();
    const formulas = sheet.getRange(2, folderCol + 1, n, 1).getFormulas();
    // Newest row for each key: the latest "Sent" time, or the lowest row if times tie.
    const newest = {};
    rows.forEach((r, i) => {
      const key = r[keyCol]; if (!key) return;
      const t = r[sentCol] instanceof Date ? r[sentCol].getTime() : 0;
      if (!(key in newest) || t >= newest[key].t) newest[key] = { i, t };
    });
    const drop = rows.map((r, i) => i).filter(i => rows[i][keyCol] && newest[rows[i][keyCol]].i !== i);
    drop.reverse().forEach(i => {   // bottom up, so row numbers stay right
      trashOldFolder(formulas[i][0], "");
      sheet.deleteRow(i + 2);
    });
    report.push(`${FORMS[k].sheet}: removed ${drop.length} older ${drop.length === 1 ? "copy" : "copies"}`);
  });
  Logger.log(report.join("\n") || "Nothing to clean up.");
}

/** Run this once after updating the script to neaten the tabs you already have. */
function tidy() {
  setup();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(FORMS).forEach(k => {
    const form = FORMS[k], sheet = ss.getSheetByName(form.sheet);
    if (!sheet) return;
    ensureHeaders(sheet, ["Read it", "Folder"], form.first[4]);
    backfillKeys(sheet, k);
    layout(sheet, form);
  });
}
