const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'tab-relay.zip');
const isWindows = process.platform === 'win32';

// Remove old zip if exists
if (fs.existsSync(outFile)) {
  fs.unlinkSync(outFile);
  console.log('Removed existing zip file');
}

// Files to include in the extension package
const filesToInclude = ['manifest.json', 'dist', 'icons'];

if (isWindows) {
  // Windows: use PowerShell Compress-Archive
  const expandedPaths = filesToInclude.map(f => `"${path.join(root, f)}"`).join(', ');
  const cmd = `powershell -Command "Compress-Archive -Force -Path ${expandedPaths} -DestinationPath '${outFile}'"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`\nPackaged: ${outFile}`);
  } catch (err) {
    console.error('Packaging failed with PowerShell Compress-Archive');
    process.exit(1);
  }
} else {
  // Linux/macOS: use zip
  const args = filesToInclude.join(' ');
  try {
    execSync(`cd "${root}" && zip -r tab-relay.zip ${args}`, { stdio: 'inherit' });
    console.log(`\nPackaged: ${outFile}`);
  } catch (err) {
    console.error('Packaging failed. Make sure "zip" is installed: sudo apt install zip');
    process.exit(1);
  }
}
