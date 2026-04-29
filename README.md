# CCC Project: DNA Sequence Analyzer

## Overview
This project visualizes the **Longest Common Subsequence (LCS)** between two DNA strings (characters: `A`, `T`, `G`, `C`).

It includes:
- A **frontend** that renders the UI and performs the LCS step-by-step animation in the browser.
- An optional **backend** that can run a compiled C++ executable to produce LCS results as JSON.

## Folder Structure
```
ccc_project/
  dna-analyzer/
    frontend/
      index.html
      style.css
      script.js
    backend/
      server.js
    algorithm/
      lcs.cpp
```

## Frontend (Browser) Usage
The frontend is a static web page.

1. Open `dna-analyzer/frontend/index.html` in a browser.
2. Enter two DNA sequences (only `A`, `T`, `G`, `C` — upper or lower case).
3. Click **Analyze Sequences**.
4. Click **Start Animation** to watch the DP table fill and the final LCS path build.

Notes:
- The current `script.js` computes the DP table and animation steps **directly in the browser** (so the backend is not required for the UI to work).

## Optional Backend Usage (Server + C++ executable)
The backend exposes a `POST /lcs` endpoint and runs the C++ program (`lcs.cpp`) as an executable.

### 1) Prerequisites
- Node.js (for the backend)
- A C++ compiler to build the executable (see next section)

### 2) Compile the C++ program
On Windows (PowerShell), from:
`ccc_project/dna-analyzer/algorithm/`

Run one of the following (depending on your compiler):

```powershell
# Using g++ (MinGW / MSYS2 / similar)
g++ -std=c++17 lcs.cpp -O2 -o lcs.exe
```

The backend expects:
- `dna-analyzer/algorithm/lcs.exe`

If you compile somewhere else, make sure the executable is placed at:
`dna-analyzer/algorithm/lcs.exe`

### 3) Install backend dependencies
From:
`ccc_project/dna-analyzer/backend/`

This repo does not include a `package.json`, so you may need to initialize one:

```powershell
npm init -y
npm install express cors
```

### 4) Start the backend
From:
`ccc_project/dna-analyzer/backend/`

```powershell
node server.js
```

The server will log:
- `DNA analyzer backend running on http://localhost:3000`

## Backend API
### `POST /lcs`
**Request body (JSON):**
```json
{
  "s1": "ATGCG",
  "s2": "ACGT"
}
```

**Validation:**
- `s1` and `s2` must be strings
- sequences must be non-empty
- only `A`, `T`, `G`, `C` are allowed

**Response (JSON):**
- `lcs`: the longest common subsequence string
- `length`: LCS length
- `table`: DP table of best lengths
- `steps`: array of `{i, j, value}` for DP animation order
- `path`: array of `{i, j}` positions used during backtracking

On input/runtime errors, the server responds with `400` or `500` and an error message.

## Troubleshooting
- If the backend fails: ensure `lcs.exe` exists at `dna-analyzer/algorithm/lcs.exe`.
- If you see “Failed to start LCS executable”: re-check that compilation succeeded and the executable file name matches (`lcs.exe`).
- If you see “Invalid JSON output”: confirm the executable prints JSON (the provided `lcs.cpp` does).

