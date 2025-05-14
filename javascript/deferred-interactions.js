autowatch = 1;
const timeout = 250;
const timer = new Task(timeout_event, this);

let isDown = false;
let isDragging = false;

//defauilt mouse event handlers
function onclick(x, y, button) {
    post('clicked', button, '\n');
//    mousestate(button);
}

function ondrag(x, y, button) {
    post('dragged', button, '\n');
    // mousestate(button);
}   

function ondblclick(x, y, button) {
    post('double clicked', button, '\n');
    // if(button === 1) {
    //     timer.cancel();
    //     dblclick_event();
    // }
}

//mouse state handlers
function mousestate(button) {
    if(button === 1) mousedown();
    if(button === 0) mouseup();
}

function mousedown() {
    if(isDragging) {
        dragging();
        return;
    }
    if(isDown) return;
    isDown = true;
    if(!timer.running) timer.schedule(timeout);
}

function mouseup() {
    if(!isDown) return;
    isDown = false;
    if(isDragging) {
        isDragging = false;
        end_drag();
    }
}

//timer event handlers
function timeout_event() {
    if(isDown) begin_drag();
    else click_event();
}

//new event handlers
function begin_drag() {
    post('event: drag started!\n');
    isDragging = true;
}

function dragging() {
    post('event: dragged!\n');
}

function end_drag() {
    post('event: drag ended!\n');
}

function click_event() {
    post('event: clicked!\n');
}

function dblclick_event() {
    post('event: double clicked!\n');
}