/**
 * pdfExport.js  — AWS DVA-C02 Quiz PDF exporter
 *
 * Architecture: every rendering primitive follows the
 * "reserve-then-draw" contract:
 *
 *   1. Call need(h) to guarantee h mm of space; this may flip to a new page.
 *   2. Snapshot y0 = getY()  (stable anchor, won't change until we call down()).
 *   3. Draw everything relative to y0.
 *   4. Call down(totalHeightUsed) exactly once at the end.
 *
 * No drawing helper may ever call need() or newPage() internally — those are
 * the caller's responsibility.  This makes the Y position predictable.
 */

import { jsPDF } from "jspdf";
import DOMPurify from "dompurify";

// ─── text utilities ───────────────────────────────────────────────────────────

function htmlToText(html) {
  if (!html) return "";
  const safe = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  const div  = document.createElement("div");
  div.innerHTML = safe;
  return (div.textContent || div.innerText || "")
    .replace(/\u00a0/g, " ").replace(/\r\n|\r/g, "\n").trim();
}

function latin1(s) {
  if (!s) return "";
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u2023\u25AA\u25CF\u25E6\u00B7]/g, "-")
    .replace(/[\u2713\u2714]/g, "(v)")
    .replace(/[\u2715\u2716\u2717\u2718]/g, "(x)")
    .replace(/[\u00AB\u00BB]/g, '"')
    .replace(/\u00AE/g, "(R)").replace(/\u00A9/g, "(c)")
    .replace(/\u00B1/g, "+/-").replace(/\u2264/g, "<=").replace(/\u2265/g, ">=")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\xFF]/g, "?");
}

const tx = (raw) => latin1(htmlToText(raw));

// ─── answer-correctness logic ─────────────────────────────────────────────────

function isCorrect(userAnswer, q) {
  if (q.isMultiSelect) {
    const correct = q.correctAnswerIndices.map((i) => q.answers[i]);
    if (!Array.isArray(userAnswer) || userAnswer.length !== correct.length) return false;
    return correct.every((a) => userAnswer.includes(a));
  }
  return userAnswer === q.answers[q.correctAnswerIndex];
}

// ─── colour palette ───────────────────────────────────────────────────────────

const T = {
  headerBg:   [22,  30,  50 ],
  orange:     [255, 153, 0  ],
  blue:       [37,  99,  235],
  blueLight:  [235, 244, 255],
  blueBorder: [147, 197, 253],
  blueDeep:   [30,  58,  138],
  green:      [22,  163, 74 ],
  greenLight: [220, 252, 231],
  red:        [220, 38,  38 ],
  redLight:   [254, 226, 226],
  ink:        [15,  23,  42 ],
  slate:      [71,  85,  105],
  muted:      [148, 163, 184],
  rule:       [226, 232, 240],
  surface:    [248, 250, 252],
  white:      [255, 255, 255],
};

// ─── page geometry ────────────────────────────────────────────────────────────

const PW       = 210;          // A4 width  (mm)
const PH       = 297;          // A4 height (mm)
const ML       = 18;           // left  margin
const MR       = 18;           // right margin
const HDR_H    = 11;           // header band height
const FTR_H    = 10;           // footer band height
const CW       = PW - ML - MR; // 174 mm content width

// Global content boundaries
const CONTENT_LEFT   = ML;
const CONTENT_RIGHT  = PW - MR;
const CONTENT_WIDTH  = CONTENT_RIGHT - CONTENT_LEFT;

const Y_TOP    = HDR_H + 4;    // first usable Y after header
const Y_BOT    = PH - FTR_H - 3; // last  usable Y before footer

// ─── typography ───────────────────────────────────────────────────────────────

const FS = { cover: 14, hdr: 7.5, section: 11, qNum: 9, domain: 7,
             qText: 9, ans: 8.5, tag: 7, result: 8, expLbl: 7.5,
             expTxt: 8, tbl: 7.5, small: 7 };

