#!/usr/bin/env node
/**
 * Organize imports in .ts/.tsx/.js/.jsx files into
 * External dependencies and Internal dependencies blocks.
 *
 * Run with: yarn organizeImports [--check]
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const ROOT = path.resolve(__dirname, '../..');

function organizeImportsInFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	// Find the import section boundary
	let importSectionEnd = 0;
	let inImport = false;
	let braceDepth = 0;

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();

		if (trimmed.startsWith('import ')) {
			inImport = true;
			importSectionEnd = i + 1;
			braceDepth += (trimmed.match(/\{/g) || []).length;
			braceDepth -= (trimmed.match(/\}/g) || []).length;
		} else if (inImport && braceDepth > 0) {
			importSectionEnd = i + 1;
			braceDepth += (trimmed.match(/\{/g) || []).length;
			braceDepth -= (trimmed.match(/\}/g) || []).length;
		} else if (inImport && braceDepth === 0) {
			if (
				trimmed === '' ||
				trimmed.startsWith('//') ||
				trimmed.startsWith('/*') ||
				trimmed.startsWith('*')
			) {
				importSectionEnd = i + 1;
			} else {
				break;
			}
		} else if (!inImport) {
			if (
				trimmed === '' ||
				trimmed.startsWith('//') ||
				trimmed.startsWith('/*') ||
				trimmed.startsWith('*')
			) {
				importSectionEnd = i + 1;
			} else if (trimmed.startsWith('import ')) {
				// handled above
			} else {
				break;
			}
		}
	}

	if (importSectionEnd === 0) return false;

	const importSection = lines.slice(0, importSectionEnd);
	const afterSection = lines.slice(importSectionEnd);

	// Parse individual import statements from the import section.
	// A statement starts with "import " and includes all continuation lines
	// until braceDepth returns to 0 (end of multi-line import).
	// Blank lines and comments between import groups are kept as separators
	// and attached to the following import statement so they aren't lost.
	const statements = [];
	let currentLines = [];
	let depth = 0;
	let inStmt = false;

	for (const line of importSection) {
		const trimmed = line.trim();

		if (trimmed.startsWith('import ')) {
			// Push any previous statement before starting a new one.
			// This handles the case where a blank line or comment ended the
			// previous statement's inStmt flag (set to false).
			if (
				currentLines.length > 0 &&
				currentLines.some((l) => l.trim().startsWith('import '))
			) {
				statements.push(currentLines.join('\n'));
			}
			currentLines = [];
			inStmt = true;
			currentLines.push(line);
			depth += (trimmed.match(/\{/g) || []).length;
			depth -= (trimmed.match(/\}/g) || []).length;
		} else if (inStmt) {
			if (depth > 0) {
				// Continuation of multi-line import
				currentLines.push(line);
				depth += (trimmed.match(/\{/g) || []).length;
				depth -= (trimmed.match(/\}/g) || []).length;
			} else {
				// Blank line, comment, or other text after an import statement.
				// Keep it attached to this statement group so comments between
				// import groups are preserved (they will be classified as
				// preLines and placed before the block comments).
				currentLines.push(line);
				inStmt = false;
			}
		} else {
			// Before first import, or between import groups — collect
			currentLines.push(line);
		}
	}
	// Push the last statement if it contains import lines (regardless of inStmt)
	if (currentLines.length > 0 && currentLines.some((l) => l.trim().startsWith('import '))) {
		statements.push(currentLines.join('\n'));
	}

	// Check if already organized
	if (
		importSection.some(
			(l) => l.includes('External dependencies') || l.includes('Internal dependencies')
		)
	) {
		return false;
	}

	// Classify: pre-import, external, internal
	const preLines = [];
	const external = [];
	const internal = [];

	for (const stmt of statements) {
		if (stmt.trim().startsWith('import ')) {
			const fromMatch = stmt.match(/from\s+['"]([^'"]+)['"]/);
			const sideMatch = stmt.match(/import\s+['"]([^'"]+)['"]/);
			const modulePath = (fromMatch && fromMatch[1]) || (sideMatch && sideMatch[1]) || '';
			if (modulePath && (modulePath.startsWith('.') || modulePath.startsWith('/'))) {
				internal.push(stmt);
			} else {
				external.push(stmt);
			}
		} else {
			preLines.push(stmt);
		}
	}

	// Clean trailing blank lines from preLines
	while (preLines.length > 0 && preLines[preLines.length - 1].trim() === '') {
		preLines.pop();
	}

	// Build the new import block
	const newLines = [];

	if (preLines.length > 0) {
		newLines.push(...preLines);
		newLines.push('');
	}

	if (external.length > 0) {
		newLines.push('/**');
		newLines.push(' * External dependencies');
		newLines.push(' */');
		for (const stmt of external) {
			newLines.push(stmt);
		}
	}

	if (internal.length > 0) {
		if (external.length > 0) {
			newLines.push('');
		}
		newLines.push('/**');
		newLines.push(' * Internal dependencies');
		newLines.push(' */');
		for (const stmt of internal) {
			newLines.push(stmt);
		}
	}

	// Clean leading blank lines from afterSection
	let afterStart = 0;
	while (afterStart < afterSection.length && afterSection[afterStart].trim() === '') {
		afterStart++;
	}

	const newContent = [
		...newLines,
		'',
		...afterSection.slice(afterStart),
	].join('\n');

	if (newContent !== content) {
		fs.writeFileSync(filePath, newContent, 'utf-8');
		return true;
	}
	return false;
}

const checkOnly = process.argv.includes('--check');

function main() {
	const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
		cwd: ROOT,
		absolute: true,
		ignore: ['**/node_modules/**'],
	});

	const filesWithImports = files.filter((f) => {
		try {
			return /^import\s/m.test(fs.readFileSync(f, 'utf-8'));
		} catch {
			return false;
		}
	});

	console.log(`Found ${filesWithImports.length} files with imports`);

	let changed = 0;
	const errors = [];

	for (const file of filesWithImports) {
		try {
			const wasChanged = organizeImportsInFile(file);
			if (wasChanged) {
				console.log(`  Fixed: ${path.relative(ROOT, file)}`);
				changed++;
			}
		} catch (e) {
			errors.push(`${path.relative(ROOT, file)}: ${e.message}`);
		}
	}

	if (errors.length > 0) {
		console.log('\nErrors:');
		for (const err of errors) {
			console.log(`  ${err}`);
		}
	}

	console.log(`\nChanged: ${changed} files`);

	if (checkOnly && changed > 0) {
		process.exit(1);
	}
}

main();
