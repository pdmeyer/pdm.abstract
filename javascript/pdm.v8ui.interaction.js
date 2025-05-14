class Interaction {
    constructor(v8ui) {
        this.v8ui = v8ui;
        this.multiElementDrag = v8ui.multiElementDrag;
        this.doubleClickTimeout = v8ui.doubleClickTimeout;
        this.dragTimeout = v8ui.dragTimeout;
        post('doubleClickTimeout', this.doubleClickTimeout, 'dragTimeout', this.dragTimeout, '\n');

        // State management
        this._state = {
            element: null,
            dragElement: null,
            isDragging: false,
            lastPos: { x: 0, y: 0 },
            startPos: { x: 0, y: 0 }
        };

        // Task management
        this._clickTimeoutTask = new Task(function() {
            this._handleEvent('handleClick', ...this._interactionArgs);
        }.bind(this), this);

        this._dragTimeoutTask = new Task(function() {
            if(this._clickTimeoutTask.running) {
                this._clickTimeoutTask.cancel();
            }
            this._handleDrag(...this._interactionArgs);
        }.bind(this), this);
    }

    interact(message, x, y, button, modifier1, shift, capslock, option, ctrl) {
        [x, y] = this._updateElementAtPosition(x, y);
        
        const eventHandlers = {
            click: () => this._onClick(x, y, button, modifier1, shift, capslock, option, ctrl),
            dblclick: () => this._handleDoubleClick(x, y, button, modifier1, shift, capslock, option, ctrl),
            drag: () => this._onDrag(x, y, button, modifier1, shift, capslock, option, ctrl),
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

    _onClick(x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._interactionArgs = [x, y, button, modifier1, shift, capslock, option, ctrl];
        
        if (button !== 1) return;

        if (this.doubleClickTimeout > 0) {
            this._clickTimeoutTask.cancel();
            this._clickTimeoutTask.schedule(this.doubleClickTimeout);
        } else {
            this._clickTimeoutTask.execute();
        }
    }

    _handleDoubleClick(x, y, button, modifier1, shift, capslock, option, ctrl) {
        if(this._clickTimeoutTask.running) {
            this._clickTimeoutTask.cancel();
        }
        this._handleEvent('handleDoubleClick', x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    _onDrag(x, y, button, modifier1, shift, capslock, option, ctrl) {
        if (button === 0) {
            if (this._dragTimeoutTask.running) {
                this._dragTimeoutTask.cancel();
                this._handleEvent('handleClick', ...this._interactionArgs);
            }
            return;
        }

        if(this._state.isDragging) {
            this._handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl);
            return;
        }

        if (this.dragTimeout === 0) {
            this._dragTimeoutTask.execute();
        } else if (!this._dragTimeoutTask.running) {
            this._interactionArgs = [x, y, button, modifier1, shift, capslock, option, ctrl];
            this._dragTimeoutTask.schedule(this.dragTimeout);
        }
    }

    _handleEvent(handlerName, x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._handleDragEnd();
        if (this._state.element) {
            this._state.element[handlerName](x, y, button, modifier1, shift, capslock, option, ctrl);
        }
    }

    _handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl) {
        if (button !== 1) {
            this._handleDragEnd();
            return;
        }

        this._state.element = this.v8ui.layout.findElementAtPosition(x, y);
        
        if (!this._state.isDragging) {
            this._state.isDragging = true;
            this._state.startPos = { x, y };
            this._state.dragElement = this._state.element;
        }

        if (this._state.isDragging) {
            if (this.multiElementDrag) {
                this._state.dragElement = this._state.element;
            }

            const dragInfo = this._createDragInfo(x, y);
            this._state.dragElement.handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl, dragInfo);
        }

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