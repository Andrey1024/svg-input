/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var svgNS = 'http://www.w3.org/2000/svg';
var inputElement = void 0;
var nowEdit = void 0;

function setAttributes(obj) {
    for (var prop in obj) {
        this.setAttribute(prop, obj[prop]);
    }
}

var TextEditor = function () {
    function TextEditor(parent, string, options) {
        _classCallCheck(this, TextEditor);

        this.__lineHeight = 15;

        this.__options = {
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 100,
            height: options.height || 100
        };
        this.__value = string || '';
        this.__root = parent;

        this.__tspanClass = '';

        this.__appendInputElement();
        this.__appendTextElement();
        this.__render();
    }

    _createClass(TextEditor, [{
        key: 'startEdit',
        value: function startEdit(event) {
            var _this = this;

            this.__promise = $.Deferred();
            if (nowEdit && nowEdit != this) nowEdit.endEdit();
            nowEdit = this;
            this.show();

            inputElement.value = this.__value;
            inputElement.focus();
            $(inputElement).bind('keyup input', function (e) {
                return _this.__keyup(e);
            });
            $(inputElement).bind('blur', function () {
                return _this.endEdit();
            });
            $(this.__textElement).bind('mousedown', function (e) {
                return _this.__mouseDown(e);
            });
            $(this.__textElement).bind('click', function (e) {
                return _this.__mouseClick(e);
            });
            $(this.__textElement).bind('dblclick', function (e) {
                return _this.__mouseDblclick(e);
            });

            this.__init();
            var index = event ? this.__getIndexFromPos(event.pageX, event.pageY) : this.__value.length;
            this.__setCursor(index);
            return this.__promise.promise();
        }
    }, {
        key: 'endEdit',
        value: function endEdit() {
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
    }, {
        key: 'update',
        value: function update(parent, string, options) {
            this.endEdit();
            this.__options = options;
            this.__value = string;
            this.__root = parent;
            if (!document.body.contains(this.__textElement)) parent.appendChild(this.__textElement);
            this.__render();
        }
    }, {
        key: 'hide',
        value: function hide() {
            this.endEdit();
            $(this.__textElement).hide();
        }
    }, {
        key: 'show',
        value: function show() {
            $(this.__textElement).show();
        }
    }, {
        key: 'isInEditMode',
        value: function isInEditMode() {
            return !!this.__promise;
        }
    }, {
        key: '__getLineOfChar',
        value: function __getLineOfChar(index) {
            if (index >= this.__textElement.getNumberOfChars()) return this.__stringsNum - 1;

            var res = 0;
            var sum = this.__stringsData[0];
            while (sum <= index) {
                sum += this.__stringsData[++res];
            }
            return res;
        }
    }, {
        key: '__lactCharIndex',
        value: function __lactCharIndex(line) {
            var cur = 0;
            var sum = this.__stringsData[cur];
            while (cur < line) {
                sum += this.__stringsData[++cur];
            }
            return sum - 1;
        }
    }, {
        key: '__firstCharIndex',
        value: function __firstCharIndex(line) {
            var cur = 0;
            var sum = 0;
            while (cur < line) {
                sum += this.__stringsData[cur++];
            }
            return sum;
        }
    }, {
        key: '__getWordBounds',
        value: function __getWordBounds(index) {
            var words = this.__value.split(' ');
            var start = 0;
            var end = words.shift().length;
            while (end < index) {
                start = end + 1;
                end += words.shift().length + 1;
            }
            return {
                start: start,
                end: end
            };
        }
    }, {
        key: '__getCharBBox',
        value: function __getCharBBox(index) {
            if (this.__value.length == 0) {
                return {
                    x: this.__options.isCenterAligned ? this.__options.x + this.__options.width / 2 : this.__options.x,
                    y: this.__options.isVerticalCenterAligned ? this.__options.y + (this.__options.height - this.__lineHeight) / 2 : this.__options.y,
                    width: 0,
                    height: this.__lineHeight
                };
            }
            if (this.__value.length <= index) {
                var _end = this.__textElement.getEndPositionOfChar(this.__value.length - 1);
                var _line = this.__getLineOfChar(index);
                return {
                    x: _end.x,
                    y: this.__textbb.y + this.__lineHeight * _line,
                    width: 0,
                    height: this.__lineHeight
                };
            }
            var start = this.__textElement.getStartPositionOfChar(index);
            var end = this.__textElement.getEndPositionOfChar(index);
            var line = this.__getLineOfChar(index);

            return {
                x: start.x,
                y: this.__textbb.y + this.__lineHeight * line,
                width: end.x - start.x,
                height: this.__lineHeight
            };
        }
    }, {
        key: '__appendSelblock',
        value: function __appendSelblock(left, right) {
            var dstr = 'M' + left.tx + ',' + left.ty + ' L' + right.tx + ',' + right.ty + ' ' + right.bx + ',' + right.by + ' ' + left.bx + ',' + left.by;
            var select = document.createElementNS(svgNS, 'path');
            setAttributes.call(select, {
                'fill': 'green',
                'opacity': 0.5,
                'class': 'js-texteditor-selblock',
                'd': dstr
            });
            select.style['pointer-events'] = 'none';
            this.__root.appendChild(select);
        }
    }, {
        key: '__setSelection',
        value: function __setSelection(from, to) {
            this.__deleteCursor();
            this.__deleteSelBlock();

            var curLine = this.__getLineOfChar(from);
            var endLine = this.__getLineOfChar(to);

            var fromChar = from;
            var toChar = void 0;

            var fromBBox = this.__getCharBBox(fromChar);
            var l = {
                tx: fromBBox.x,
                ty: fromBBox.y,
                bx: fromBBox.x,
                by: fromBBox.y + fromBBox.height
            };

            while (curLine < endLine) {
                toChar = this.__lactCharIndex(curLine);
                var _toBBox = this.__getCharBBox(toChar);
                var _r = {
                    tx: _toBBox.x + _toBBox.width,
                    ty: _toBBox.y,
                    bx: _toBBox.x + _toBBox.width,
                    by: _toBBox.y + _toBBox.height
                };
                this.__appendSelblock(l, _r);
                fromChar = this.__firstCharIndex(++curLine);
                var _fromBBox = this.__getCharBBox(fromChar);
                l = {
                    tx: _fromBBox.x,
                    ty: _fromBBox.y,
                    bx: _fromBBox.x,
                    by: _fromBBox.y + _fromBBox.height
                };
            }

            toChar = to;
            var toBBox = this.__getCharBBox(toChar);
            var r = {
                tx: toBBox.x + toBBox.width,
                ty: toBBox.y,
                bx: toBBox.x + toBBox.width,
                by: toBBox.y + toBBox.height
            };
            this.__appendSelblock(l, r);
        }
    }, {
        key: '__setCursor',
        value: function __setCursor(index) {
            var _this2 = this;

            this.__deleteSelBlock();
            inputElement.selectionStart = inputElement.selectionEnd = index;
            if (!this.__cursor) this.__appendCursorElement();
            var charData = this.__getCharBBox(index);
            setAttributes.call(this.__cursor, {
                'x1': charData.x,
                'y1': charData.y,
                'x2': charData.x,
                'y2': charData.y + charData.height
            });
            this.__cursor.style.display = 'inline';
            if (!this.__blink) this.__blink = setInterval(function () {
                _this2.__cursor.style.display = _this2.__cursor.style.display == 'none' ? 'inline' : 'none';
            }, 500);
        }
    }, {
        key: '__screenToUser',
        value: function __screenToUser(mouseX, mouseY) {
            var transform = this.__textElement.getScreenCTM().inverse();
            var result = this.__textElement.ownerSVGElement.createSVGPoint();
            result.x = transform.a * mouseX + transform.c * mouseY + transform.e;
            result.y = transform.b * mouseX + transform.d * mouseY + transform.f;

            return result;
        }
    }, {
        key: '__getIndexFromPos',
        value: function __getIndexFromPos(mouseX, mouseY) {
            var usrPos = this.__screenToUser(mouseX, mouseY);
            var index = this.__textElement.getCharNumAtPosition(usrPos);
            if (index == -1) return this.__value.length;

            var charData = this.__getCharBBox(index);
            index = usrPos.x < charData.x + charData.width / 2 ? index : index + 1;

            return index;
        }
    }, {
        key: '__init',
        value: function __init() {
            if (this.isInEditMode()) {
                this.__textbb = this.__textElement.getBBox();
                var tspans = this.__textElement.childNodes;
                this.__stringsNum = tspans.length;
                this.__stringsData = [];
                this.__stringsData.lenght = this.__stringsNum;
                for (var i = 0; i < this.__stringsNum; i++) {
                    this.__stringsData[i] = tspans[i].getNumberOfChars();
                }
            }
        }
    }, {
        key: '__testWidth',
        value: function __testWidth(tspan, string) {
            this.__setTextContent(tspan, string);
            return tspan.getComputedTextLength() < this.__options.width;
        }
    }, {
        key: '__render',
        value: function __render() {
            if (!document.body.contains(this.__textElement)) return;
            $(this.__textElement).empty();
            var options = this.__options;
            var stringsNum = 0;
            var words = this.__value.split(' ');
            while (words.length) {
                var tspan = document.createElementNS(svgNS, 'tspan');
                this.__textElement.appendChild(tspan);

                var test = '';
                var localstr = words.shift();

                if (!this.__testWidth(tspan, localstr)) {
                    var word = localstr.split('');
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
                });
                stringsNum++;
            }
            setAttributes.call(this.__textElement, {
                'x': options.isCenterAligned ? options.x + options.width / 2 : options.x,
                'y': options.isVerticalCenterAligned ? options.y + options.height / 2 - this.__lineHeight * stringsNum / 2 : options.y,
                'text-anchor': options.isCenterAligned ? 'middle' : 'start'
            });
            this.__init();
        }
    }, {
        key: '__renderTimeout',
        value: function __renderTimeout() {
            var _this3 = this;

            if (!this.__rendering) {
                (function () {
                    _this3.__rendering = true;
                    var mod = _this3.__value !== inputElement.value;
                    _this3.__value = inputElement.value;
                    setTimeout(function () {
                        mod && _this3.__render();
                        _this3.__rendering = false;
                        if (_this3.__value !== inputElement.value) {
                            _this3.__renderTimeout();
                        } else {
                            if (inputElement.selectionStart === inputElement.selectionEnd) {
                                _this3.__setCursor(inputElement.selectionEnd);
                            } else _this3.__setSelection(inputElement.selectionStart, inputElement.selectionEnd - 1);
                        }
                    }, 0);
                })();
            }
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.endEdit();
            $(this.__textElement).remove();
            this.__deleteCursor();
            this.__deleteSelBlock();
            delete this.__options;
        }
    }, {
        key: '__appendInputElement',
        value: function __appendInputElement() {
            if (!inputElement) {
                var input = document.createElement('input');
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
    }, {
        key: '__setInputSelection',
        value: function __setInputSelection() {
            var back = this.__lastSelectEnd < this.__lastSelectStart;
            var from = this.__lastSelectStart;
            var to = this.__lastSelectEnd;
            if (back) {
                ;
                var _ref = [to, from];
                from = _ref[0];
                to = _ref[1];
            }inputElement.selectionStart = from;
            inputElement.selectionEnd = to;
            inputElement.selectionDirection = back ? 'backward' : 'forward';
        }
    }, {
        key: '__appendTextElement',
        value: function __appendTextElement() {
            this.__textElement = document.createElementNS(svgNS, 'text');
            setAttributes.call(this.__textElement, {
                'fill': '#746e6e'
            });
            this.__textElement.style['white-space'] = 'pre';
            this.__root.appendChild(this.__textElement);
        }
    }, {
        key: '__appendCursorElement',
        value: function __appendCursorElement() {
            this.__cursor = document.createElementNS(svgNS, 'line');
            setAttributes.call(this.__cursor, {
                'stroke': '#333',
                'stroke-width': 1
            });
            this.__root.appendChild(this.__cursor);
        }
    }, {
        key: '__deleteCursor',
        value: function __deleteCursor() {
            if (this.__blink) {
                clearInterval(this.__blink);
                this.__blink = false;
            }
            if (this.__cursor) {
                $(this.__cursor).remove();
                this.__cursor = false;
            }
        }
    }, {
        key: '__setTextContent',
        value: function __setTextContent(el, str) {
            $(el).empty();
            $(el).append(str);
        }
    }, {
        key: '__deleteSelBlock',
        value: function __deleteSelBlock() {
            $('.js-texteditor-selblock', $(this.__root)).remove();
        }
    }, {
        key: '__keyup',
        value: function __keyup(event) {
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
    }, {
        key: '__mouseClick',
        value: function __mouseClick(event) {
            event.stopPropagation();
            event.preventDefault();

            if (event.detail == 3) {
                inputElement.selectionStart = 0;
                inputElement.selectionEnd = inputElement.value.length;
                this.__setSelection(0, this.__value.length);
            }
        }
    }, {
        key: '__mouseDblclick',
        value: function __mouseDblclick(event) {
            event.stopPropagation();
            event.preventDefault();
            if (this.isInEditMode()) {
                var index = this.__getIndexFromPos(event.pageX, event.pageY);
                var selectWord = this.__getWordBounds(index);
                this.__lastSelectStart = selectWord.start;
                this.__lastSelectEnd = selectWord.end;
                if (this.__lastSelectStart !== this.__lastSelectEnd) {
                    this.__setInputSelection();
                    var from = Math.min(this.__lastSelectStart, this.__lastSelectEnd);
                    var to = Math.max(this.__lastSelectStart, this.__lastSelectEnd) - 1;

                    this.__setSelection(from, to);
                }
            }
        }
    }, {
        key: '__mouseDown',
        value: function __mouseDown(event) {
            var _this4 = this;

            event.stopPropagation();
            event.preventDefault();
            this.__selecting = true;
            if (this.isInEditMode()) {
                this.__lastSelectStart = this.__lastSelectEnd = this.__getIndexFromPos(event.pageX, event.pageY);
                this.__setCursor(this.__lastSelectStart);
                $(document).one('mouseup', function (e) {
                    return _this4.__mouseUp(e);
                });
                $(this.__textElement).bind('mousemove', function (e) {
                    return _this4.__mouseMove(e);
                });
            }
        }
    }, {
        key: '__mouseMove',
        value: function __mouseMove(event) {
            event.stopPropagation();
            event.preventDefault();
            if (this.isInEditMode() && this.__selecting) {
                this.__lastSelectEnd = this.__getIndexFromPos(event.pageX, event.pageY);
                if (this.__lastSelectStart !== this.__lastSelectEnd) {
                    this.__setInputSelection();
                    var from = Math.min(this.__lastSelectStart, this.__lastSelectEnd);
                    var to = Math.max(this.__lastSelectStart, this.__lastSelectEnd) - 1;

                    this.__setSelection(from, to);
                }
            }
        }
    }, {
        key: '__mouseUp',
        value: function __mouseUp(event) {
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
    }, {
        key: 'textClass',
        set: function set(c) {
            this.__tspanClass = c;
        }
    }], [{
        key: 'InputElement',
        set: function set(el) {
            if (!(el instanceof HTMLInputElement)) throw 'element is not HTMLInputElement';
            inputElement = el;
        },
        get: function get() {
            return inputElement;
        }
    }]);

    return TextEditor;
}();

exports.default = TextEditor;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _textEditor = __webpack_require__(0);

var _textEditor2 = _interopRequireDefault(_textEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

$(document).ready(function () {
    var edit = new _textEditor2.default($('#parent')[0], 'Edit me!', {
        x: 100,
        y: 10,
        width: 250,
        height: 250,
        isCenterAligned: true,
        isVerticalCenterAligned: true
    });
    function start(e) {
        edit.startEdit(e).then(function (ret) {
            alert(ret);
            $('#svg').one('click', start);
        });
    }
    $('#svg').one('click', start);
});

/***/ })
/******/ ]);
//# sourceMappingURL=svg-text-editor.js.map