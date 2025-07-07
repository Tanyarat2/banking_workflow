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
  console.log('🔔 /extract called; files=', Object.keys(req.files||{}), 'password=', req.body.password);
  if (!req.files || !req.files.file)    return res.status(400).send('Missing file upload (req.files.file)');
  if (!req.body.password)               return res.status(400).send('Missing password (req.body.password)');

  const zipFile   = req.files.file;
  const password  = req.body.password;
  const uploadsDir= path.join(__dirname, 'uploads');
  const outputBase = path.join(__dirname, 'unzipped');

 // make the folder empty
  if (fs.existsSync(outputBase)) {
    fs.rmSync(outputBase, { recursive: true, force: true });
  }
  const outputDir = path.join(outputBase, path.parse(zipFile.name).name);
  fs.mkdirSync(outputDir, { recursive: true });
  const zipPath = path.join(uploadsDir, zipFile.name);
  await zipFile.mv(zipPath);

  // Use WinRAR/7z
  const sevenZip = `"C:\\Program Files\\7-Zip\\7z.exe"`;
  const command = `${sevenZip} x "${zipPath}" -p${password} -aoa -y -o"${outputDir}"`;
  //const winrar  = `"C:\\Program Files\\WinRAR\\WinRAR.exe"`;
  //const command = `${winrar} x -p${password} -y -ibck -inul "${zipPath}" "${outputDir}\\"`;


  console.log('Running:', command);
  exec(command, (err, stdout, stderr) => {
    console.log('STDOUT:', stdout);
    console.error('STDERR:', stderr);
    if (err) {
      console.error('❌ 7z error code', err.code);  
      return res.status(500).json({ success: false, error: stderr || stdout });
    }
    console.log('✅ Extraction complete');
    res.json({ success: true, extractedTo: outputDir });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Extractor API running on port ${PORT}`);
});