const LH = { qText: 5.2, ans: 5.0, exp: 4.8, tbl: 6.5 };

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ─── text wrapping utilities ──────────────────────────────────────────────────

/**
 * Safe text wrapping that handles long words and validates line width.
 */
function safeWrap(doc, text, maxWidth, fontSize) {
  if (!text || maxWidth <= 0) return [];

  // Use jsPDF's built-in wrap but with proper font context
  const originalFont = doc.getFont();
  const originalSize = doc.getFontSize();
  
  if (fontSize) {
    doc.setFontSize(fontSize);
  }
  
  // Use splitTextToSize which is more reliable when font is set correctly
  const wrapped = doc.splitTextToSize(String(text), maxWidth);
  
  doc.setFont(originalFont.name, originalFont.style);
  doc.setFontSize(originalSize);
  
  return wrapped;
}

/**
 * Measure the total height of wrapped lines including padding.
 */
function measureWrappedHeight(lines, lineHeight, paddingTop = 0, paddingBottom = 0) {
  return paddingTop + paddingBottom + lines.length * lineHeight;
}

// ─── PDF state object ─────────────────────────────────────────────────────────
//
// All mutable state lives here.  Rendering functions receive `S` by reference.

function makePDF(paperNum) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const S   = { doc, y: Y_TOP, paperNum };

  // ── page chrome ────────────────────────────────────────────────────────────

  S.header = function () {
    const d = S.doc;
    d.setFillColor(...T.headerBg);
    d.rect(0, 0, PW, HDR_H, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(FS.hdr);
    d.setTextColor(...T.orange);
    d.text("AWS DVA-C02 Certified Developer - Associate", ML, 7.5);
    d.setTextColor(160, 170, 190);
    d.text(`Paper ${S.paperNum}  |  Results`, PW - MR, 7.5, { align: "right" });
  };

  S.footer = function (pn, tp) {
    const d = S.doc;
    d.setFillColor(...T.surface);
    d.rect(0, PH - FTR_H, PW, FTR_H, "F");
    d.setDrawColor(...T.rule); d.setLineWidth(0.25);
    d.line(0, PH - FTR_H, PW, PH - FTR_H);
    d.setFont("helvetica", "normal"); d.setFontSize(FS.small);
    d.setTextColor(...T.slate);
    const dt = new Date().toLocaleDateString("en-GB",
      { day: "2-digit", month: "short", year: "numeric" });
    d.text(dt,                        ML,     PH - 3.5);
    d.text(`Page ${pn} of ${tp}`,     PW / 2, PH - 3.5, { align: "center" });
    d.text("AWS DVA-C02 Quiz App",    PW - MR, PH - 3.5, { align: "right" });
  };

  // ── navigation ─────────────────────────────────────────────────────────────

  /** Start a new page and reset Y. */
  S.newPage = function () {
    S.doc.addPage();
    S.header();
    S.y = Y_TOP;
  };

  /**
   * Ensure `h` mm of vertical space exists before the footer.
   * If not, flip to a new page.
   * RETURNS the stable Y after any page flip.
   */
  S.need = function (h) {
    if (S.y + h > Y_BOT) S.newPage();
    return S.y;
  };

  /**
   * Advance Y by `h`.  Does NOT trigger a page break —
   * callers must call need() before drawing to guarantee space.
   */
  S.down = function (h) { S.y += h; };

  // ── low-level draw (never call need / newPage) ──────────────────────────────

  S.fillRect = function (x, y, w, h, color, r = 0) {
    S.doc.setFillColor(...color);
    r > 0 ? S.doc.roundedRect(x, y, w, h, r, r, "F")
          : S.doc.rect(x, y, w, h, "F");
  };

  S.strokeRect = function (x, y, w, h, color, lw = 0.2, r = 0) {
    S.doc.setDrawColor(...color); S.doc.setLineWidth(lw);
    r > 0 ? S.doc.roundedRect(x, y, w, h, r, r, "S")
          : S.doc.rect(x, y, w, h, "S");
  };

  S.circle = function (cx, cy, r, color) {
    S.doc.setFillColor(...color);
    S.doc.circle(cx, cy, r, "F");
  };

  S.hline = function (y, color = T.rule, lw = 0.25) {
    S.doc.setDrawColor(...color); S.doc.setLineWidth(lw);
    S.doc.line(ML, y, ML + CW, y);
  };

  S.vline = function (x, y1, y2, color = T.rule, lw = 0.2) {
    S.doc.setDrawColor(...color); S.doc.setLineWidth(lw);
    S.doc.line(x, y1, x, y2);
  };

  /**
   * Draw a single line of text at an absolute (x, y).
   * No wrapping, no page-break side-effects.
   */
  S.text = function (str, x, y, color, fs, bold = false, opts = {}) {
    S.doc.setFont("helvetica", bold ? "bold" : "normal");
    S.doc.setFontSize(fs);
    S.doc.setTextColor(...color);
    S.doc.text(String(str), x, y, opts);
  };

  /**
   * Wrap `str` to `maxW` and return the string array.
   * Pure measurement — no drawing.
   */
  S.wrap = function (str, maxW, fontSize) {
    return safeWrap(S.doc, str, maxW, fontSize);
  };

  /**
   * Draw pre-split lines starting at the CURRENT S.y, advancing S.y
   * after each line.  Calls need() before every line to handle page breaks.
   *
   * IMPORTANT: background rects must NOT be drawn before this call because
   * a page break would put the text on a different page from the rect.
   * Use drawTextBlock() for boxed text.
   */
  S.drawLines = function (lines, x, lineH, color, fs, bold = false) {
    S.doc.setFont("helvetica", bold ? "bold" : "normal");
    S.doc.setFontSize(fs);
    S.doc.setTextColor(...color);
    for (const line of lines) {
      S.need(lineH + 1);
      S.doc.text(line, x, S.y);
      S.y += lineH;
    }
  };

  return S;
}

