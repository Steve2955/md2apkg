import md2anki from './src/index.js';
import { program, Option } from 'commander/esm.mjs';
import { createRequire } from 'module';

const { version } = createRequire(import.meta.url)('./package.json'); // some magic from StackOverflow https://stackoverflow.com/a/56350495/6792590
program.version(version);

program
	.option('-i, --input <path>', 'markdown file path')
	.addOption(new Option('-o, --output <path>', 'apkg file path').default('./output.apkg'))
	.option('-n, --deck-name <name>', 'name of the deck (otherwise defaults to first heading)')
	.option('--ignore-levels <levels>', 'list of heading levels to ignore', a => a.split(',').map(b => Number(b)).filter(c => c && c >= 0 && c <= 6))
	.option('--include-empty', 'include empty cards in the deck')
	.parse(process.argv);

const options = program.opts();
const inputPath = options.input || program.args[0];
const outputPath = options.output;

(async () => {
	await md2anki(inputPath, outputPath, options);
})();
