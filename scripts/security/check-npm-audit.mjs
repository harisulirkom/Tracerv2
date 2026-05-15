import fs from 'node:fs';

const reportPath = process.argv[2] ?? 'npm-audit.json';
const policyPath = process.argv[3] ?? 'scripts/security/npm-audit-policy.json';

const parseJson = (path) => {
  try {
    const raw = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const report = parseJson(reportPath);
if (!report || typeof report !== 'object') {
  console.log('npm audit report not found or invalid JSON, skip policy check');
  process.exit(0);
}

const policy = parseJson(policyPath) ?? {};
const allowRules = Array.isArray(policy.allow_high_critical) ? policy.allow_high_critical : [];
const allowSet = new Set(
  allowRules
    .map((item) => `${item.package}::${String(item.id ?? '').toUpperCase()}`)
);

const isDateExpired = (isoDate) => {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getTime() < now.getTime();
};

const ruleMap = new Map();
for (const rule of allowRules) {
  ruleMap.set(`${rule.package}::${String(rule.id ?? '').toUpperCase()}`, rule);
}

const vulnerabilities = report.vulnerabilities ?? {};
const findings = [];

for (const [pkg, info] of Object.entries(vulnerabilities)) {
  const via = Array.isArray(info.via) ? info.via : [];
  for (const item of via) {
    if (!item || typeof item !== 'object') continue;
    const severity = String(item.severity ?? info.severity ?? '').toLowerCase();
    if (!['high', 'critical'].includes(severity)) continue;

    const url = String(item.url ?? '');
    const idMatch = url.match(/GHSA-[a-z0-9-]+/i);
    const advisoryId = idMatch ? idMatch[0].toUpperCase() : `SOURCE-${item.source ?? 'UNKNOWN'}`;
    const key = `${pkg}::${advisoryId}`;
    const isAllowed = allowSet.has(key);
    const rule = ruleMap.get(key);
    const expired = isAllowed ? isDateExpired(rule?.expires_on) : false;

    findings.push({
      package: pkg,
      id: advisoryId,
      severity,
      allowed: isAllowed && !expired,
      expired,
      fixAvailable: info.fixAvailable,
    });
  }
}

if (!findings.length) {
  console.log('No high/critical npm advisories detected.');
  process.exit(0);
}

const blocking = findings.filter((f) => !f.allowed);
const allowed = findings.filter((f) => f.allowed);

if (allowed.length) {
  console.log('Temporarily allowed advisories:');
  for (const item of allowed) {
    console.log(`- ${item.package} ${item.id} (${item.severity})`);
  }
}

if (blocking.length) {
  console.error('Blocking advisories found:');
  for (const item of blocking) {
    const fix = item.fixAvailable ? 'fix available' : 'no fix available';
    const exp = item.expired ? ', allowlist expired' : '';
    console.error(`- ${item.package} ${item.id} (${item.severity}, ${fix}${exp})`);
  }
  process.exit(1);
}

console.log('All high/critical advisories are allowlisted by current policy.');
