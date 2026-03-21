import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('📦 Building Netlify Functions...');

// Ensure netlify/functions directory exists
const functionsDir = path.join(projectRoot, 'netlify', 'functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
  console.log('✅ Created netlify/functions directory');
}

// Copy package.json dependencies info for functions
const mainPackageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
);

const functionsPackageJson = {
  type: "module",
  dependencies: {
    "@fal-ai/client": mainPackageJson.dependencies["@fal-ai/client"],
    "axios": mainPackageJson.dependencies["axios"],
    "pg": mainPackageJson.dependencies["pg"]
  }
};

fs.writeFileSync(
  path.join(functionsDir, 'package.json'),
  JSON.stringify(functionsPackageJson, null, 2)
);

console.log('✅ Created functions/package.json');
console.log('📦 Netlify Functions build completed!');

// List all function files
const functionFiles = fs.readdirSync(functionsDir)
  .filter(file => file.endsWith('.js') && file !== 'package.json')
  .map(file => `  - ${file.replace('.js', '')}`);

if (functionFiles.length > 0) {
  console.log('\n📋 Available Functions:');
  functionFiles.forEach(func => console.log(func));
} else {
  console.log('⚠️  No function files found');
}