// ─── cover page ───────────────────────────────────────────────────────────────

function drawCover(S, { paperNum, scorePct, passed, correct, wrong, skipped, total, timeStr, genDate }) {
  // Title banner — fixed height 22 mm, always fits on a fresh page
  const BANNER_H = 22;
  S.need(BANNER_H);
  const by = S.y;
  S.fillRect(ML, by, CW, BANNER_H, T.blue, 3);
  S.text(`Paper ${paperNum}  -  Quiz Results`,
         ML + CW / 2, by + 9.5,  T.white,       FS.cover, true, { align: "center" });
  S.text(`Generated: ${genDate}   |   Time Taken: ${timeStr}`,
         ML + CW / 2, by + 17,   [200, 220, 255], FS.hdr, false, { align: "center" });
  S.down(BANNER_H + 4);

  // Score card — fixed height 30 mm
  const CARD_H = 30;
  S.need(CARD_H + 16); // card + chip + gap
  const cy = S.y;
  S.fillRect(ML, cy, CW, CARD_H, T.surface, 2);
  S.strokeRect(ML, cy, CW, CARD_H, T.rule, 0.3, 2);

  const scoreCol = passed ? T.green : T.red;
  S.text(`${scorePct}%`, ML + 27, cy + 18.5, scoreCol, 26, true, { align: "center" });
  S.text("SCORE",        ML + 27, cy + 25,   T.muted,   FS.small, false, { align: "center" });

  S.vline(ML + 52, cy + 5, cy + CARD_H - 5, T.rule, 0.3);

  const statW = (CW - 54) / 4;
  const statItems = [
    { label: "Correct",   val: correct, col: T.green },
    { label: "Incorrect", val: wrong,   col: T.red   },
    { label: "Skipped",   val: skipped, col: T.muted },
    { label: "Total",     val: total,   col: T.blue  },
  ];
  statItems.forEach(({ label, val, col }, i) => {
    const sx = ML + 54 + i * statW + statW / 2;
    S.text(String(val), sx, cy + 16.5, col,    14, true,  { align: "center" });
    S.text(label,       sx, cy + 24,   T.muted, FS.small, false, { align: "center" });
  });
  S.down(CARD_H + 5);

  // Pass/Fail chip
  const CHIP_H = 7, CHIP_W = 30;
  const chipY = S.y;
  S.fillRect(ML + CW - CHIP_W, chipY, CHIP_W, CHIP_H, passed ? T.green : T.red, 3);
  S.text(passed ? "PASSED" : "FAILED",
         ML + CW - CHIP_W / 2, chipY + 5, T.white, 8, true, { align: "center" });
  S.down(CHIP_H + 10);
}

