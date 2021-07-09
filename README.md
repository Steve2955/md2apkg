# md2anki

A simple $\LaTeX$ markdown to anki-deck converter without any weird custom syntax $a^2+b^2=c^2$

$$\Longleftarrow\Longrightarrow$$

$\LaTeX$

> **Disclaimer:** This project is WIP $\rightarrow$ It may or may not ever be finished.

\\(\rightarrow\LaTeX\sqrt{2}\\)


$$\LaTeX$$
## How are cards created?

Cards are created for each individual heading. The heading itself is used as the front, whereas the back contains everything following the heading.

## Custom Markdown Extensions

You may want to exlude certain parts of your markdown document. To not create a card for a particular heading simply include the following html-comment in its body.

```html
<!-- md2anki ignore-card -->
```
