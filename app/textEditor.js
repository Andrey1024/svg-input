const svgNS = 'http://www.w3.org/2000/svg';
let inputElement;
let nowEdit;

function setAttributes(obj) {
    for (let prop in obj) {
        this.setAttribute(prop, obj[prop]);
    }
}

export default class TextEditor {
    constructor(parent, string, options) {
        this.__initialize(parent, string, options);
        this.__render();
    }

    update(parent, string, options) {
        this.__initialize(parent, string, options);
        this.__render();
    }

    __initialize(parent, string, options) {
        this.__value = string || '';
        this.__root = parent;

        this.__appendInputElement();
        this.__appendTextElement();
        this.__options = {
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 100,
            height: options.height || 100,
            isCenterAligned: options.isCenterAligned || false,
            isVerticalCenterAligned: options.isVerticalCenterAligned || false,
        };
        this.__tspanClass = options.tspanClass || '';
        let symHeight = this.__testHeight();
        this.__lineHeight = options.lineHeight || symHeight || 15;
        this.__cursorHeight =  symHeight || 15;
    }

    startEdit(event) {
        this.__promise = $.Deferred();
        if (nowEdit && nowEdit != this) nowEdit.endEdit();
        nowEdit = this;
        this.show();

        inputElement.value = this.__value;
        inputElement.focus();
        $(inputElement).bind('keyup input', e => this.__keyup(e));
        $(inputElement).bind('blur', () => this.endEdit());
        $(this.__textElement).bind('mousedown', e => this.__mouseDown(e));
        $(this.__textElement).bind('click', e => this.__mouseClick(e));
        $(this.__textElement).bind('dblclick', e => this.__mouseDblclick(e));

        this.__init();
        let index = event ? this.__getIndexFromPos(event.pageX, event.pageY) : this.__value.length;
        this.__setCursor(index);
        return this.__promise.promise();
    }

    endEdit() {
        if (!this.__promise) return;
        
        nowEdit = false;
        $(inputElement).unbind('keyup input');
        $(inputElement).unbind('blur');
        $(this.__textElement).unbind('mousedown');
        $(this.__textElement).unbind('mousemove');
        $(this.__textElement).unbind('dblclick');
        $(this.__textElement).unbind('click');
        this.__deleteCursor();
        this.__deleteSelBlock();
        this.__promise.resolve(inputElement.value);
        this.__promise = false;
    }

    hide() {
        this.endEdit();
        $(this.__textElement).hide();
    }

    show() {
        $(this.__textElement).show();
    }

    isInEditMode() {
        return !!this.__promise;
    }

    __getLineOfChar(index) {
		if (index >= this.__textElement.getNumberOfChars()) return this.__stringsNum - 1;

		let res = 0;
		let sum = this.__stringsData[0];
		while(sum <= index) {
			sum += this.__stringsData[++res];
		}
		return res;
	}

	__lactCharIndex(line) {	
		let cur = 0;	
		let sum = this.__stringsData[cur];
		while(cur < line) {
			sum += this.__stringsData[++cur];
		}
		return sum - 1;
	}

	__firstCharIndex(line) {
		let cur = 0;		
		let sum = 0;
		while(cur < line) {
			sum += this.__stringsData[cur++];
		}
		return sum;
	}

    __getWordBounds(index) {
        let words = this.__value.split(' ');
        let start = 0;
        let end = words.shift().length;
        while (end < index) {
            start = end + 1;
            end +=  words.shift().length + 1;
        }
        return {
            start: start,
            end: end
        }
    }

