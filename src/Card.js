export default class Card {
	constructor(front=[], back=[]){
		this.front = front;
		this.back = back;
	}
	get headingLevel(){
		// the first element of the front is always the heading
		return parseInt(this.front[0].tag[1]);
	}
}