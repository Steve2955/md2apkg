import fs from 'fs-extra';

// markdown parser and html converter
import mdit from 'markdown-it';
import mdcomment from 'markdown-it-inline-comments';
const md = mdit().use(mdcomment);

// anki deck creation
import AnkiDeckExport from 'anki-apkg-export';
const AnkiDeck = AnkiDeckExport.default;

import Card from './Card.js';

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
	// parse tokens into individual cards
	let cards = cardsFromTokens(tokens);
	// remove unwanted cards
	cards = filterCards(cards, options);
	// some stats
	console.log(`found ${cards.length} cards!`);
	// create new anki-deck
	const deck = deckFromCards(cards, options);
	// write anki-deck to file
	await fs.writeFile(outputPath, await deck.save(), 'binary');
}

export function tokensFromMarkdown(markdown) {
	// parse markdown to tokens
	return md.parse(markdown, {});
}

export function cardsFromTokens(tokens) {
	// parse tokens into individual cards
	let cards = [];
	let card = new Card();
	let isFront = true;
	tokens.forEach((token, i) => {
		// new heading starts or end of token-array reached
		if ((token.type === 'heading_open' && !isFront) || i == tokens.length - 1) {
			cards.push(card);
			// reset variables
			isFront = true;
			card = new Card();
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
	cards = cards.filter(card => !card.back.some(token => token.content.trim().includes('<!-- md2anki ignore-card -->'.trim())));
	// remove cards from unwanted heading levels
	return cards.filter(card => !(options.ignoreLevels || []).includes(card.headingLevel));
}

export function deckFromCards(cards, options) {
	// create new deck
	const apkg = new AnkiDeck(options.deckName, { css: '' });
	console.log(`deck initialized!`);
	// add cards to deck (convert tokens to html)
	cards.forEach((card, i) => {
		apkg.addCard(md.renderer.render(card.front, md.options, {}), md.renderer.render(card.back, md.options, {}));
	});
	console.log(`added ${cards.length} cards to the deck!`);
	return apkg;
}