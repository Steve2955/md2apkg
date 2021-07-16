import { expect } from 'chai';
import { tokensFromMarkdown, cardsFromTokens, filterCards, imagesFromTokens } from '../src/index.js';

const markdownExample = `
# I'm a H1
and I'm not empty
## I'm a H2
and I'm not empty
### I'm a H3
and I'm not empty
#### I'm a H4
and I'm not empty
##### I'm a H5
nd I'm not empty
###### I'm a H6
and I'm not empty

# I'm an empty H1
## I'm an empty H2
### I'm an empty H3
#### I'm an empty H4
##### I'm an empty H5
###### I'm an empty H6

# I'm a H1
I should be ignored
<!-- md2apkg ignore-card -->
## I'm a H2
I should be ignored
<!-- md2apkg ignore-card -->
### I'm a H3
I should be ignored
<!-- md2apkg ignore-card -->
#### I'm a H4
I should be ignored
<!-- md2apkg ignore-card -->
##### I'm a H5
I should be ignored
<!-- md2apkg ignore-card -->
###### I'm a H6
I should be ignored
<!-- md2apkg ignore-card -->

# I'm a H1
<!-- md2apkg tags tagA tagB tagC tagD -->

![I am an image](img/blob.png)`;

describe('cards filtering', function () {
	const tokens = tokensFromMarkdown(markdownExample);
	const images = imagesFromTokens(tokens, 'test/test.md')
	const cards = cardsFromTokens(tokens, {});

	it('should parse tokens to individual cards', function () {
		expect(cards.length).to.equal(19);
	});
	it('should ignore unwanted and empty cards by default', function () {
		let filteredCards = filterCards(cards, {});
		expect(filteredCards.length).to.equal(7);
		filteredCards.forEach(card => {
			expect(card.front).to.not.be.undefined;
			expect(card.back).to.not.be.undefined;
			expect(card.back.length).to.be.greaterThan(0);
		});
	});
	it('should ignore unwanted and allow empty cards if requested', function () {
		let filteredCards = filterCards(cards, {includeEmpty: true});
		expect(filteredCards.length).to.equal(13);
		filteredCards.forEach(card => expect(card.front).to.not.be.undefined);
		filteredCards.forEach(card => expect(card.back).to.not.be.undefined);
	});
	it('should ignore certain heading levels if requested (1,2,3)', function () {
		let filteredCards = filterCards(cards, {ignoreLevels: [1, 2, 3]});
		expect(filteredCards.length).to.equal(3);
		filteredCards.forEach(card => expect(card.front).to.not.be.undefined);
		filteredCards.forEach(card => expect(card.back).to.not.be.undefined);
		filteredCards.forEach(card => expect(card.headingLevel).to.be.greaterThan(3));
	});
	it('should ignore certain heading levels if requested (1,3,5)', function () {
		let filteredCards = filterCards(cards, {ignoreLevels: [1, 3, 5]});
		expect(filteredCards.length).to.equal(3);
		filteredCards.forEach(card => expect(card.front).to.not.be.undefined);
		filteredCards.forEach(card => expect(card.back).to.not.be.undefined);
		filteredCards.forEach(card => expect(card.headingLevel % 2).to.equal(0));
	});
	it('should find one image in tokens', function() {
		expect(images.length).to.equal(1);
	});
	// this seems a bit weird but it's probably due to the fact that these paths are always relative to the root dir
	it('should parse image paths correctly', function() {
		expect(images[0].filePath).to.equal('test/img/blob.png');
	});
	it('should filter image paths correctly', function() {
		expect(images[0].filteredPath).to.equal('test#img#blob.png');
	});
	it('should find tags', function() {
		let tags = new Set();
		cards.forEach(card => {
			card.tags.forEach(tag => { tags.add(tag); });
		});

		expect(tags.has('tagA')).to.equal(true);
		expect(tags.has('tagB')).to.equal(true);
		expect(tags.has('tagC')).to.equal(true);
		expect(tags.has('tagD')).to.equal(true);
	});
});