    __getCharBBox(index) {
        if (this.__value.length == 0) {
            return {
                x: this.__options.isCenterAligned ? this.__options.x + this.__options.width / 2 : this.__options.x,
                y: this.__options.isVerticalCenterAligned ? this.__options.y + (this.__options.height - this.__lineHeight) / 2 : this.__options.y,
                width: 0,
                height: this.__cursorHeight
            }
        }
        if (this.__value.length <= index) {
            let index = this.__value.length - 1;
            let end = this.__textElement.getEndPositionOfChar(index);
            let line = this.__getLineOfChar(index);
            return {
                x: end.x,
                y: this.__textbb.y + this.__lineHeight * line,
                width: 0,
                height: this.__cursorHeight
            }
        }
		let start = this.__textElement.getStartPositionOfChar(index);
		let end = this.__textElement.getEndPositionOfChar(index);
		let line = this.__getLineOfChar(index);

		return {
			x: start.x,
			y: this.__textbb.y + this.__lineHeight * line,
			width: end.x - start.x,
			height: this.__cursorHeight
		}
    }

    __dstr(left, right) {
        return   'M' + left.tx  + ',' + left.ty
                 + ' L' + right.tx + ',' + right.ty
                 + ' '  + right.bx + ',' + right.by
                 + ' '  + left.bx  + ',' + left.by;
    }
    
    __setSelection(from, to) {
		this.__deleteCursor();
        this.__deleteSelBlock();

        let dstr = '';

		let curLine = this.__getLineOfChar(from);
		let endLine = this.__getLineOfChar(to);

		let fromChar = from;
		let toChar;

		let fromBBox = this.__getCharBBox(fromChar);
		let l = {
			tx: fromBBox.x,
			ty: fromBBox.y,
			bx: fromBBox.x,
			by: fromBBox.y + fromBBox.height
		}

		while(curLine < endLine) {
			toChar = this.__lactCharIndex(curLine);
			let toBBox = this.__getCharBBox(toChar);
			let r = {
				tx: toBBox.x + toBBox.width,
				ty: toBBox.y,
				bx: toBBox.x + toBBox.width,
				by: toBBox.y + toBBox.height
			}
            dstr += this.__dstr(l, r);
			fromChar = this.__firstCharIndex(++curLine);
			let fromBBox = this.__getCharBBox(fromChar);
			l = {
				tx: fromBBox.x,
				ty: fromBBox.y,
				bx: fromBBox.x,
				by: fromBBox.y + fromBBox.height
			}
		}
		
		toChar = to;
		let toBBox = this.__getCharBBox(toChar);
		let r = {
			tx: toBBox.x + toBBox.width,
			ty: toBBox.y,
			bx: toBBox.x + toBBox.width,
			by: toBBox.y + toBBox.height
		};
        dstr += this.__dstr(l, r);
		this.__appendSelblock(dstr);
	}

    __setCursor(index) {
		this.__deleteSelBlock();
        inputElement.selectionStart = inputElement.selectionEnd = index;
        if (!this.__cursor) this.__appendCursorElement();
        let charData = this.__getCharBBox(index);
        setAttributes.call(this.__cursor, {
            'x1': charData.x,
            'y1': charData.y,
            'x2': charData.x,
            'y2': charData.y + charData.height
        });
        this.__cursor.style.display = 'inline';
		if (!this.__blink) this.__blink = setInterval(() => {
			this.__cursor.style.display = this.__cursor.style.display == 'none' ? 'inline' : 'none';
		}, 500);
    }

    __screenToUser(mouseX, mouseY) {
        let transform = this.__textElement.getScreenCTM().inverse();
        let result = this.__textElement.ownerSVGElement.createSVGPoint();
        result.x = transform.a * mouseX + transform.c * mouseY + transform.e;
        result.y = transform.b * mouseX + transform.d * mouseY + transform.f;

        return result;
    }

    __getIndexFromPos(mouseX, mouseY) {
        let usrPos = this.__screenToUser(mouseX, mouseY);
        let index = this.__textElement.getCharNumAtPosition(usrPos);
        if (index == -1) return this.__value.length;

        let charData = this.__getCharBBox(index);
		index = usrPos.x < charData.x + charData.width / 2 ? index : index + 1;

        return index;
    }

    __init() {
        if (this.isInEditMode()) {            
            this.__textbb = this.__textElement.getBBox();
            let tspans = this.__textElement.childNodes;
            this.__stringsNum = tspans.length;
            this.__stringsData = [];
            this.__stringsData.lenght = this.__stringsNum;
            for (let i = 0; i < this.__stringsNum; i++) {
                this.__stringsData[i] = tspans[i].getNumberOfChars();
            }
        }
    }

