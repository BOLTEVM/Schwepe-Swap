const fs = require('fs');
const path = require('path');

const contractsToExport = [
  { contract: 'SchwepeFactory', relPath: 'contracts/core/SchwepeFactory.sol/SchwepeFactory.json' },
  { contract: 'SchwepePair', relPath: 'contracts/core/SchwepePair.sol/SchwepePair.json' },
  { contract: 'SchwepeRouter', relPath: 'contracts/periphery/SchwepeRouter.sol/SchwepeRouter.json' },
  { contract: 'WSOMI', relPath: 'contracts/tokens/WSOMI.sol/WSOMI.json' },
  { contract: 'SchwepeToken', relPath: 'contracts/tokens/SchwepeToken.sol/SchwepeToken.json' },
  { contract: 'SchwepeMasterChef', relPath: 'contracts/farming/SchwepeMasterChef.sol/SchwepeMasterChef.json' }
];

const artifactsDir = path.join(__dirname, '..', 'artifacts');
const sdkAbiDir = path.join(__dirname, '..', '..', 'sdk', 'src', 'abi');
const frontendAbiDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'abi');

[sdkAbiDir, frontendAbiDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let exportedCount = 0;

contractsToExport.forEach(({ contract, relPath }) => {
  const artifactPath = path.join(artifactsDir, relPath);
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abiContent = JSON.stringify(artifact.abi, null, 2);
    
    fs.writeFileSync(path.join(sdkAbiDir, `${contract}.json`), abiContent);
    fs.writeFileSync(path.join(frontendAbiDir, `${contract}.json`), abiContent);
    console.log(`✅ Exported ABI for ${contract}`);
    exportedCount++;
  } else {
    console.warn(`⚠️ Artifact not found for ${contract} at ${artifactPath}`);
  }
});

console.log(`🎉 Exported ${exportedCount} ABIs to SDK and Frontend packages.`);
