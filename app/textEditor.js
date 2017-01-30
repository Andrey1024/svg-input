import $ from 'jquery'
const svgNS = 'http://www.w3.org/2000/svg';
let inputElement;
let editables = [];

function setAttributes(obj) {
    for (let prop in obj) {
        this.setAttribute(prop, obj[prop]);
    }
}

export default class TextEditor {
    constructor(parent, string, options) {
        this.__lineHeight = 15;

        this.__options = options; //TODO: default values
        this.__value = string;
        this.__root = parent;

        this.__appendInputElement();
        this.__appendTextElement();
        this.__render();
        editables.push(this);
    }

    startEdit(event) {
        this.__promise = $.Deferred();
        editables.filter(e => e != this).forEach((e) => {
            e.endEdit();
        })

        inputElement.value = this.__value;
        inputElement.focus();
        $(inputElement).bind('keyup input', e => this.__keyup(e));
        $(this.__textElement).bind('mousedown', e => this.__mouseDown(e));
        $(inputElement).blur(() => this.endEdit());

        this.__init();
        let index = event ? this.__getIndexFromPos(event.pageX, event.pageY) : this.__value.length;
        this.__lastSelectEnd = this.__lastSelectStart = index;
        this.__setCursor(index);
        return this.__promise.promise();
    }

    endEdit() {
        if (!this.__promise) return;
        
        $(inputElement).unbind('keyup input');
        $(this.__textElement).unbind('mousedown');
        $(this.__textElement).unbind('mousemove');
        this.__deleteCursor();
        this.__deleteSelBlock();
        this.__promise.resolve(inputElement.value);
        this.__promise = false;
    }

    update(parent, string, options) {
        this.endEdit();
        this.__options = options;
        this.__value = string;
        this.__root = parent;
        if (!document.body.contains(this.__textElement)) parent.appendChild(this.__textElement);
        this.__render();
    }

    __isInEditMode() {
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

    __getCharBBox(index) {
        if (this.__value.length == 0) {
            return {
                x: this.__options.isCenterAligned ? this.__options.x + this.__options.width / 2 : this.__options.x,
                y: this.__options.isVerticalCenterAligned ? this.__options.y + (this.__options.height - this.__lineHeight) / 2 : this.__options.y,
                width: 0,
                height: this.__lineHeight
            }
        }
        if (this.__value.length <= index) {
            let end = this.__textElement.getEndPositionOfChar(this.__value.length - 1);
            let line = this.__getLineOfChar(index);
            return {
                x: end.x,
                y: this.__textbb.y + this.__lineHeight * line,
                width: 0,
                height: this.__lineHeight
            }
        }
		let start = this.__textElement.getStartPositionOfChar(index);
		let end = this.__textElement.getEndPositionOfChar(index);
		let line = this.__getLineOfChar(index);

		return {
			x: start.x,
			y: this.__textbb.y + this.__lineHeight * line,
			width: end.x - start.x,
			height: this.__lineHeight
		}
    }

	__appendSelblock(left, right) {
        let dstr =  'M' + left.tx  + ',' + left.ty
                 + ' L' + right.tx + ',' + right.ty
                 + ' '  + right.bx + ',' + right.by
                 + ' '  + left.bx  + ',' + left.by;
		let select = document.createElementNS(svgNS, 'path');
        setAttributes.call(select, {
            'fill': 'green',
            'opacity': 0.5,
            'class': 'js-texteditor-selblock',
            'd': dstr
        });
        select.style['pointer-events'] = 'none';
        this.__root.appendChild(select);
	}
    
    __setSelection(from, to) {
		this.__deleteCursor();
        this.__deleteSelBlock();

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
            this.__appendSelblock(l, r);
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
        this.__appendSelblock(l, r);
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
        if (this.__isInEditMode()) {            
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

    __render() {
		if (!document.body.contains(this.__textElement)) return;
        $(this.__textElement).empty();
        let options = this.__options;
		let stringsNum = 0;
		let words = this.__value.split(' ');
		while (words.length) {
			let localstr = words.shift();
			let test = localstr + ' ' + words[0];
			let tspan = document.createElementNS(svgNS, 'tspan');
			this.__textElement.appendChild(tspan);
			this.__setTextContent(tspan, test);
			while (words.length && tspan.getComputedTextLength() < options.width) {
				localstr += ' ' + words.shift();
				test = localstr + ' ' + words[0];
				this.__setTextContent(tspan, test);
			}
			localstr += words.length ? ' ' : '';
			this.__setTextContent(tspan, localstr);
            setAttributes.call(tspan, {
                'dy': this.__lineHeight,
                'x': options.isCenterAligned ? options.x + options.width / 2 : options.x,
                'class': 'js-activity-shape'
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
            this.__lastSelectEnd = inputElement.selectionEnd;
            this.__lastSelectStart = inputElement.selectionStart;
            setTimeout(() => {
                mod && this.__render();
                this.__rendering = false;
                if (this.__value !== inputElement.value) {
                    this.__renderTimeout();
                } else {                    
                    if (this.__lastSelectStart === this.__lastSelectEnd) {
                        this.__setCursor(this.__lastSelectEnd);
                    }
                    else
                        this.__setSelection(this.__lastSelectStart, this.__lastSelectEnd - 1);
                }
            }, 0);
        }
    }

    dispose() {
        editables.splice(editables.indexOf(this), 1);
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
        inputElement.focus();
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
        this.__textElement = document.createElementNS(svgNS, 'text');
        setAttributes.call(this.__textElement, {
            'fill': '#746e6e',
            //'class': tspanClass
        })
        this.__textElement.style['white-space'] = 'pre';
        this.__root.appendChild(this.__textElement);
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
    
    __deleteSelBlock() {        
		$('.js-texteditor-selblock', $(this.__root)).remove();
    }
    
    __setTextContent(el, str) {        
		$(el).empty();
		$(el).append(str);
    }

    __keyup(event) {
        event.stopPropagation();
		this.__deleteSelBlock();
        this.__renderTimeout();
    }

    __mouseDown(event) {
        event.stopPropagation();
        event.preventDefault();
        this.__selecting = true;
        if (this.__isInEditMode()) {
            inputElement.focus();
            this.__lastSelectStart = this.__lastSelectEnd = this.__getIndexFromPos(event.pageX, event.pageY);
            this.__setCursor(this.__lastSelectStart);
            $(document).one('mouseup', e => this.__mouseUp(e));
            $(this.__textElement).bind('mousemove', e => this.__mouseMove(e));
        }
    }

    __mouseMove(event) {        
        event.stopPropagation();
        event.preventDefault();
        if (this.__isInEditMode() && this.__selecting) {
            inputElement.focus();
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
        inputElement.focus();
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
}