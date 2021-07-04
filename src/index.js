import fs from 'fs-extra';
import path from 'path';

// markdown parser and html converter
import mdit from 'markdown-it';
import mdcomment from 'markdown-it-inline-comments';
const md = mdit().use(mdcomment);

// anki deck creation
import AnkiDeckExport from 'anki-apkg-export';
const AnkiDeck = AnkiDeckExport.default;

export default async function (inputPath, outputPath, options) {
	// check if input file exists
	if (!(await fs.pathExists(inputPath))) {
		console.error(`input file "${inputPath}" not found!`);
		return;
	}
	// read markdown as text
	const markdown = await fs.readFile(inputPath, 'utf8');
	// tokenize markdown
	const tokens = tokensFromMarkdown(markdown);
	// parse tokens for images
	const images = imagesFromTokens(tokens, inputPath);
	// parse tokens into individual cards
	let cards = cardsFromTokens(tokens, inputPath);
	// remove unwanted cards
	cards = filterCards(cards, options);
	// some stats
	console.log(`found ${cards.length} cards!`);
	// create new anki-deck
	const deck = deckFromCards(cards, images, options);
	// write anki-deck to file
	deck.save().then(zip => {
		fs.writeFileSync(outputPath, zip, 'binary');
		console.log(`Deck has been generated: ${outputPath}`);
	})
	.catch(err => console.log(err.stack || err));
}

export function tokensFromMarkdown(markdown) {
	// parse markdown to tokens
	return md.parse(markdown, {});
}

export function cardsFromTokens(tokens) {
	// parse tokens into individual cards
	let cards = [];
	let card = { front: [], back: [] };
	let isFront = true;
	tokens.forEach((token, i) => {
		// new heading starts or end of token-array reached
		if ((token.type === 'heading_open' && !isFront) || i == tokens.length - 1) {
			cards.push(card);
			// reset variables
			isFront = true;
			card = { front: [], back: [] };
		}
		// push token to front/back
		card[isFront ? 'front' : 'back'].push(token);
		// check if the end of the front has been reached
		if (token.type === 'heading_close' && isFront) isFront = false;
	});
	return cards;
}

export function filterCards(cards, options) {
	// remove empty cards
	if (!options.includeEmpty) cards = cards.filter(card => card.back.length);
	// remove ignored cards
	return cards.filter(card => !card.back.some(token => token.content.trim().includes('<!-- md2anki ignore-card -->'.trim())));
}

export function deckFromCards(cards, images, options) {
	// create new deck
	const apkg = new AnkiDeck(options.deckName, { css: '' });
	console.log(`deck initialized!`);
	// add media files to deck
	images.forEach(image => {
		apkg.addMedia(image, fs.readFileSync(image));
	});
	// add cards to deck (convert tokens to html)
	cards.forEach(card => {
		apkg.addCard(md.renderer.render(card.front, md.options, {}), md.renderer.render(card.back, md.options, {}));
	});
	console.log(`added ${cards.length} cards to the deck!`);
	console.log(`added ${images.length} images to the deck!`);
	return apkg;
}

export function imagesFromTokens(tokens, inputPath) {
	let images = [];
	tokens.forEach((token) => {
		if (token.type === 'image') {
			// find images in tokens and save them to a list
			let filePath = path.join(path.dirname(inputPath), token.attrGet('src'));
			filePath = filePath.split(path.sep).join(path.posix.sep);
			images.push(filePath);
		}
		if (token.type === 'inline') {

			// recursively find images in children
			images.push(imagesFromTokens(token.children, inputPath));
		}
	});

	// flatten the list to a depth of 1
	images = images.flat();

	return images.filter(image => image.length > 0);
}