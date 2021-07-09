import fs from 'fs-extra';
import path from 'path';

function texmath(md, options) {
	const delimiters = options && options.delimiters || 'dollars';

	for (const rule of texmath.rules[delimiters].inline) {
		md.inline.ruler.before('escape', rule.name, texmath.inline(rule));  // ! important
		md.renderer.rules[rule.name] = (tokens, idx) => rule.tmpl.replace(/\$1/, texmath.render(tokens[idx].content, !!rule.displayMode));
	}

	for (const rule of texmath.rules[delimiters].block) {
		md.block.ruler.before('fence', rule.name, texmath.block(rule));  // ! important for ```math delimiters
		md.renderer.rules[rule.name] = (tokens, idx) => rule.tmpl.replace(/\$2/, tokens[idx].info)  // equation number .. ?
			.replace(/\$1/, texmath.render(tokens[idx].content, true));
	}
}

// texmath.inline = (rule) => dollar;  // just for debugging/testing ..

texmath.inline = (rule) =>
	function (state, silent) {
		const pos = state.pos;
		const str = state.src;
		const pre = str.startsWith(rule.tag, rule.rex.lastIndex = pos) && (!rule.pre || rule.pre(str, pos));  // valid pre-condition ...
		const match = pre && rule.rex.exec(str);
		const res = !!match && pos < rule.rex.lastIndex && (!rule.post || rule.post(str, rule.rex.lastIndex - 1));

		if (res) {
			if (!silent) {
				const token = state.push(rule.name, 'math', 0);
				token.content = match[1];
				token.markup = rule.tag;
			}
			state.pos = rule.rex.lastIndex;
		}
		return res;
	}

texmath.block = (rule) =>
	function block(state, begLine, endLine, silent) {
		const pos = state.bMarks[begLine] + state.tShift[begLine];
		const str = state.src;
		const pre = str.startsWith(rule.tag, rule.rex.lastIndex = pos) && (!rule.pre || rule.pre(str, pos));  // valid pre-condition ....
		const match = pre && rule.rex.exec(str);
		const res = !!match
			&& pos < rule.rex.lastIndex
			&& (!rule.post || rule.post(str, rule.rex.lastIndex - 1));

		if (res && !silent) {    // match and valid post-condition ...
			const endpos = rule.rex.lastIndex - 1;
			let curline;

			for (curline = begLine; curline < endLine; curline++)
				if (endpos >= state.bMarks[curline] + state.tShift[curline] && endpos <= state.eMarks[curline]) // line for end of block math found ...
					break;

			const lineMax = state.lineMax;
			const parentType = state.parentType;
			state.lineMax = curline;
			state.parentType = 'math';

			if (parentType === 'blockquote') // remove all leading '>' inside multiline formula
				match[1] = match[1].replace(/(\n*?^(?:\s*>)+)/gm, '');
			// begin token
			let token = state.push(rule.name, 'math', 1);  // 'math_block'
			token.block = true;
			token.markup = rule.tag;
			token.content = match[1];
			token.info = match[match.length - 1];    // eq.no
			token.map = [begLine, curline];
			// end token
			token = state.push(rule.name + '_end', 'math', -1);
			token.block = true;
			token.markup = rule.tag;

			state.parentType = parentType;
			state.lineMax = lineMax;
			state.line = curline + 1;
		}
		return res;
	}

texmath.render = function (tex, displayMode, options) {
	return displayMode ? `\\[${tex}\\]`:`\\[${tex}\\]`;//texmath.katex.renderToString(tex, options);
}

// used for enable/disable math rendering by `markdown-it`
texmath.inlineRuleNames = ['math_inline', 'math_inline_double'];
texmath.blockRuleNames = ['math_block', 'math_block_eqno'];

