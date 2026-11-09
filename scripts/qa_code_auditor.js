import fs from 'fs';
import path from 'path';

const results = {
  emptyHandlers: [],
  comingSoon: [],
  todos: [],
  deadNavigations: [],
  filesScanned: 0
};

// Registered screens in user-panel/src/navigation/AppNavigator.js and TabNavigator.js
const KNOWN_USER_SCREENS = new Set([
  'Login', 'OtpScreen', 'HealthSetup', 'Home', 'History', 'Profile', 'Appointments',
  'BookAppointment', 'AppointmentsList', 'Support', 'HealthTimeline',
  'WearableSync', 'Chatbot', 'FoodDeliveryHome', 'RestaurantMenu',
  'CartSimulation', 'FamilyPlatingGuide', 'AbhaRegistration', 'VernacularVoice',
  'Main', 'Eats', 'MainTabs', 'Scan', 'FoodScanner', 'Analysis'
]);

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.expo', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      results.filesScanned++;
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();

        // 1. Empty handlers
        if (/onPress\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(trimmed) ||
            /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(trimmed)) {
          results.emptyHandlers.push({ file: full, line: lineNum, text: trimmed });
        }

        // 2. Coming soon / alert placeholders
        if (/coming\s*soon/i.test(trimmed) || /under\s*development/i.test(trimmed)) {
          results.comingSoon.push({ file: full, line: lineNum, text: trimmed });
        }

        // 3. TODO / FIXME markers
        if (/\bTODO\b|\bFIXME\b/.test(trimmed) && !trimmed.includes('TODO: implement later')) {
          results.todos.push({ file: full, line: lineNum, text: trimmed });
        }

        // 4. Broken navigations in user-panel
        if (full.includes('user-panel')) {
          const navMatch = trimmed.match(/navigation\.navigate\(['"]([^'"]+)['"]/);
          if (navMatch) {
            const targetScreen = navMatch[1];
            if (!KNOWN_USER_SCREENS.has(targetScreen)) {
              results.deadNavigations.push({ file: full, line: lineNum, screen: targetScreen, text: trimmed });
            }
          }
        }
      });
    }
  }
}

console.log('Starting full codebase audit...');
['user-panel/src', 'admin-panel/src', 'staff-panel/src', 'server/controllers', 'server/routes', 'server/services', 'server/models'].forEach(scanDir);

console.log('\n======================================================');
console.log('             CODEBASE AUDIT RESULTS');
console.log('======================================================');
console.log(`Total Source Files Scanned: ${results.filesScanned}`);
console.log(`Empty Handlers Found:       ${results.emptyHandlers.length}`);
console.log(`Placeholder/Coming Soon:    ${results.comingSoon.length}`);
console.log(`TODO / FIXME Comments:      ${results.todos.length}`);
console.log(`Dead Navigation Targets:    ${results.deadNavigations.length}`);
console.log('======================================================\n');

if (results.emptyHandlers.length > 0) {
  console.log('--- EMPTY ONPRESS / ONCLICK HANDLERS ---');
  results.emptyHandlers.forEach(h => console.log(`  [EMPTY] ${path.relative('.', h.file)}:${h.line} -> ${h.text}`));
}

if (results.comingSoon.length > 0) {
  console.log('\n--- COMING SOON / PLACEHOLDER ALERTS ---');
  results.comingSoon.forEach(c => console.log(`  [PLACEHOLDER] ${path.relative('.', c.file)}:${c.line} -> ${c.text}`));
}

if (results.todos.length > 0) {
  console.log('\n--- TODO / FIXME COMMENTS ---');
  results.todos.forEach(t => console.log(`  [TODO] ${path.relative('.', t.file)}:${t.line} -> ${t.text}`));
}

if (results.deadNavigations.length > 0) {
  console.log('\n--- DEAD NAVIGATION TARGETS ---');
  results.deadNavigations.forEach(d => console.log(`  [DEAD NAV] ${path.relative('.', d.file)}:${d.line} -> Screen "${d.screen}" not in AppNavigator`));
}
