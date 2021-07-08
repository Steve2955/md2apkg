export default class Image {
	// filePath -> relative path to the file
	constructor(filePath) {
		this.filePath = filePath;
		this.filteredPath = filePath.replace(/\//g, '#');
	}
}