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
        this._lineHeight = 15;

        this._options = options; //TODO: default values
        this._value = string;
        this._root = parent;

        this._appendInputElement();
        this._appendTextElement();
        this._render();
    }

    startEdit() {
        this._promise = $.Deferred();

        inputElement.value = this._value;
        inputElement.focus();
        $(inputElement).bind('keyup input', e => this._keyup(e));
        $(this._textElement).bind('mousedown', e => this._mouseDown(e));
        $(this._textElement).bind('mousemove', e => this._mouseMove(e));
        $(this._textElement).bind('mouseup', e => this._mouseUp(e))


        this._render();
        this._renderTimeout();
        return this._promise.promise();
    }

    endEdit() {
        if (!this._promise) return;
        
        inputElement.blur();
        $(inputElement).unbind('keyup input');
        $(this._textElement).unbind('mousedown');
        $(this._textElement).unbind('mousemove');
        $(this._textElement).unbind('mouseup'); 
        if (this._blink) {
            clearInterval(this._blink);
            this._blink = false;
        }
        if (this._cursor) {
            $(this._cursor).remove();
            this._cursor = false;
        }

		$('.js-texteditor-selblock', $(this._root)).remove();
        this._promise.resolve(inputElement.value);
        this._promise = false;
    }

    update(parent, string, options) {
        this.endEdit();
        this._options = options;
        this._value = string;
        this._root = parent;
        if (!document.body.contains(this._textElement)) parent.appendChild(this._textElement);
        this._render();
    }

    isInEditMode() {
        return !!this._promise;
    }

    _getLineOfChar(index) {
		if (index >= this._textElement.getNumberOfChars()) return this._stringsNum - 1;

		let res = 0;
		let sum = this._stringsData[0];
		while(sum <= index) {
			sum += this._stringsData[++res];
		}
		return res;
	}

    _getCharBBox(index) {
        if (this._value.length <= index) {
            let end = this._textElement.getEndPositionOfChar(this._value.length - 1);
            let line = this._getLineOfChar(index);
            return {
                x: end.x,
                y: this._textbb.y + this._lineHeight * line,
                width: 0,
                height: this._lineHeight
            }
        }
		let start = this._textElement.getStartPositionOfChar(index);
		let end = this._textElement.getEndPositionOfChar(index);
		let line = this._getLineOfChar(index);

		return {
			x: start.x,
			y: this._textbb.y + this._lineHeight * line,
			width: end.x - start.x,
			height: this._lineHeight
		}
    }

	_appendSelblockElement(left, right) {
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
        this._root.appendChild(select);
	}
    
    _setSelection(from, to) {
		$('.js-texteditor-selblock', $(this._root)).remove();
		inputElement.selectionStart = from;
		inputElement.selectionEnd = to;

		let curLine = this._getLineOfChar(from);
		let endLine = this._getLineOfChar(to);

		let fromChar = from;
		let toChar;

		let fromBBox = this._getCharBBox(fromChar);
		let l = {
			tx: fromBBox.x,
			ty: fromBBox.y,
			bx: fromBBox.x,
			by: fromBBox.y + fromBBox.height
		}

		while(curLine < endLine) {
			toChar = this._lactCharIndex(curLine);
			let toBBox = this._getCharBBox(toChar);
			let r = {
				tx: toBBox.x + toBBox.width,
				ty: toBBox.y,
				bx: toBBox.x + toBBox.width,
				by: toBBox.y + toBBox.height
			}
            this._appendSelblockElement(l, r);
			fromChar = this._firstCharIndex(++curLine);
			let fromBBox = this._getCharBBox(fromChar);
			l = {
				tx: fromBBox.x,
				ty: fromBBox.y,
				bx: fromBBox.x,
				by: fromBBox.y + fromBBox.height
			}
		}
		
		toChar = to;
		let toBBox = this._getCharBBox(toChar);
		let r = {
			tx: toBBox.x + toBBox.width,
			ty: toBBox.y,
			bx: toBBox.x + toBBox.width,
			by: toBBox.y + toBBox.height
		};
        this._appendSelblockElement(l, r);
	}

    _setCursor(index) {
        inputElement.selectionStart = inputElement.selectionEnd = index;
        if (!this._cursor) this._appendCursorElement();
        let charData = this._getCharBBox(index);
        setAttributes.call(this._cursor, {
            'x1': charData.x,
            'y1': charData.y,
            'x2': charData.x,
            'y2': charData.y + charData.height
        });
        this._cursor.style.display = 'inline';
		if (!this._blink) this._blink = setInterval(() => {
			this._cursor.style.display = this._cursor.style.display == 'none' ? 'inline' : 'none';
		}, 500);
    }

    _screenToUser(mouseX, mouseY) {
        let transform = this._textElement.getScreenCTM().inverse();
        let result = this._textElement.ownerSVGElement.createSVGPoint();
        result.x = transform.a * mouseX + transform.c * mouseY + transform.e;
        result.y = transform.b * mouseX + transform.d * mouseY + transform.f;

        return result;
    }

    _getIndexFromPos(mouseX, mouseY) {
        let usrPos = this._screenToUser(mouseX, mouseY);
        let index = this._textElement.getCharNumAtPosition(usrPos);
        if (index == -1) return;

        let charData = this._getCharBBox(index);
		index = usrPos.x < charData.x + charData.width / 2 ? index : index + 1;

        return index;
    }

    _render() {
		if (!document.body.contains(this._textElement)) return;
        $(this._textElement).empty();
        let options = this._options;
		let stringsNum = 0;
		let words = this._value.split(' ');
		while (words.length) {
			let localstr = words.shift();
			let test = localstr + ' ' + words[0];
			let tspan = document.createElementNS(svgNS, 'tspan');
			this._textElement.appendChild(tspan);
			this._setTextContent(tspan, test);
			while (words.length && tspan.getComputedTextLength() < options.width) {
				localstr += ' ' + words.shift();
				test = localstr + ' ' + words[0];
				this._setTextContent(tspan, test);
			}
			localstr += words.length ? ' ' : '';
			this._setTextContent(tspan, localstr);
            setAttributes.call(tspan, {
                'dy': this._lineHeight,
                'x': options.isCenterAligned ? options.x + options.width / 2 : options.x,
                'class': 'js-activity-shape'
            })
			stringsNum++;
		}
        setAttributes.call(this._textElement, {
            'x': options.isCenterAligned ? options.x + options.width / 2 : options.x,
            'y': options.isVerticalCenterAligned ? options.y + options.height / 2 - this._lineHeight * stringsNum / 2 : options.y,
            'text-anchor': options.isCenterAligned ? 'middle' : 'start'
        })

        if (this.isInEditMode()) {            
            this._textbb = this._textElement.getBBox();
            let tspans = this._textElement.childNodes;
            this._stringsNum = tspans.length;
            this._stringsData = [];
            this._stringsData.lenght = this._stringsNum;
            for (let i = 0; i < this._stringsNum; i++) {
                this._stringsData[i] = tspans[i].getNumberOfChars();
            }
        }
    }

    _renderTimeout() {
        if (!this._rendering) {
            this._rendering = true;
            let mod = this._value !== inputElement.value;
            this._value = inputElement.value;
            this._lastSelect = inputElement.selectionEnd;
            setTimeout(() => {
                mod && this._render();
                this._setCursor(this._lastSelect);
                this._rendering = false;
                if (this._value !== inputElement.value) this._renderTimeout();
            }, 0);
        }
    }

    dispose() {
        $(this._textElement).remove();
    }

    clear() {
        $(this._textElement).empty();
    }

    _setTextContent(el, str) {        
		$(el).empty();
		$(el).append(str);
    }

    _appendInputElement() {
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

    _appendTextElement() {
        this._textElement = document.createElementNS(svgNS, 'text');
        setAttributes.call(this._textElement, {
            'fill': '#746e6e',
            //'class': tspanClass
        })
        this._textElement.style['white-space'] = 'pre';
        this._root.appendChild(this._textElement);
    }

    _appendCursorElement() {
        this._cursor = document.createElementNS(svgNS, 'line');
        setAttributes.call(this._cursor, {
            'stroke': '#333',
            'stroke-width': 1
        })
        this._root.appendChild(this._cursor);
    }

	_lactCharIndex(line) {	
		let cur = 0;	
		let sum = this._stringsData[cur];
		while(cur < line) {
			sum += this._stringsData[++cur];
		}
		return sum - 1;
	}

	_firstCharIndex(line) {
		let cur = 0;		
		let sum = 0;
		while(cur < line) {
			sum += this._stringsData[cur++];
		}
		return sum;
	}

    _keyup(event) {
        event.stopPropagation();
		$('.js-texteditor-selblock', $(this._root)).remove();
        this._renderTimeout();
    }

    _mouseDown(event) {
        event.stopPropagation();
        this._selecting = true;
        if (this.isInEditMode()) {
            inputElement.focus();
            this._lastSelect = this._getIndexFromPos(event.pageX, event.pageY);
            this._setCursor(this._lastSelect);
        }
    }

    _mouseMove(event) {        
        event.stopPropagation();
        if (this.isInEditMode() && this._selecting) {
            inputElement.focus();
            let newPos = this._getIndexFromPos(event.pageX, event.pageY);
            if (this._lastSelect !== newPos) {
                this._setSelection(Math.min(this._lastSelect, newPos), Math.max(this._lastSelect, newPos));
            }
        }
    }

    _mouseUp(event) {
        event.stopPropagation();
        inputElement.focus();
        this._selecting = false;
    }

    static setInputElement(el) {
        if (!(el instanceof HTMLInputElement)) throw 'element is not HTMLInputElement';
        inputElement = el;
    }
    
    static getInputElement(el) {
        return inputElement;
    }
}