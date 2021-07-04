import md2anki from './src/index.js';
import { program } from 'commander/esm.mjs';
import { createRequire } from 'module';

const { version } = createRequire(import.meta.url)('./package.json'); // some magic from StackOverflow https://stackoverflow.com/a/56350495/6792590
program.version(version);

program
	.option('-i, --input <path>', 'markdown file path', './README.md')
	.option('-o, --output <path>', 'apkg file path', './output.apkg')
	.option('-n, --deck-name <name>', 'name of the deck', 'md2anki')
	.option('--ignore-levels <levels>', 'comma-separated list of heading levels to ignore', a => a.split(',').map(s => Number(s)))
	.option('--include-empty', 'include empty cards in the deck')
	.parse(process.argv);

const options = program.opts();
const inputPath = options.input || program.args[0];
const outputPath = options.output;

(async () => {
	await md2anki(inputPath, outputPath, options);
})();