    __testWidth(tspan, string) {
        this.__setTextContent(tspan, string);
        return tspan.getComputedTextLength() < this.__options.width;
    }

    __render() {
		if (!document.body.contains(this.__textElement)) return;
        $(this.__textElement).empty();
        let options = this.__options;
		let stringsNum = 0;
		let words = this.__value.split(' ');
		while (words.length) {
			let tspan = document.createElementNS(svgNS, 'tspan');
			this.__textElement.appendChild(tspan);

            let test = '';
			let localstr =  words.shift();

            if (!this.__testWidth(tspan, localstr)) {
                let word = localstr.split('');
                localstr = word.shift();
                test = localstr + word[0];
                while (this.__testWidth(tspan, test)) {
                    localstr += word.shift();
                    test = localstr + word[0];
                }
                words.unshift(word.join(''));
            } else {
                test = localstr + ' ' + words[0];
                while (words.length && this.__testWidth(tspan, test)) {
                    localstr += ' ' + words.shift();
                    test = localstr + ' ' + words[0];
                }
                localstr += words.length ? ' ' : '';
            }

			this.__setTextContent(tspan, localstr);
            setAttributes.call(tspan, {
                'dy': this.__lineHeight,
                'x': options.isCenterAligned ? options.x + options.width / 2 : options.x,
                'class': this.__tspanClass
            })
			stringsNum++;
		}
        setAttributes.call(this.__textElement, {
            'x': options.isCenterAligned ? options.x + options.width / 2 : options.x,
            'y': options.isVerticalCenterAligned ? options.y + options.height / 2 - this.__lineHeight * stringsNum / 2 : options.y,
            'text-anchor': options.isCenterAligned ? 'middle' : 'start'
        })
        this.__init();
    }

    __renderTimeout() {
        if (!this.__rendering) {
            this.__rendering = true;
            let mod = this.__value !== inputElement.value;
            this.__value = inputElement.value;
            setTimeout(() => {
                mod && this.__render();
                this.__rendering = false;
                if (this.__value !== inputElement.value) {
                    this.__renderTimeout();
                } else {                    
                    if (inputElement.selectionStart === inputElement.selectionEnd) {
                        this.__setCursor(inputElement.selectionEnd);
                    }
                    else
                        this.__setSelection(inputElement.selectionStart, inputElement.selectionEnd - 1);
                }
            }, 0);
        }
    }

    destroy() {
        this.endEdit();
        $(this.__textElement).remove();
        this.__deleteCursor();
        this.__deleteSelBlock();
        delete this.__options;
    }

    __appendInputElement() {
        if (!inputElement) {
            let input = document.createElement('input');
            input.type = 'text';
            $(input).css({
                position: 'absolute',
                left: '-9999px',
                top: '0'
            });
            document.body.appendChild(input);
            inputElement = input;
        }
    }

    __setInputSelection() {
        let back = this.__lastSelectEnd < this.__lastSelectStart;
        let from = this.__lastSelectStart;
        let to = this.__lastSelectEnd;
        if (back)
            [from, to] = [to, from];
        inputElement.selectionStart = from;
        inputElement.selectionEnd = to;
        inputElement.selectionDirection = back ? 'backward' : 'forward';
    }

    __appendTextElement() {
        if (!this.__textElement) {
            this.__textElement = document.createElementNS(svgNS, 'text');
            setAttributes.call(this.__textElement, {
                'fill': '#333',
                'class': 'svg-text-editor-text'
            })
            this.__textElement.style['white-space'] = 'pre';
        }
        if (!document.body.contains(this.__textElement)) this.__root.appendChild(this.__textElement);
    }

    __testHeight() {
        if (!document.body.contains(this.__textElement)) return 0;
        $(this.__textElement).empty();
        $(this.__textElement).append(' ');
        let res = this.__textElement.getBBox().height;
        $(this.__textElement).empty();

        return res;
    }

