import PDFDocument from "pdfkit";
import { htmlToText } from "html-to-text";
import { mediaManager } from "wix-media-backend";

const LETTER = [612, 792];
const LEFT = 72;
const RIGHT = 72;
const TOP = 88;
const BOTTOM = 62;
const CONTENT_WIDTH = LETTER[0] - LEFT - RIGHT;
const SKANDI_LOGO_URL = "https://static.wixstatic.com/media/394052_635532ed8a8d446ab22f4fc09ef65858~mv2.png";

function safe(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDate(value, short = false) {
  if (!value) return "";
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", short
    ? { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }
    : { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }
  ).format(parsed);
}

function flattenSections(items = [], prefix = []) {
  const output = [];
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const path = [...prefix, index + 1];
    const number = path.join(".");
    output.push({
      ...item,
      number,
      label: path.length === 1 ? `${number}.` : number,
      depth: path.length - 1
    });
    output.push(...flattenSections(item.children || [], path));
  });
  return output;
}

async function fetchLogo() {
  try {
    const response = await fetch(SKANDI_LOGO_URL);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (_) {
    return null;
  }
}

function drawBrand(doc, policy, logoBuffer) {
  const brand = safe(policy.brand, "SKANDI TRAVELS");
  if (brand === "SKANDI TRAVELS" && logoBuffer) {
    try {
      doc.image(logoBuffer, LEFT, 36, { width: 92, height: 30, fit: [92, 30] });
      return;
    } catch (_) {
      // Fall back to text below.
    }
  }
  doc
    .font("Helvetica-BoldOblique")
    .fontSize(19)
    .fillColor("#003B73")
    .text(brand === "ALTEA" ? "ALTEA" : "SKANDI", LEFT, 39, { width: 110, lineBreak: false });
}

function drawHeader(doc, policy, logoBuffer) {
  drawBrand(doc, policy, logoBuffer);
  const effective = formatDate(policy.effectiveDate, true) || "Not set";
  const header = `${safe(policy.title, "Policy")} | Effective Date: ${effective}`;
  doc
    .font("Times-Roman")
    .fontSize(9.5)
    .fillColor("#222222")
    .text(header, 206, 43, { width: 334, align: "center", lineBreak: false });

  if (policy.scope === "internal") {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#9A3412")
      .text("INTERNAL USE ONLY", 420, 59, { width: 120, align: "right", lineBreak: false });
  }
  doc.fillColor("#111111");
}

function drawFooter(doc, policy, pageNumber, totalPages) {
  const issuer = safe(policy.brand, "SKANDI TRAVELS");
  const route = policy.scope === "internal"
    ? "/riaintra/success-factors/legal"
    : "skanditravels.com/about/legal";
  const footer = `Issued to ${issuer} | Version ${safe(policy.version, "1.0")} | ${route} | Page ${pageNumber} of ${totalPages}`;
  doc
    .font("Times-Roman")
    .fontSize(8.5)
    .fillColor("#2B2B2B")
    .text(footer, LEFT, 757, { width: CONTENT_WIDTH, align: "center", lineBreak: false });
}

function ensureSpace(doc, needed = 30) {
  if (doc.y + needed > LETTER[1] - BOTTOM) {
    doc.addPage();
    doc.y = TOP;
  }
}

function htmlAsPlainText(html) {
  return htmlToText(String(html || ""), {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "img", format: "skip" }
    ]
  })
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderPlainText(doc, text, options = {}) {
  const value = String(text || "").trim();
  if (!value) return;
  const paragraphs = value.split(/\n\s*\n/);
  paragraphs.forEach((paragraph) => {
    const lines = paragraph.split(/\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;

    const bulletLike = lines.every((line) => /^([*•●-]|\d+[.)])\s+/.test(line));
    if (bulletLike) {
      lines.forEach((line) => {
        ensureSpace(doc, 22);
        const cleaned = line.replace(/^([*•●-]|\d+[.)])\s+/, "");
        doc
          .font("Times-Roman")
          .fontSize(options.fontSize || 11)
          .fillColor("#111111")
          .text("-", LEFT + (options.indent || 0), doc.y, { width: 12, continued: true })
          .text(cleaned, { width: CONTENT_WIDTH - (options.indent || 0) - 12, lineGap: 3 });
        doc.moveDown(0.15);
      });
      doc.moveDown(0.35);
      return;
    }

    ensureSpace(doc, 42);
    doc
      .font("Times-Roman")
      .fontSize(options.fontSize || 11)
      .fillColor("#111111")
      .text(lines.join(" "), LEFT + (options.indent || 0), doc.y, {
        width: CONTENT_WIDTH - (options.indent || 0),
        align: "left",
        lineGap: 3
      });
    doc.moveDown(0.7);
  });
}

