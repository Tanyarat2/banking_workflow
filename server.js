const express    = require('express');
const fileUpload = require('express-fileupload');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');

const app  = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// Server health check
app.get('/ping', (_req, res) => res.send('pong'));

// Ensure upload & unzip folders exist
const uploadDir = path.join(__dirname, 'uploads');
const unzipDir  = path.join(__dirname, 'unzipped');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(unzipDir))  fs.mkdirSync(unzipDir,  { recursive: true });

// -------Extraction--------
app.post('/extract', async (req, res) => {
  // 1. Validate incoming file(s)
  const maybeFiles = req.files?.file;
  const uploadsArr = Array.isArray(maybeFiles)
    ? maybeFiles
    : maybeFiles
      ? [maybeFiles]
      : [];

  if (uploadsArr.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing file upload (req.files.file)' });
  }

  // Validate password
  const password = req.body.password;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Missing password (req.body.password)' });
  }
  const safePassword = password.replace(/(["\s'`\\])/g, '\\$1');

  try {
    // 3. Process each archive
    for (const zipFile of uploadsArr) {
      const nameNoExt = path.parse(zipFile.name).name;
      const zipPath   = path.join(uploadDir, zipFile.name);
      const outputDir = path.join(unzipDir,   nameNoExt);

      // Clean previous extraction
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
      fs.mkdirSync(outputDir, { recursive: true });

      // Move uploaded file into place
      await zipFile.mv(zipPath);

      // WinRar/7z
      const ext = path.extname(zipFile.name).toLowerCase();
      let cmd;
      if (ext === '.zip') {
        cmd = `"C:\\Program Files\\7-Zip\\7z.exe" x "${zipPath}" -p${safePassword} -aoa -y -o"${outputDir}"`;
      } else if (ext === '.rar') {
        cmd = `"C:\\Program Files\\WinRAR\\Rar.exe" x "${zipPath}" -p${safePassword} -aoa -y -o"${outputDir}"`;
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      console.log('Running extraction command:', cmd);
      await new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
          console.log('7z stdout:', stdout);
          if (stderr) console.error('7z stderr:', stderr);
          if (err) return reject(stderr || stdout);
          resolve();
        });
      });
      console.log(`✅ Extracted: ${zipFile.name} to ${outputDir}`);
    }

    // Send success response
    console.log('✅ All extractions complete, sending response.');
    return res.json({
      success:   true,
      extracted: uploadsArr.map(z => path.parse(z.name).name),
    });

  } catch (err) {
    console.error('Extraction error:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Extractor API running on port ${PORT}`);
});