texmath.$_pre = (str, beg) => {
	const prv = beg > 0 ? str[beg - 1].charCodeAt(0) : false;
	return !prv || prv !== 0x5c                // no backslash,
		&& (prv < 0x30 || prv > 0x39); // no decimal digit .. before opening '$'
}

texmath.$_post = (str, end) => {
	const nxt = str[end + 1] && str[end + 1].charCodeAt(0);
	return !nxt || nxt < 0x30 || nxt > 0x39;   // no decimal digit .. after closing '$'
}

texmath.rules = {
	dollars: {
		inline: [
			{
				name: 'math_inline_double',
				rex: /\${2}((?:\S)|(?:\S(?!.*\]\(http).*?\S))\${2}/gy,  // fixed so that the expression [$something](https://something.com/$example) is skipped.
				tmpl: '<section><eqn>$1</eqn></section>',
				tag: '$$',
				displayMode: true,
				pre: texmath.$_pre,
				post: texmath.$_post
			},
			{
				name: 'math_inline',
				rex: /\$((?:\S)|(?:\S(?!.*\]\(http.*\$.*\)).*?\S))\$/gy, // fixed so that the expression [$something](https://something.com/$example) is skipped. (?:\S(?!.*\]\(http.*\$.*\)) means somthing like "](https://hoge.com/$/hoge)"
				tmpl: '<eq>$1</eq>',
				tag: '$',
				pre: texmath.$_pre,
				post: texmath.$_post
			}
		],
		block: [
			{
				name: 'math_block_eqno',
				rex: /\${2}([^$]+?)\${2}\s*?\(([^)\s]+?)\)/gmy,
				tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
				tag: '$$'
			},
			{
				name: 'math_block',
				rex: /\${2}([^$]+?)\${2}/gmy,
				tmpl: '<section><eqn>$1</eqn></section>',
				tag: '$$'
			}
		]
	}
};


// markdown parser and html converter
import mdit from 'markdown-it';
import mdcomment from 'markdown-it-inline-comments';
const md = mdit().use(mdcomment).use(texmath);

// anki deck creation
import AnkiDeckExport from 'anki-apkg-export';
const AnkiDeck = AnkiDeckExport.default;

import Card from './Card.js';
import Image from './Image.js';

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
	let card = new Card();
	let isFront = true;
	tokens.forEach((token, i) => {
		// new heading starts or end of token-array reached
		if ((token.type === 'heading_open' && !isFront) || i == tokens.length - 1) {
			// find the 'parent' card
			const parent = [...cards].reverse().find(c => c.headingLevel < card.headingLevel);
			if(parent) card.setParent(parent);
			// add finished card to array
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

export function deckFromCards(cards, images, options) {
	// create new deck
	const apkg = new AnkiDeck(options.deckName, { css: '#front * {margin:0; padding:0;}' }); // ToDo: move CSS to different file
	console.log(`deck initialized!`);
	// add media files to deck
	images.forEach(image => {
		apkg.addMedia(image.filteredPath, fs.readFileSync(image.filePath));
	});
	// add cards to deck (convert tokens to html)
	cards.forEach((card, i) => {
		const { front, back } = card.renderToHTML(md);
		apkg.addCard(front, back);
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
			let attrPath = token.attrGet('src');
			// skip external images
			if (attrPath.includes('://')) return;
			// make the image path relative
			let filePath = path.join(path.dirname(inputPath), attrPath);
			// replace \ with / (in case we're on a windows system)
			filePath = filePath.split(path.sep).join(path.posix.sep);
			let image = new Image(filePath);
			// fix the image
			token.attrSet('src', image.filteredPath)
			images.push(image);
		}
		if (token.type === 'inline') {

			// recursively find images in children
			images.push(imagesFromTokens(token.children, inputPath));
		}
	});

	// flatten the list to a depth of 1
	images = images.flat();
	// this process produces a lot of empty entries, remove them
	images = images.filter(image => image.filePath.length > 0);

	// only return unique images
	return [...new Set(images)];
}