function renderRichBody(doc, html, options = {}) {
  renderPlainText(doc, htmlAsPlainText(html), options);
}

function drawDocumentControl(doc, policy) {
  ensureSpace(doc, 230);
  doc.moveDown(0.6);
  doc
    .strokeColor("#777777")
    .lineWidth(0.7)
    .moveTo(LEFT, doc.y)
    .lineTo(LETTER[0] - RIGHT, doc.y)
    .stroke();
  doc.moveDown(1.25);
  doc.font("Times-Bold").fontSize(12).fillColor("#111111").text("Document Control", LEFT, doc.y);
  doc.moveDown(0.65);

  const rows = [
    ["Version:", safe(policy.version, "1.0")],
    ["Effective Date:", formatDate(policy.effectiveDate) || "Not set"],
    ["Last Updated:", formatDate(policy.updatedAt || new Date().toISOString())],
    ["Approved By:", safe(policy.approvedBySkId, "Not set")],
    ["Owner:", safe(policy.owner, "Legal / Compliance")],
    ["Classification:", policy.scope === "internal" ? "Internal Use Only" : "External Publication"]
  ];

  const x = LEFT;
  const labelWidth = 126;
  const valueWidth = 238;
  const rowHeight = 27;
  rows.forEach(([label, value]) => {
    ensureSpace(doc, rowHeight + 4);
    const y = doc.y;
    doc.rect(x, y, labelWidth, rowHeight).fillAndStroke("#F0F0F0", "#333333");
    doc.rect(x + labelWidth, y, valueWidth, rowHeight).fillAndStroke("#F7F7F7", "#333333");
    doc.font("Courier").fontSize(8.7).fillColor("#222222").text(label, x + 6, y + 8, { width: labelWidth - 12 });
    doc.font("Courier").fontSize(8.7).fillColor("#222222").text(value, x + labelWidth + 6, y + 8, { width: valueWidth - 12 });
    doc.y = y + rowHeight;
  });
  doc.moveDown(0.6);
}

