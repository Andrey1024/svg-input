import Editor from './textEditor'
import $ from 'jquery'

$(document).ready(() => {
    let edit = new Editor($('#svg')[0], 'Edit me!', {
        x: 10,
        y: 10,
        width: 200, 
        height: 200,
        isCenterAligned: true,
        isVerticalCenterAligned: true
    });
    function start() {
        edit.startEdit().then((ret) => {
            alert(ret);
            $('#svg').one('dblclick', start);
        })
    }
    $('#svg').one('dblclick', start);
    $('body').click((evt) => {
        if (!$("#svg").find($(evt.target)).length && $('#svg')[0] != evt.target)
            edit.endEdit();
    })
})