    __appendCursorElement() {
        this.__cursor = document.createElementNS(svgNS, 'line');
        setAttributes.call(this.__cursor, {
            'stroke': '#333',
            'stroke-width': 1
        })
        this.__root.appendChild(this.__cursor);
    }

    __deleteCursor() {
        if (this.__blink) {
            clearInterval(this.__blink);
            this.__blink = false;
        }
        if(this.__cursor) {
            $(this.__cursor).remove();
            this.__cursor = false;
        }
    }

    __setTextContent(el, str) {        
		$(el).empty();
		$(el).append(str);
    }
    
	__appendSelblock(dstr) {
		this.__select = document.createElementNS(svgNS, 'path');
        setAttributes.call(this.__select, {
            'fill': 'green',
            'opacity': 0.5,
            'd': dstr
        });
        this.__select.style['pointer-events'] = 'none';
        this.__root.appendChild(this.__select);
	}
    
    __deleteSelBlock() {        
        $(this.__select).remove();
    }
    
    __keyup(event) {
        event.stopPropagation();
        if (event.keyCode == 13) {
            this.endEdit();
            return;
        }
        if (event.keyCode == 65 && event.ctrlKey == true) {
            inputElement.selectionStart = 0;
            inputElement.selectionEnd = inputElement.value.length;
        }
		this.__deleteSelBlock();
        this.__renderTimeout();
    }

    __mouseClick(event) {
        event.stopPropagation();
        event.preventDefault();

        if (event.detail == 3) {
            inputElement.selectionStart = 0;
            inputElement.selectionEnd = inputElement.value.length;
            this.__setSelection(0, this.__value.length);
        }
    }

    __mouseDblclick(event) {        
        event.stopPropagation();
        event.preventDefault();
        if (this.isInEditMode()) {     
            let index = this.__getIndexFromPos(event.pageX, event.pageY)       
            let selectWord = this.__getWordBounds(index);
            this.__lastSelectStart = selectWord.start;
            this.__lastSelectEnd = selectWord.end;
            if (this.__lastSelectStart !== this.__lastSelectEnd) {
                this.__setInputSelection();
                let from = Math.min(this.__lastSelectStart, this.__lastSelectEnd);
                let to = Math.max(this.__lastSelectStart, this.__lastSelectEnd) - 1;

                this.__setSelection(from, to);
            }
        }
    }

    __mouseDown(event) {
        event.stopPropagation();
        event.preventDefault();
        this.__selecting = true;
        if (this.isInEditMode()) {
            this.__lastSelectStart = this.__lastSelectEnd = this.__getIndexFromPos(event.pageX, event.pageY);
            this.__setCursor(this.__lastSelectStart);
            $(document).one('mouseup', e => this.__mouseUp(e));
            $(this.__textElement).bind('mousemove', e => this.__mouseMove(e));
        }
    }

    __mouseMove(event) {        
        event.stopPropagation();
        event.preventDefault();
        if (this.isInEditMode() && this.__selecting) {
            this.__lastSelectEnd = this.__getIndexFromPos(event.pageX, event.pageY);
            if (this.__lastSelectStart !== this.__lastSelectEnd) {
                this.__setInputSelection();
                let from = Math.min(this.__lastSelectStart, this.__lastSelectEnd);
                let to = Math.max(this.__lastSelectStart, this.__lastSelectEnd) - 1;

                this.__setSelection(from, to);
            }
        }
    }

    __mouseUp(event) {
        event.stopPropagation();
        event.preventDefault();
        this.__selecting = false;
        if (this.__lastSelectStart === this.__lastSelectEnd) {      
            this.__setCursor(this.__lastSelectStart);
        } else {
            this.__setInputSelection();
        }
        $(this.__textElement).unbind('mousemove');
    }

    static set InputElement(el) {
        if (!(el instanceof HTMLInputElement)) throw 'element is not HTMLInputElement';
        inputElement = el;
    }
    
    static get InputElement() {
        return inputElement;
    }

    set textClass(c) {
        this.__tspanClass = c;
    }
}