// ─── domain table + progress bars ────────────────────────────────────────────

function drawDomains(S, domainMap) {
  const keys = Object.keys(domainMap);
  if (!keys.length) return;

  // Section title
  S.need(8);
  S.text("Domain Performance", ML, S.y, T.ink, 10, true);
  S.down(6);

  // Column geometry
  const COL = [
    { label: "Domain",  w: CW * 0.38, x: ML              },
    { label: "Total",   w: CW * 0.12, x: ML + CW * 0.38  },
    { label: "Correct", w: CW * 0.12, x: ML + CW * 0.50  },
    { label: "Wrong",   w: CW * 0.12, x: ML + CW * 0.62  },
    { label: "Skipped", w: CW * 0.12, x: ML + CW * 0.74  },
    { label: "Score",   w: CW * 0.14, x: ML + CW * 0.86  },
  ];
  const RH = 6.5;

  // Keep header + all rows together if they fit; otherwise just ensure header fits
  const tableH = RH * (keys.length + 1);
  S.need(Math.min(tableH, RH * 2)); // at least header + 1 row

  // Header row
  const hy = S.y;
  S.fillRect(ML, hy, CW, RH, T.blue);
  COL.forEach((c) =>
    S.text(c.label, c.x + c.w / 2, hy + 4.5, T.white, FS.tbl, true, { align: "center" })
  );
  S.down(RH);

  // Data rows — each row reserves its own space
  keys.forEach((domain, ri) => {
    S.need(RH + 1);
    const ry = S.y;
    const ds = domainMap[domain];
    const dp = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
    const dpCol = dp >= 72 ? T.green : T.red;

    S.fillRect(ML, ry, CW, RH, ri % 2 === 0 ? T.white : T.surface);
    S.strokeRect(ML, ry, CW, RH, T.rule, 0.15);

    // Wrap domain name instead of clipping
    const domainLines = S.wrap(domain, COL[0].w - 4, FS.tbl);
    const domainLabel = domainLines[0] || domain;
    S.text(domainLabel, COL[0].x + 2, ry + 4.5, T.ink, FS.tbl);
    [ds.total, ds.correct, ds.wrong, ds.skipped].forEach((v, ci) =>
      S.text(String(v), COL[ci + 1].x + COL[ci + 1].w / 2, ry + 4.5,
             T.slate, FS.tbl, false, { align: "center" })
    );
    S.text(`${dp}%`, COL[5].x + COL[5].w / 2, ry + 4.5, dpCol, FS.tbl, true, { align: "center" });
    S.down(RH);
  });

  S.down(8);

  // Progress bars
  S.need(8);
  S.text("Score by Domain", ML, S.y, T.ink, 10, true);
  S.down(6);

  const barW = CW - 22;
  keys.forEach((domain) => {
    S.need(13);
    const ds  = domainMap[domain];
    const dp  = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
    const col = dp >= 72 ? T.green : T.red;
    const ly  = S.y;

    // Wrap domain name for progress bars
    const domainLines = S.wrap(domain, barW - 12, FS.tbl);
    const domainLabel = domainLines[0] || domain;
    S.text(domainLabel,   ML,      ly + 3.5, T.slate, FS.tbl, false);
    S.text(`${dp}%`, ML + CW, ly + 3.5, col,     FS.tbl, true, { align: "right" });
    S.down(5.5);

    const by = S.y;
    S.fillRect(ML, by, barW, 3.5, T.rule, 1.5);
    if (dp > 0) S.fillRect(ML, by, Math.max((dp / 100) * barW, 2), 3.5, col, 1.5);
    S.down(7);
  });
}

