import { jsPDF } from "jspdf";
import DOMPurify from "dompurify";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip HTML tags and decode HTML entities to clean plain text.
 * Preserves newlines from block elements.
 */
function htmlToPlainText(html) {
  if (!html) return "";
  // Allow nothing — we just want text content
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  const div = document.createElement("div");
  div.innerHTML = clean;
  // Replace <br> with newline before stripping tags
  return (div.textContent || div.innerText || "")
    .replace(/\u00a0/g, " ")   // non-breaking space → normal space
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/**
 * Sanitise a raw string for safe embedding in jsPDF.
 * jsPDF's built-in helvetica only covers Latin-1 (ISO-8859-1).
 * Replace anything outside that range with a safe ASCII equivalent.
 */
function sanitiseForPDF(str) {
  if (!str) return "";
  return str
    // Common typographic replacements
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")   // smart single quotes → '
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')   // smart double quotes → "
    .replace(/[\u2013\u2014]/g, "-")               // en/em dash → -
    .replace(/\u2026/g, "...")                     // ellipsis → ...
    .replace(/\u00A0/g, " ")                       // NBSP → space
    .replace(/\u00B7/g, "*")                       // middle dot → *
    .replace(/[\u2022\u2023\u25AA\u25CF\u25E6]/g, "*") // bullets → *
    .replace(/[\u2713\u2714]/g, "[OK]")            // check marks → [OK]
    .replace(/[\u2715\u2716\u2717\u2718]/g, "[X]") // x marks → [X]
    .replace(/[\u00AB\u00BB]/g, '"')               // guillemets → "
    .replace(/[\u00B0]/g, " degrees")             // degree sign
    .replace(/[\u00AE]/g, "(R)")                   // registered
    .replace(/[\u00A9]/g, "(c)")                   // copyright
    .replace(/[\u00B1]/g, "+/-")                   // plus-minus
    .replace(/[\u2264]/g, "<=")                    // ≤
    .replace(/[\u2265]/g, ">=")                    // ≥
    // Strip any remaining non-Latin-1 characters (> U+00FF)
    .replace(/[^\x00-\xFF]/g, "?");
}

function cleanText(raw) {
  return sanitiseForPDF(htmlToPlainText(raw));
}

function isAnswerCorrect(userAnswer, question) {
  if (question.isMultiSelect) {
    const correctAnswers = question.correctAnswerIndices.map(
      (i) => question.answers[i]
    );
    if (!Array.isArray(userAnswer)) return false;
    if (userAnswer.length !== correctAnswers.length) return false;
    return correctAnswers.every((a) => userAnswer.includes(a));
  }
  return userAnswer === question.answers[question.correctAnswerIndex];
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR PALETTE  (all plain RGB arrays — no emoji, no special chars)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  primary:    [37, 99, 235],
  correct:    [22, 163, 74],
  wrong:      [220, 38, 38],
  skipped:    [100, 116, 139],
  pass:       [21, 128, 61],
  fail:       [185, 28, 28],
  heading:    [15, 23, 42],
  subtext:    [71, 85, 105],
  lightGray:  [241, 245, 249],
  midGray:    [226, 232, 240],
  border:     [203, 213, 225],
  white:      [255, 255, 255],
  awsOrange:  [255, 153, 0],
  expBg:      [239, 246, 255],
  expBorder:  [147, 197, 253],
  expText:    [30, 58, 138],
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function exportQuizToPDF({ userAnswers, questions, paperNum, timeTaken }) {

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW = doc.internal.pageSize.getWidth();   // 210 mm
  const PH = doc.internal.pageSize.getHeight();  // 297 mm
  const M  = 15;                                 // left/right margin
  const CW = PW - M * 2;                         // 180 mm usable width
  const CONTENT_BOTTOM = PH - 12;                // leave room for footer

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total        = questions.length;
  const correctCount = userAnswers.filter((a, i) => a !== null && isAnswerCorrect(a, questions[i])).length;
  const skippedCount = userAnswers.filter((a) => a === null).length;
  const wrongCount   = total - correctCount - skippedCount;
  const scorePct     = Math.round((correctCount / total) * 100);
  const passed       = scorePct >= 72;

  const timeMins = timeTaken != null ? Math.floor(timeTaken / 60) : null;
  const timeSecs = timeTaken != null ? timeTaken % 60 : null;
  const timeStr  = timeMins != null
    ? (timeMins > 0 ? `${timeMins}m ${String(timeSecs).padStart(2, "0")}s` : `${timeSecs}s`)
    : "N/A";

  const domainMap = {};
  questions.forEach((q, i) => {
    const d = q.domain || "General";
    if (!domainMap[d]) domainMap[d] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
    domainMap[d].total++;
    const ans = userAnswers[i];
    if (ans === null)                  domainMap[d].skipped++;
    else if (isAnswerCorrect(ans, q)) domainMap[d].correct++;
    else                              domainMap[d].wrong++;
  });

  // ── Helpers that close over doc / layout vars ───────────────────────────

  function pageHeader() {
    doc.setFillColor(...C.heading);
    doc.rect(0, 0, PW, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.awsOrange);
    doc.text("AWS DVA-C02 Certified Developer - Associate", 10, 8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Paper ${paperNum}  |  Results`, PW - 10, 8, { align: "right" });
  }

  function pageFooter(pn, tp) {
    doc.setFillColor(...C.lightGray);
    doc.rect(0, PH - 10, PW, 10, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(0, PH - 10, PW, PH - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.subtext);
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
    doc.text(dateStr,              M,        PH - 3.5);
    doc.text(`Page ${pn} of ${tp}`, PW / 2,  PH - 3.5, { align: "center" });
    doc.text("AWS DVA-C02 Quiz App", PW - M, PH - 3.5, { align: "right" });
  }

  // Y-position tracker and page-break helper
  let y = 16;
  pageHeader();

  /**
   * Advance y by `amount`.  If the new position exceeds CONTENT_BOTTOM, add
   * a new page first and reset y to the top content area.
   */
  function advance(amount) {
    y += amount;
    if (y > CONTENT_BOTTOM) {
      newPage();
    }
  }

  function newPage() {
    doc.addPage();
    pageHeader();
    y = 16;
  }

  /**
   * Ensure there are at least `needed` mm left before CONTENT_BOTTOM.
   * If not, start a new page.
   */
  function ensureSpace(needed) {
    if (y + needed > CONTENT_BOTTOM) {
      newPage();
    }
  }

  /**
   * Draw wrapped text and advance y accordingly.
   * Returns the new y after rendering.
   */
  function drawWrapped(text, x, maxW, lineH, opts = {}) {
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((line) => {
      ensureSpace(lineH + 1);
      doc.text(line, x, y, opts);
      y += lineH;
    });
    return y;
  }

  // ── PAGE 1 — COVER ────────────────────────────────────────────────────────

  // Title banner
  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 24, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.white);
  doc.text(`Paper ${paperNum}  -  Quiz Results`, M + CW / 2, y + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 220, 255);
  const genDate = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  doc.text(`Generated: ${genDate}   |   Time Taken: ${timeStr}`, M + CW / 2, y + 18, { align: "center" });
  y += 28;

  // Score card
  const SCH = 32;
  doc.setFillColor(...C.lightGray);
  doc.roundedRect(M, y, CW, SCH, 3, 3, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, SCH, 3, 3, "S");

  // Big score number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...(passed ? C.pass : C.fail));
  doc.text(`${scorePct}%`, M + 28, y + 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.subtext);
  doc.text("SCORE", M + 28, y + 27, { align: "center" });

  // Vertical divider
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M + 54, y + 5, M + 54, y + SCH - 5);

  // Stat columns
  const statCols = [
    { label: "Correct",   val: correctCount, col: C.correct },
    { label: "Incorrect", val: wrongCount,   col: C.wrong   },
    { label: "Skipped",   val: skippedCount, col: C.skipped },
    { label: "Total",     val: total,        col: C.primary },
  ];
  const statColW = (CW - 56) / 4;
  statCols.forEach(({ label, val, col }, i) => {
    const sx = M + 56 + i * statColW + statColW / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...col);
    doc.text(String(val), sx, y + 17, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.subtext);
    doc.text(label, sx, y + 24, { align: "center" });
  });
  y += SCH + 5;

  // Pass / Fail pill
  doc.setFillColor(...(passed ? C.pass : C.fail));
  doc.roundedRect(M + CW - 36, y, 36, 8, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text(passed ? "PASSED" : "FAILED", M + CW - 18, y + 5.5, { align: "center" });
  y += 14;

  // ── Domain performance table ───────────────────────────────────────────────
  const domainKeys = Object.keys(domainMap);
  if (domainKeys.length > 0) {
    ensureSpace(14 + domainKeys.length * 7 + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.heading);
    doc.text("Domain Performance", M, y);
    y += 5;

    // Column layout
    const DC = [
      { label: "Domain",  w: CW * 0.38, x: M            },
      { label: "Total",   w: CW * 0.12, x: M + CW * 0.38 },
      { label: "Correct", w: CW * 0.12, x: M + CW * 0.50 },
      { label: "Wrong",   w: CW * 0.12, x: M + CW * 0.62 },
      { label: "Skipped", w: CW * 0.12, x: M + CW * 0.74 },
      { label: "Score",   w: CW * 0.14, x: M + CW * 0.86 },
    ];
    const RH = 7;

    // Header row
    doc.setFillColor(...C.primary);
    doc.rect(M, y, CW, RH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    DC.forEach((c) => doc.text(c.label, c.x + c.w / 2, y + 4.8, { align: "center" }));
    y += RH;

    domainKeys.forEach((domain, ri) => {
      ensureSpace(RH + 1);
      const ds = domainMap[domain];
      const dp = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
      const dpColor = dp >= 72 ? C.correct : C.wrong;

      doc.setFillColor(...(ri % 2 === 0 ? C.white : C.lightGray));
      doc.rect(M, y, CW, RH, "F");
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.rect(M, y, CW, RH, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.heading);
      // Clip domain name to fit column
      const domainLabel = doc.splitTextToSize(domain, DC[0].w - 4)[0];
      doc.text(domainLabel, DC[0].x + 2, y + 4.8);

      [ds.total, ds.correct, ds.wrong, ds.skipped].forEach((v, ci) => {
        doc.setTextColor(...C.subtext);
        doc.text(String(v), DC[ci + 1].x + DC[ci + 1].w / 2, y + 4.8, { align: "center" });
      });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dpColor);
      doc.text(`${dp}%`, DC[5].x + DC[5].w / 2, y + 4.8, { align: "center" });
      y += RH;
    });

    y += 8;

    // Progress bars
    ensureSpace(8 + domainKeys.length * 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.heading);
    doc.text("Score by Domain", M, y);
    y += 6;

    domainKeys.forEach((domain) => {
      ensureSpace(14);
      const ds = domainMap[domain];
      const dp = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
      const bCol = dp >= 72 ? C.correct : C.wrong;
      const barW = CW - 26;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.subtext);
      doc.text(domain, M, y + 3.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...bCol);
      doc.text(`${dp}%`, PW - M, y + 3.5, { align: "right" });
      y += 6;

      doc.setFillColor(...C.midGray);
      doc.roundedRect(M, y, barW, 4, 2, 2, "F");
      if (dp > 0) {
        doc.setFillColor(...bCol);
        doc.roundedRect(M, y, Math.max((dp / 100) * barW, 2), 4, 2, 2, "F");
      }
      y += 8;
    });
  }

  // ── Section break before questions ────────────────────────────────────────
  y += 4;
  ensureSpace(16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.heading);
  doc.text("Question-by-Question Review", M, y);
  y += 3;
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.6);
  doc.line(M, y, M + CW, y);
  y += 7;

  // ── QUESTIONS ─────────────────────────────────────────────────────────────
  // Option letter labels A/B/C/D/E...
  const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const LINE_H_Q    = 5.2;   // question text line height
  const LINE_H_ANS  = 5.0;   // answer option line height
  const LINE_H_EXP  = 4.8;   // explanation line height

  questions.forEach((question, qi) => {
    const userAnswer   = userAnswers[qi];
    const isSkipped    = userAnswer === null;
    const isCorrect    = !isSkipped && isAnswerCorrect(userAnswer, question);
    const status       = isSkipped ? "skipped" : isCorrect ? "correct" : "wrong";
    const statusColor  = status === "correct" ? C.correct : status === "wrong" ? C.wrong : C.skipped;
    const statusLabel  = status === "correct" ? "Correct" : status === "wrong" ? "Wrong" : "Skipped";

    const correctAnswers = question.correctAnswerIndices.map((i) => question.answers[i]);
    const userAnswerArr  = Array.isArray(userAnswer) ? userAnswer
                        : (userAnswer ? [userAnswer] : []);

    // Clean texts
    const questionText   = cleanText(question.text || "");
    const explanationText = cleanText(question.explanation || "");

    // ── Estimate block height so we can avoid splitting across page ──
    const qW      = CW - 10;
    const ansW    = CW - 22;
    const expW    = CW - 16;
    const qLineCount = doc.splitTextToSize(questionText, qW).length;
    const ansLineCount = question.answers.reduce((sum, a) => {
      return sum + doc.splitTextToSize(cleanText(a), ansW).length;
    }, 0);
    const expLineCount = explanationText
      ? doc.splitTextToSize(explanationText, expW).length
      : 0;

    // Header + question lines + padding
    const estimatedH = 10
      + qLineCount  * LINE_H_Q  + 4
      + ansLineCount * LINE_H_ANS + question.answers.length * 3 + 4
      + (expLineCount > 0 ? expLineCount * LINE_H_EXP + 12 : 0)
      + 8; // divider + spacing

    // If the whole block fits on remaining page, keep together.
    // If it's huge (>120mm), just ensure we have at least 30mm to start.
    if (estimatedH <= 120) {
      ensureSpace(estimatedH);
    } else {
      ensureSpace(30);
    }

    // ── Question header row ─────────────────────────────────────────────────
    // Coloured left accent stripe
    doc.setFillColor(...statusColor);
    doc.rect(M, y, 3, 8, "F");

    // Q-number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.primary);
    doc.text(`Q${qi + 1}`, M + 5, y + 5.8);

    // Domain tag (if present)
    if (question.domain) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.subtext);
      const domainX = M + 18;
      const domainText = doc.splitTextToSize(question.domain, CW - 50)[0];
      doc.text(domainText, domainX, y + 5.8);
    }

    // Status badge (right side)
    const badgeW = 22;
    doc.setFillColor(...statusColor);
    doc.roundedRect(M + CW - badgeW, y + 1, badgeW, 6, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.text(statusLabel, M + CW - badgeW / 2, y + 5.5, { align: "center" });

    // Multi-select indicator
    if (question.isMultiSelect) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(...C.subtext);
      doc.text("(Select TWO)", M + 5, y + 11);
      y += 3;
    }

    y += 10;

    // ── Question text ───────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.heading);
    const qTextLines = doc.splitTextToSize(questionText, qW);
    qTextLines.forEach((line) => {
      ensureSpace(LINE_H_Q + 1);
      doc.text(line, M + 6, y);
      y += LINE_H_Q;
    });
    y += 4;

    // ── Answer options ──────────────────────────────────────────────────────
    question.answers.forEach((ans, ai) => {
      const cleanAns       = cleanText(ans);
      const isThisCorrect  = question.correctAnswerIndices.includes(ai);
      const wasChosen      = userAnswerArr.includes(ans);
      const letter         = OPTION_LETTERS[ai] || String(ai + 1);

      // Background tint
      let bgFill = null;
      if (isThisCorrect && wasChosen) bgFill = [209, 250, 229];  // green tint: correct + chosen
      else if (isThisCorrect)         bgFill = [209, 250, 229];  // green tint: correct answer
      else if (wasChosen)             bgFill = [254, 226, 226];  // red tint: wrong choice

      // Measure lines for this answer
      const ansLines = doc.splitTextToSize(cleanAns, ansW);
      const rowH = ansLines.length * LINE_H_ANS + 3;

      ensureSpace(rowH + 2);

      // Draw background pill
      if (bgFill) {
        doc.setFillColor(...bgFill);
        doc.roundedRect(M + 5, y - 3, CW - 8, rowH + 2, 1.5, 1.5, "F");
      }

      // Border for all rows
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.roundedRect(M + 5, y - 3, CW - 8, rowH + 2, 1.5, 1.5, "S");

      // Letter badge
      const letterBgColor = isThisCorrect ? C.correct : (wasChosen && !isThisCorrect ? C.wrong : C.midGray);
      const letterTxtColor = (isThisCorrect || (wasChosen && !isThisCorrect)) ? C.white : C.subtext;
      doc.setFillColor(...letterBgColor);
      doc.circle(M + 10, y + (rowH - 3) / 2 - 1, 2.8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...letterTxtColor);
      doc.text(letter, M + 10, y + (rowH - 3) / 2 + 0.5, { align: "center" });

      // Answer text
      const ansTextColor = isThisCorrect ? C.correct
                        : (wasChosen && !isThisCorrect ? C.wrong : C.heading);
      doc.setFont("helvetica", wasChosen || isThisCorrect ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...ansTextColor);
      ansLines.forEach((line, li) => {
        doc.text(line, M + 16, y + li * LINE_H_ANS);
      });

      // Inline tag: "Your answer", "Correct answer"
      const tagParts = [];
      if (wasChosen)      tagParts.push("Your answer");
      if (isThisCorrect)  tagParts.push("Correct");
      if (tagParts.length > 0) {
        const tagStr = tagParts.join(" & ");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(...ansTextColor);
        doc.text(tagStr, M + CW - 7, y + (ansLines.length - 1) * LINE_H_ANS, { align: "right" });
      }

      y += rowH + 3;
    });

    y += 2;

    // ── Result line ─────────────────────────────────────────────────────────
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...statusColor);
    const resultLine = `Result: ${statusLabel}`;
    doc.text(resultLine, M + 6, y);
    y += 7;

    // ── Explanation ─────────────────────────────────────────────────────────
    if (explanationText) {
      const expLines = doc.splitTextToSize(explanationText, expW);
      const expBlockH = expLines.length * LINE_H_EXP + 12;

      ensureSpace(Math.min(expBlockH, 40)); // ensure at least start of block fits

      // Box background
      doc.setFillColor(...C.expBg);
      doc.roundedRect(M + 5, y, CW - 8, expBlockH, 2, 2, "F");
      doc.setDrawColor(...C.expBorder);
      doc.setLineWidth(0.2);
      doc.roundedRect(M + 5, y, CW - 8, expBlockH, 2, 2, "S");
      // Left accent
      doc.setFillColor(...C.expBorder);
      doc.rect(M + 5, y, 2.5, expBlockH, "F");

      // "Explanation" label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.primary);
      doc.text("Explanation:", M + 11, y + 6);
      y += 10;

      // Body text — line by line with page-break awareness
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.expText);
      expLines.forEach((line) => {
        if (y > CONTENT_BOTTOM - 6) {
          // Redraw the box background won't be perfect after a page break,
          // so just start fresh with indented text
          newPage();
          // Draw a minimal continuation header
          doc.setFillColor(...C.expBg);
          doc.roundedRect(M + 5, y, CW - 8, 8, 2, 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(...C.primary);
          doc.text("Explanation (continued):", M + 11, y + 5.5);
          y += 10;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...C.expText);
        }
        doc.text(line, M + 11, y);
        y += LINE_H_EXP;
      });
      y += 4;
    }

    // ── Divider between questions ───────────────────────────────────────────
    y += 2;
    ensureSpace(6);
    doc.setDrawColor(...C.midGray);
    doc.setLineWidth(0.3);
    doc.line(M, y, M + CW, y);
    y += 7;
  });

  // ── Add footers to ALL pages ───────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    pageFooter(p, totalPages);
  }

  const filename = `DVA-C02_Paper${paperNum}_Results_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
