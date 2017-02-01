# SVG Text Editor

A JavaScript library for creating and editing multiline text inside SVG images.

## Installation
###


```
    //todo
```

## Using

### Quick example:
```js
import Editor from 'SvgText';

let editor = new Editor(element, 'Edit me!', {
    x: 15,
    y: 15,
    width: 100,
    height: 100,
    isCenterAligned: true,
    isVerticalCenterAligned: false
});

$(element).click(() => editor.startEdit().then(res => console.log(res));
```