// ─── answer option row ────────────────────────────────────────────────────────
//
// Pattern:
//   1. Measure the row height from the wrapped text.
//   2. S.need(rowH) — may flip page; returns stable y0.
//   3. Snapshot y0 = S.y.
//   4. Draw background, border, badge, text — all relative to y0.
//   5. S.down(rowH + gap).

function drawOption(S, { letter, answerText, isCorrectOpt, wasChosen, isSkipped }) {
  const CIRCLE_X = ML + 8;
  const TEXT_X   = ML + 18;
  const TEXT_W   = ML + CW - TEXT_X - 2;   // right edge of text area
  const ROW_X    = ML + 3;
  const ROW_W    = CW - 4;
  const PAD_V    = 3.5;

  const ansClean = tx(answerText);
  const lines    = S.wrap(ansClean, TEXT_W, FS.ans);
  const rowH     = lines.length * LH.ans + PAD_V * 2;

  // ── reserve space BEFORE any drawing ──────────────────────────────────────
  S.need(rowH + 2);
  const y0 = S.y;   // stable anchor — S.y won't change until S.down()

  // Background
  const bgCol = isCorrectOpt ? T.greenLight
              : (wasChosen && !isSkipped) ? T.redLight
              : null;
  if (bgCol) S.fillRect(ROW_X, y0, ROW_W, rowH, bgCol, 1.5);

  // Border
  const borderCol = isCorrectOpt ? T.green
                  : (wasChosen && !isCorrectOpt && !isSkipped) ? T.red
                  : T.rule;
  const borderLW  = (isCorrectOpt || (wasChosen && !isSkipped)) ? 0.4 : 0.15;
  S.strokeRect(ROW_X, y0, ROW_W, rowH, borderCol, borderLW, 1.5);

  // Letter circle — centered vertically in the row
  const circleBg  = isCorrectOpt ? T.green
                  : (wasChosen && !isCorrectOpt && !isSkipped) ? T.red
                  : [210, 218, 230];
  const circleTxt = (isCorrectOpt || (wasChosen && !isSkipped)) ? T.white : T.slate;
  const cy        = y0 + rowH / 2;
  S.circle(CIRCLE_X, cy, 2.8, circleBg);
  S.text(letter, CIRCLE_X, cy + 1, circleTxt, 7, true, { align: "center" });

  // Answer text lines — all drawn relative to y0, not S.y
  const textCol = isCorrectOpt ? T.green
                : (wasChosen && !isCorrectOpt && !isSkipped) ? T.red
                : T.ink;
  const bold    = isCorrectOpt || (wasChosen && !isSkipped);
  S.doc.setFont("helvetica", bold ? "bold" : "normal");
  S.doc.setFontSize(FS.ans);
  S.doc.setTextColor(...textCol);
  lines.forEach((line, li) =>
    S.doc.text(line, TEXT_X, y0 + PAD_V + 1 + li * LH.ans)
  );

  // Tag label — right-aligned on first text line
  const tags = [];
  if (wasChosen && !isSkipped) tags.push("Your answer");
  if (isCorrectOpt)            tags.push("Correct");
  if (tags.length) {
    S.text(tags.join(" & "), ML + CW, y0 + PAD_V + 1, textCol, FS.tag, false, { align: "right" });
  }

  // Advance AFTER all drawing is complete
  S.down(rowH + 2);
}

// ─── explanation block ────────────────────────────────────────────────────────
//
// The explanation may span multiple pages.  We handle it by drawing one
// "segment" per page:  a header strip, then body lines one at a time.
// Each segment reserves its height before drawing anything.

