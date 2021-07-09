export default function texmath(md, options) {
	const delimiters = 'dollars';

	for (const rule of texmath.rules[delimiters].inline) {
		md.inline.ruler.before('escape', rule.name, texmath.inline(rule)); // ! important
		md.renderer.rules[rule.name] = (tokens, idx) => rule.tmpl.replace(/\$1/, texmath.render(tokens[idx].content, !!rule.displayMode));
	}

	for (const rule of texmath.rules[delimiters].block) {
		md.block.ruler.before('fence', rule.name, texmath.block(rule)); // ! important for ```math delimiters
		md.renderer.rules[rule.name] = (tokens, idx) => rule.tmpl.replace(/\$2/, tokens[idx].info) // equation number .. ?
			.replace(/\$1/, texmath.render(tokens[idx].content, true));
	}
}

texmath.inline = (rule) => function (state, silent) {
	const pos = state.pos;
	const str = state.src;
	const pre = str.startsWith(rule.tag, rule.rex.lastIndex = pos) && (!rule.pre || rule.pre(str, pos)); // valid pre-condition ...
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

texmath.block = (rule) => function block(state, begLine, endLine, silent) {
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

texmath.render = function (tex, displayMode) {
	res = displayMode ? `\\[${tex}\\]`:`\\(${tex}\\)`;
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