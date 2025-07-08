const express    = require('express');
const fileUpload = require('express-fileupload');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');

const app  = express();
const PORT = 3000;

// Parse form-data and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// Health-check
app.get('/ping', (_req, res) => res.send('pong'));

// Ensure folder exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUT_BASE   = path.join(__dirname, 'unzipped');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(OUT_BASE))   fs.mkdirSync(OUT_BASE,   { recursive: true });

// ── Extraction endpoint ──
app.post('/extract', async (req, res) => {
  //Normalize req.files.file into an array
  const maybeFiles   = req.files?.file;
  const uploadsArray = Array.isArray(maybeFiles)
    ? maybeFiles
    : maybeFiles
      ? [maybeFiles]
      : [];

  if (uploadsArray.length === 0) {
    return res.status(400).send('Missing file upload (req.files.file)');
  }
  if (!req.body.password) {
    return res.status(400).send('Missing password (req.body.password)');
  }
  const password = req.body.password;

  try {
    // Loop over each uploaded ZIP
    for (const zipFile of uploadsArray) {
      const nameNoExt = path.parse(zipFile.name).name;
      const zipPath   = path.join(UPLOAD_DIR, zipFile.name);
      const outputDir = path.join(OUT_BASE,   nameNoExt);

      // Clean previous extraction if any
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
      fs.mkdirSync(outputDir, { recursive: true });

      // Move uploaded zip into place
      await zipFile.mv(zipPath);

      // Run 7-Zip to extract
      await new Promise((resolve, reject) => {
        const cmd = `"C:\\Program Files\\7-Zip\\7z.exe" x "${zipPath}" -p${password} -aoa -y -o"${outputDir}"`;
        exec(cmd, (err, stdout, stderr) => {
          if (err) return reject(stderr || stdout);
          resolve();
        });
      });
    }

    // Return + names
    return res.json({
      success:   true,
      extracted: uploadsArray.map(z => path.parse(z.name).name),
    });
  } catch (err) {
    console.error('Extraction error', err);
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Extractor API running on port ${PORT}`);
});
