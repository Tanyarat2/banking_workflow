const express    = require('express');
const fileUpload = require('express-fileupload');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');

const app = express();
const PORT = 3000;

app.use(fileUpload());
app.get('/ping', (_req, res) => res.send('pong'));

app.post('/extract', async (req, res) => {
  console.log('🔔 /extract called; files=', Object.keys(req.files||{}), 'password=', req.body.password);
  if (!req.files || !req.files.file)    return res.status(400).send('Missing file upload (req.files.file)');
  if (!req.body.password)               return res.status(400).send('Missing password (req.body.password)');

  const zipFile   = req.files.file;
  const password  = req.body.password;
  const uploadsDir= path.join(__dirname, 'uploads');
  const outputDir = path.join(__dirname, 'unzipped');

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  if (!fs.existsSync(outputDir))  fs.mkdirSync(outputDir);

  const zipPath = path.join(uploadsDir, zipFile.name);
  await zipFile.mv(zipPath);

  // Use WinRAR console mode only—no Python involved
  const winrar  = `"C:\\Program Files\\WinRAR\\WinRAR.exe"`;
  const command = `${winrar} x -p${password} -y -ibck -inul "${zipPath}" "${outputDir}\\"`;

  console.log('Running:', command);
  exec(command, (err, stdout, stderr) => {
    console.log('STDOUT:', stdout);
    console.error('STDERR:', stderr);
    if (err) {
      console.error('❌ Extraction failed', err);
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    console.log('✅ Extraction complete');
    return res.json({ success: true, extractedTo: outputDir });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Extractor API running on port ${PORT}`);
});
