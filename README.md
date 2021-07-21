
<p align="center">
  <img width="100px" src="https://user-images.githubusercontent.com/21085384/126459451-0bbdb359-9ef3-48e9-ab3b-5294bfac7fd3.png">
</p>

<h3 align="center">md2apkg</h3>

<p align="center">A simple markdown to anki-deck converter without any weird custom syntax.</p>

<p align="center">
  <a href="https://github.com/Steve2955/md2apkg/actions/workflows/npm-test.yml"><img alt="npm test" src="https://github.com/Steve2955/md2apkg/actions/workflows/npm-test.yml/badge.svg"></a>
</p>

## Install

```text
npm install -g md2apkg
```

## Usage

Basic Usage

```text
md2apkg -o deck.apkg README.md
```

Advanced options

```text
  -i, --input <path>            markdown file path
  -o, --output <path>           apkg file path (default: "./output.apkg")
  -n, --deck-name <name>        name of the deck (otherwise defaults to first heading)
  --ignore-levels <levels>      list of heading levels to ignore
  --include-empty               include empty cards in the deck
  --ignore-latex-dollar-syntax  $\LaTeX$-Syntax will not be converted to \(\LaTeX\)-Syntax supported by anki
  --code-style                  highlight.js style for code syntax highlighting (defaults to "github")
```

## How are cards created?

Cards are created for each individual heading. The heading itself is used as the front, whereas the back contains everything following the heading.

## Custom Markdown Extensions

You may want to exlude certain parts of your markdown document. To not create a card for a particular heading simply include the following html-comment in its body.

```html
<!-- md2apkg ignore-card -->
```

In some cases you might want to include more than the heading on the front of the card.

```md
## Example Header

This paragraph should be on the front in addition to the heading.

<!-- md2apkg split -->

The back starts here.
```

Using `%` instead of `<!-- md2apkg split -->` works as well.

Tags for your cards are supported as well, just use the following html-comment.

```html
<!-- md2apkg tags tagA tagB tagC tagD -->
```
