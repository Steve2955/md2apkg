export default class Card {
	constructor(front=[], back=[]){
		this.front = front;
		this.back = back;
	}

	setParent(parent){
		this.parent = parent;
	}

	get headingLevel(){
		// the first token of the front is always the heading
		return parseInt(this.front[0].tag[1]);
	}

	get headingStr(){
		// the second token of the front contains the complete heading
		return this.front[1].content;
	}

	renderToHTML(md){
		// unify heading levels for consistent look in anki
		for(let i = 0; i < this.front.length; i++)
			if(this.front[i].type == 'heading_open' || this.front[i].type == 'heading_close') this.front[i].tag = 'h1';
		// render front and back to html
		let front = md.renderer.render(this.front, md.options, {});
		const back = md.renderer.render(this.back, md.options, {});
		// display parent topic
		if (this.parent) front = `<div id="front"><small>${md.render(this.parent.headingStr)}</small>${front}</div>`;
		return { front, back };
	}
}