async function buildPdfBuffer(policy) {
  const logoBuffer = await fetchLogo();
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: TOP, left: LEFT, right: RIGHT, bottom: BOTTOM },
    bufferPages: true,
    autoFirstPage: false,
    info: {
      Title: safe(policy.title, "SKANDI Policy"),
      Author: safe(policy.brand, "SKANDI TRAVELS"),
      Subject: policy.scope === "internal" ? "Internal Use Only" : "External Legal Policy",
      Keywords: "SKANDI, policy, legal"
    }
  });

  const chunks = [];
  const completed = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.on("pageAdded", () => {
    drawHeader(doc, policy, logoBuffer);
    doc.y = TOP;
  });

  doc.addPage();
  doc.y = 112;
  doc.font("Times-Bold").fontSize(21).fillColor("#111111").text(safe(policy.title, "Policy"), LEFT, doc.y, {
    width: CONTENT_WIDTH
  });
  doc.moveDown(0.7);
  doc.font("Times-Bold").fontSize(11).text("Effective Date:", { continued: true });
  doc.font("Times-Roman").text(` ${formatDate(policy.effectiveDate) || "Not set"}`);
  doc.moveDown(0.85);

  if (policy.summary) renderPlainText(doc, policy.summary);
  if (policy.introductionHtml) renderRichBody(doc, policy.introductionHtml);

  const flattened = flattenSections(policy.sections || []);
  const tocPositions = [];
  const sectionPages = new Map();

  ensureSpace(doc, 55);
  doc.font("Times-Bold").fontSize(14).text("Table of Contents", LEFT, doc.y);
  doc.moveDown(0.55);
  flattened.forEach((section) => {
    ensureSpace(doc, 19);
    const pageIndex = doc.bufferedPageRange().count - 1;
    const y = doc.y;
    const indent = Math.min(section.depth, 3) * 16;
    const title = `${section.label} ${safe(section.title, "Untitled Section")}`;
    doc
      .font(section.depth === 0 ? "Times-Bold" : "Times-Roman")
      .fontSize(section.depth === 0 ? 10.5 : 9.8)
      .fillColor("#111111")
      .text(title, LEFT + indent, y, { width: CONTENT_WIDTH - indent - 38, lineBreak: false, ellipsis: true });
    tocPositions.push({ pageIndex, y, number: section.number });
    doc.y = y + 16;
  });

  if (flattened.length) {
    doc.addPage();
    doc.y = TOP;
  }

  flattened.forEach((section) => {
    const headingSize = section.depth === 0 ? 14 : section.depth === 1 ? 12.5 : section.depth === 2 ? 11.5 : 10.5;
    ensureSpace(doc, headingSize * 3 + 22);
    const currentPage = doc.bufferedPageRange().count;
    if (!sectionPages.has(section.number)) sectionPages.set(section.number, currentPage);

    const heading = `${section.label} ${safe(section.title, "Untitled Section")}`;
    doc
      .font("Times-Bold")
      .fontSize(headingSize)
      .fillColor("#111111")
      .text(heading, LEFT, doc.y, { width: CONTENT_WIDTH, lineGap: 2 });
    doc.moveDown(0.55);
    renderRichBody(doc, section.bodyHtml || "", { indent: Math.min(section.depth, 3) * 6 });
  });

  drawDocumentControl(doc, policy);

  tocPositions.forEach((position) => {
    const targetPage = sectionPages.get(position.number) || "-";
    doc.switchToPage(position.pageIndex);
    doc
      .font("Times-Roman")
      .fontSize(9.8)
      .fillColor("#111111")
      .text(String(targetPage), LETTER[0] - RIGHT - 28, position.y, { width: 28, align: "right", lineBreak: false });
  });

  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  for (let index = 0; index < totalPages; index += 1) {
    doc.switchToPage(index);
    drawFooter(doc, policy, index + 1, totalPages);
  }

  doc.end();
  return completed;
}

function fileNameFor(policy) {
  const slug = safe(policy.slug, "policy")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const version = safe(policy.version, "1.0").replace(/[^0-9A-Za-z.-]+/g, "-");
  return `${slug}-v${version}.pdf`;
}

export async function buildAndStorePolicyPdf(policy) {
  const buffer = await buildPdfBuffer(policy);
  const fileName = fileNameFor(policy);
  const uploaded = await mediaManager.upload(
    "/legal/policies",
    buffer,
    fileName,
    {
      mediaOptions: {
        mimeType: "application/pdf",
        mediaType: "document"
      },
      metadataOptions: {
        isPrivate: policy.scope === "internal",
        isVisitorUpload: false,
        context: {
          policyId: safe(policy.policyId || policy._id),
          scope: safe(policy.scope)
        }
      }
    }
  );

  return {
    fileUrl: uploaded?.fileUrl || uploaded?.file?.url || "",
    fileName,
    generatedAt: new Date().toISOString()
  };
}

export async function getPolicyPdfDownloadUrl(fileUrl, fileName) {
  if (!fileUrl) return "";
  return mediaManager.getDownloadUrl(fileUrl, 60, fileName || "SKANDI-Policy.pdf", null);
}