function drawExplanation(S, text) {
  if (!text) return;

  const BOX_X  = ML + 4;
  const BOX_W  = CW - 6;
  const TXT_X  = ML + 9;
  const TXT_W  = BOX_W - 10;
  const HDR_H  = 9;
  const GAP    = 2;           // padding below last text line inside box
  const linesAll = S.wrap(text, TXT_W, FS.expTxt);

  let idx = 0;
  let firstSegment = true;

  while (idx < linesAll.length) {
    // ── header strip ─────────────────────────────────────────────────────────
    S.need(HDR_H + LH.exp + 4);    // at least header + 1 body line
    const hy = S.y;
    S.fillRect(BOX_X, hy, BOX_W, HDR_H, T.blueLight, 2);
    S.strokeRect(BOX_X, hy, BOX_W, HDR_H, T.blueBorder, 0.2, 2);
    S.fillRect(BOX_X, hy, 3, HDR_H, T.blue); // left accent
    const lbl = firstSegment ? "Explanation" : "Explanation (continued)";
    S.text(lbl, TXT_X, hy + 6, T.blue, FS.expLbl, true);
    S.down(HDR_H);
    firstSegment = false;

    // ── body lines — as many as fit on this page ──────────────────────────────
    // Calculate how many lines fit before Y_BOT
    const available    = Y_BOT - S.y - GAP;
    const maxLines     = Math.max(1, Math.floor(available / LH.exp));
    const segmentLines = linesAll.slice(idx, idx + maxLines);

    // Draw background for this segment
    const segBodyH = segmentLines.length * LH.exp + GAP;
    const segY     = S.y;
    S.fillRect(BOX_X, segY - 1, BOX_W, segBodyH + 1, T.blueLight);
    S.strokeRect(BOX_X, segY - 1, BOX_W, segBodyH + 1, T.blueBorder, 0.15);
    S.fillRect(BOX_X, segY - 1, 3, segBodyH + 1, T.blueBorder); // left accent on body

    // Draw text lines relative to segY (not S.y, which will advance)
    S.doc.setFont("helvetica", "normal");
    S.doc.setFontSize(FS.expTxt);
    S.doc.setTextColor(...T.blueDeep);
    segmentLines.forEach((line, i) => {
      S.doc.text(line, TXT_X, segY + i * LH.exp);
    });

    S.down(segBodyH + 3);
    idx += segmentLines.length;

    // If more lines remain, start a new page for the next segment
    if (idx < linesAll.length) S.newPage();
  }
}

// ─── question block ───────────────────────────────────────────────────────────

