import Editor from './textEditor'
import $ from 'jquery'

$(document).ready(() => {
    let edit = new Editor($('#parent')[0], 'Edit me!', {
        x: 100,
        y: 10,
        width: 250, 
        height: 250,
        isCenterAligned: true,
        isVerticalCenterAligned: true
    });
    function start(e) {
        edit.startEdit(e).then((ret) => {
            alert(ret);
            $('#svg').one('click', start);
        })
    }
    $('#svg').one('click', start);
})