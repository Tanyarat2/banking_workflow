const express    = require('express');
const fileUpload = require('express-fileupload');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(fileUpload());
app.get('/ping', (_req, res) => res.send('pong'));

app.post('/extract', async (req, res) => {
  // turn single upload into an array
  const uploads = Array.isArray(req.files?.file)
    ? req.files.file
    : [req.files?.file].filter(Boolean);

  if (uploads.length === 0) {
    return res.status(400).send('Missing file upload (req.files.file)');
  }
  if (!req.body.password) {
    return res.status(400).send('Missing password (req.body.password)');
  }

  const password   = req.body.password;
  const UPLOAD_DIR = path.join(__dirname, 'uploads');
  const OUT_BASE   = path.join(__dirname, 'unzipped');

  // if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
  // if (!fs.existsSync(OUT_BASE))   fs.mkdirSync(OUT_BASE);

  try {
    for (const zipFile of uploads) {
      const zipPath    = path.join(outputBase, path.parse(zipFile.name).name);
      const nameNoExt  = path.parse(zipFile.name).name;
      const outputDir  = path.join(OUT_BASE, nameNoExt);

      // ensure clean output folder
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
      fs.mkdirSync(outputDir, { recursive: true });

      // move the upload
      await zipFile.mv(zipPath);

      // extract via 7-Zip
      await new Promise((resolve, reject) => {
        const cmd = `"C:\\Program Files\\7-Zip\\7z.exe" x "${zipPath}" -p${password} -aoa -y -o"${outputDir}"`;
        exec(cmd, (err, stdout, stderr) => {
          if (err) return reject(stderr || stdout);
          resolve();
        });
      });
    }

    // success → return list of folders we unpacked
    res.json({
      success: true,
      extracted: uploads.map(z => path.parse(z.name).name),
    });
  } catch (err) {
    console.error('Extraction error', err);
    res.status(500).json({ success: false, error: err.toString() });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Extractor API running on port ${PORT}`);
});
