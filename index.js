const { program } = require('commander');

program.version(require('./package.json').version);

program
	.option('-i, --input <path>', 'markdown file path')
	.option('-o, --output <path>', 'apkg file path', './output.apkg')
	.option('-n, --deck-name <name>', 'name of the deck')
	.option('-e, --include-empty', 'include empty cards in the deck')
	.parse(process.argv);

const md = require('markdown-it')();
md.use(require('markdown-it-inline-comments'));

const fs = require('fs-extra');
const AnkiDeck = require('anki-apkg-export').default;

const options = program.opts();
const inputPath = options.input || program.args[0];
const outputPath = options.output;

(async () => {
	// read markdown as text
	const markdown = await fs.readFile(inputPath, 'utf8');
	// tokenize markdown
	const tokens = md.parse(markdown, {});
	// parse tokens into individual cards
	let cards = [];
	let card = {front: [], back: []};
	let isFront = true;
	tokens.forEach((token, i) => {
		// new heading starts or end of token-array reached
		if((token.type === 'heading_open' && !isFront ) || i == tokens.length-1){
			cards.push(card);
			// reset variables
			isFront = true;
			card = {front: [], back: []};
		}
		// push token to front/back
		card[isFront?'front':'back'].push(token);
		// check if the end of the front has been reached
		if(token.type === 'heading_close' && isFront) isFront = false;
	});
	// remove empty cards
	if(!options.includeEmpty) cards = cards.filter(card => card.back.length);
	// remove ignored cards
	cards = cards.filter(card => !card.back.some(token => token.content.trim().includes('<!-- md2anki ignore-card -->'.trim())));
	// some stats
	console.log(`found ${cards.length} cards!`);
	// create new anki-deck
	const apkg = new AnkiDeck(options.deckName || options.input, {css: ''});
	// add cards to deck (convert tokens to html)
	console.log(`converting cards to anki deck!`);
	cards.forEach(card => apkg.addCard(md.renderer.render(card.front, md.options, {}), md.renderer.render(card.back, md.options, {})));
	// write anki-deck to file
	await fs.writeFile(outputPath, await apkg.save(), 'binary');
})();
