// Auto-bumps package.json's patch version. Run by .git/hooks/pre-commit on every
// commit unless the version field was already changed manually in the same commit
// (that's the signal for a deliberate minor/major bump — see hook script).
const fs = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)
pkg.version = `${major}.${minor}.${patch + 1}`
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(`[version] auto-bumped patch -> ${pkg.version}`)
