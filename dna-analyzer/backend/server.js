const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function isValidDNA(text) {
  return /^[ATGC]+$/i.test(text);
}

app.post("/lcs", (req, res) => {
  const { s1, s2 } = req.body || {};

  if (typeof s1 !== "string" || typeof s2 !== "string") {
    return res.status(400).json({ error: "s1 and s2 must be strings." });
  }
  if (!s1.length || !s2.length) {
    return res.status(400).json({ error: "s1 and s2 cannot be empty." });
  }
  if (!isValidDNA(s1) || !isValidDNA(s2)) {
    return res.status(400).json({ error: "Sequences must contain only A, T, G, C." });
  }

  const executable = process.platform === "win32" ? "lcs.exe" : "lcs";
  const binaryPath = path.join(__dirname, "..", "algorithm", executable);
  const child = spawn(binaryPath);

  let stdoutData = "";
  let stderrData = "";

  child.stdout.on("data", (chunk) => {
    stdoutData += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    stderrData += chunk.toString();
  });

  child.on("error", () => {
    res.status(500).json({
      error: "Failed to start LCS executable. Compile lcs.cpp first.",
    });
  });

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "LCS executable returned an error.",
        details: stderrData.trim(),
      });
    }

    try {
      const parsed = JSON.parse(stdoutData);
      return res.json(parsed);
    } catch (_err) {
      return res.status(500).json({
        error: "Invalid JSON output from LCS executable.",
        details: stdoutData.slice(0, 400),
      });
    }
  });

  child.stdin.write(`${s1}\n${s2}\n`);
  child.stdin.end();
});

app.listen(PORT, () => {
  console.log(`DNA analyzer backend running on http://localhost:${PORT}`);
});
