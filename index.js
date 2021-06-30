const md = require('markdown-it')();
const fs = require('fs-extra');
const AnkiDeck = require('anki-apkg-export').default;

(async () => {
	// read markdown string
	const markdown = await fs.readFile('./test.md', 'utf8');
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
	cards = cards.filter(card => card.back.length);
	// create new anki-deck
	const apkg = new AnkiDeck('test.md');
	// add cards to deck (convert tokens to html)
	cards.forEach(card => apkg.addCard(md.renderer.render(card.front, md.options, {}), md.renderer.render(card.back, md.options, {})));
	// write anki-deck to file
	await fs.writeFile('./output.apkg', await apkg.save(), 'binary');
})();