function drawQuestion(S, question, userAnswer, qi) {
  const isSkipped    = userAnswer === null;
  const correct      = !isSkipped && isCorrect(userAnswer, question);
  const status       = isSkipped ? "skipped" : correct ? "correct" : "wrong";
  const statusColor  = status === "correct" ? T.green : status === "wrong" ? T.red : T.muted;
  const statusLabel  = status === "correct" ? "Correct" : status === "wrong" ? "Wrong" : "Skipped";

  const userArr      = Array.isArray(userAnswer) ? userAnswer : (userAnswer ? [userAnswer] : []);
  const qText        = tx(question.text || "");
  const expText      = tx(question.explanation || "");

  // ── question header strip ─────────────────────────────────────────────────
  // Fixed height — reserve, snapshot, draw, advance.
  const HDR_H = 9;
  S.need(HDR_H);
  const hy = S.y;

  S.fillRect(ML, hy, CW, HDR_H, T.surface);
  S.strokeRect(ML, hy, CW, HDR_H, T.rule, 0.15);
  S.fillRect(ML, hy, 3.5, HDR_H, statusColor);          // left accent

  S.text(`Q${qi + 1}`, ML + 6,  hy + 6.5, T.blue, FS.qNum, true);

  if (question.domain) {
    const dlabel = S.wrap(question.domain, CW - 55, FS.domain)[0];
    S.text(dlabel, ML + 19, hy + 6.5, T.muted, FS.domain);
  }

  const BADGE_W = 22, BADGE_H = 6;
  const bx = ML + CW - BADGE_W;
  S.fillRect(bx, hy + 1.5, BADGE_W, BADGE_H, statusColor, 2);
  S.text(statusLabel, bx + BADGE_W / 2, hy + 1.5 + BADGE_H * 0.65,
         T.white, FS.ans - 1, true, { align: "center" });

  S.down(HDR_H);

  // Multi-select note
  if (question.isMultiSelect) {
    S.need(6);
    S.text("(Select TWO)", ML + 6, S.y + 4, T.muted, FS.small, false);
    S.down(6);
  }

  // ── question text ─────────────────────────────────────────────────────────
  // drawLines handles page breaks line-by-line; NO background rect here.
  S.down(2);
  const qLines = S.wrap(qText, CW - 10, FS.qText);
  S.drawLines(qLines, ML + 6, LH.qText, T.ink, FS.qText);
  S.down(4);

  // ── answer options ────────────────────────────────────────────────────────
  question.answers.forEach((ans, ai) => {
    drawOption(S, {
      letter:       LETTERS[ai] || String(ai + 1),
      answerText:   ans,
      isCorrectOpt: question.correctAnswerIndices.includes(ai),
      wasChosen:    userArr.includes(ans),
      isSkipped,
    });
  });

  S.down(2);

  // ── result line ───────────────────────────────────────────────────────────
  S.need(8);
  S.text(`Result: ${statusLabel}`, ML + 6, S.y, statusColor, FS.result, true);
  S.down(7);

  // ── explanation ───────────────────────────────────────────────────────────
  drawExplanation(S, expText);

  // ── separator ─────────────────────────────────────────────────────────────
  S.need(8);
  S.hline(S.y, T.rule, 0.3);
  S.down(8);
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function exportQuizToPDF({ userAnswers, questions, paperNum, timeTaken }) {
  try {
    // Stats
    const total    = questions.length;
    const correct  = userAnswers.filter((a, i) => a !== null && isCorrect(a, questions[i])).length;
    const skipped  = userAnswers.filter((a) => a === null).length;
    const wrong    = total - correct - skipped;
    const scorePct = Math.round((correct / total) * 100);
    const passed   = scorePct >= 72;

    const tm = timeTaken != null ? Math.floor(timeTaken / 60) : null;
    const ts = timeTaken != null ? timeTaken % 60 : null;
    const timeStr = tm != null
      ? (tm > 0 ? `${tm}m ${String(ts).padStart(2, "0")}s` : `${ts}s`)
      : "N/A";

    const genDate = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const domainMap = {};
    questions.forEach((q, i) => {
      const d = q.domain || "General";
      if (!domainMap[d]) domainMap[d] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      domainMap[d].total++;
      const a = userAnswers[i];
      if (a === null)          domainMap[d].skipped++;
      else if (isCorrect(a, q)) domainMap[d].correct++;
      else                     domainMap[d].wrong++;
    });

    // Build PDF
    const S = makePDF(paperNum);
    S.header();

    drawCover(S, { paperNum, scorePct, passed, correct, wrong, skipped, total, timeStr, genDate });
    drawDomains(S, domainMap);

    // Section heading
    S.down(4);
    S.need(14);
    S.text("Question-by-Question Review", ML, S.y, T.ink, FS.section, true);
    S.down(3);
    S.hline(S.y, T.rule, 0.6);
    S.down(8);

    // All questions
    questions.forEach((q, i) => drawQuestion(S, q, userAnswers[i], i));

    // Footers on every page
    const totalPages = S.doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      S.doc.setPage(p);
      S.footer(p, totalPages);
    }

    S.doc.save(`DVA-C02_Paper${paperNum}_Results_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
}
