class Interaction {
    constructor(v8ui) {
        this.v8ui = v8ui;
        this.multiElementDrag = v8ui.multiElementDrag;
        this.clickTimeout = v8ui.clickTimeout;

        // State management
        this._state = {
            element: null,
            dragElement: null,
            isDragging: false,
            lastPos: { x: 0, y: 0 },
            startPos: { x: 0, y: 0 }
        };

        this._timer = new Task(this._timeout.bind(this), this);
    }

    interact(message, x, y, button, modifier1, shift, capslock, option, ctrl) {
        [x, y] = this._updateElementAtPosition(x, y);
        
        const eventHandlers = {
            click: () => {}, //wait for mouse up (drag with button 0)
            drag: () => this._onDrag(x, y, button, modifier1, shift, capslock, option, ctrl),
            dblclick: () => this._handleDoubleClick(x, y, button, modifier1, shift, capslock, option, ctrl),
            idle: () => this._handleEvent('handleIdle', x, y, button, modifier1, shift, capslock, option, ctrl),
            idleout: () => this._handleEvent('handleIdleOut', x, y, button, modifier1, shift, capslock, option, ctrl)
        };

        const handler = eventHandlers[message];
        if (handler) {
            handler();
        } else {
            this.v8ui.anything(message, x, y, button, modifier1, shift, capslock, option, ctrl);
        }
    }

    _updateElementAtPosition(x, y) {
        this._state.element = this.v8ui.layout.findElementAtPosition(x, y);
        if (this._state.element) {
            const elementIndex = Array.from(this.v8ui._elements.values()).indexOf(this._state.element);
            return this.v8ui.layout.toElementCoords(elementIndex, x, y);
        }
        return [x, y];
    }

    _onDrag(x, y, button, modifier1, shift, capslock, option, ctrl) {
        if(button === 1) { //if drag 1, then we're dragging
            this._state.isDragging = true;
            this._state.startPos = { x, y };
            this._state.dragElement = this._state.element;
            this._handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl);
        } else { //if drag 0...
            if(this._state.isDragging) { //if we're dragging, then we're done
                this._handleDragEnd();
            } else { //if we're not dragging, then we're either clicking or double clicking
                this._onClick(x, y, button, modifier1, shift, capslock, option, ctrl)
            }
        }
        
    }

    _onClick(x, y, button, modifier1, shift, capslock, option, ctrl) { //when mouse button is released while not dragging
        this._interactionArgs = [x, y, button, modifier1, shift, capslock, option, ctrl];

        if (this.clickTimeout === 0) {
            this._timer.execute();
        } else {
            if(this._timer.running) {
                this._timer.cancel();
            }
            this._timer.schedule(this.clickTimeout);
        }
    }

    _timeout() {
        this._handleEvent('handleClick', ...this._interactionArgs);
    }

    _handleDoubleClick(x, y, button, modifier1, shift, capslock, option, ctrl) {
        if(this._timer.running) {
            this._timer.cancel();
        }
        this._handleEvent('handleDoubleClick', x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    _handleEvent(handlerName, x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._handleDragEnd();
        if (this._state.element) {
            this._state.element[handlerName](x, y, button, modifier1, shift, capslock, option, ctrl);
        }
    }

    _handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._state.element = this.v8ui.layout.findElementAtPosition(x, y);
    
        if (this.multiElementDrag) {
            this._state.dragElement = this._state.element;
        }

        const dragInfo = this._createDragInfo(x, y);
        this._state.dragElement.handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl, dragInfo);

        this._state.lastPos = { x, y };
    }

    _createDragInfo(x, y) {
        return {
            start: this._state.startPos,
            last: this._state.lastPos,
            delta: {
                x: x - this._state.lastPos.x,
                y: y - this._state.lastPos.y
            },
            total: {
                x: x - this._state.startPos.x,
                y: y - this._state.startPos.y
            }
        };
    }

    _handleDragEnd() {
        if (this._state.isDragging) {
            this._state.isDragging = false;
            this._state.dragElement = null;
        }
    }
}

exports.Interaction = Interaction; 