# md2anki

A simple markdown to anki-deck converter without any weird custom syntax

## How are cards created?

Cards are created for each individual heading. The heading itself is used as the front, whereas the back contains everything following the heading.

## Custom Markdown Extensions

You may want to exlude certain parts of your markdown document. To not create a card for a particular heading simply include the following html-comment in its body.

```html
<!-- md2anki ignore-card -->
```