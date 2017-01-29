import Editor from './textEditor'

let editors = [];

export default class Control extends Editor {
    constructor() {
        super();
        editors.push(this);
    }
    
    startEdit() {
        for (let editor in editors) {
            editor.endEdit();
        }
        return super.startEdit();
    }

    delete() {
        //delete this obj
    }
}