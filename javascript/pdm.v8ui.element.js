const Parameter = require('./pdm.v8ui.param.js').Parameter;

class V8uiElement {
    constructor(id, v8ui) {
        this.id = id;
        this.v8ui = v8ui;
        this.parameters = new Map();
        this._initializeParameters();
    }

    _initializeParameters() {
        // Create Parameter instances from definitions
        for (const [name, definition] of this.v8ui.parameters) {
            this.parameters.set(name, new Parameter(name, definition, this));
        }

        // Set up dependency relationships
        if (this.v8ui.paramDependencyGraph) {
            for (const [name, param] of this.parameters) {
                const dependants = this.v8ui.paramDependencyGraph.getAllDependants(name);
                for (const depName of dependants) {
                    param.addDependent(this.parameters.get(depName));
                }
            }
        }
    }

    getParameter(name) {
        const v = this.parameters.get(name)?.value;
        return v;
    }

    setParameter(name, value) {
        const param = this.parameters.get(name);
        if (!param) {
            throw new Error(`Parameter ${name} not found in element ${this.id}`);
        }
        const oldValue = param.value;
        param.value = value;
        if(oldValue !== value) {
            this._notifyParameterChange(name);
        }
    }

    getAllParameters() {
        const params = {};
        for (const [name, param] of this.parameters) {
            params[name] = param.value;
        }
        return params;
    }

    // Drawing method
    paint() {
        if (typeof this.v8ui.draw === 'function') {
            // Create a bound context with the utility methods
            const context = {
                color: this.getColor.bind(this),
                param: this.getParameter.bind(this),
                setparam: this.setParameter.bind(this),
                paraminfo: this.v8ui.getParameterConfig.bind(this),
                transform: {
                    // Convert normalized coordinates (0-1) to screen coordinates
                    point: (x, y) => {
                        const [px, py] = this.v8ui.layout.toCanvasCoords(Array.from(this.v8ui._elements.values()).indexOf(this), x, y);
                        return { x: px, y: py };
                    },
                    // Scale a vector by the element's dimensions
                    vector: (x, y, mode = 'both') => this.v8ui.layout.scaleVector(Array.from(this.v8ui._elements.values()).indexOf(this), x, y, mode),
                    // Scale a scalar value by the element's dimensions
                    scalar: (value) => this.v8ui.layout.scaleScalar(Array.from(this.v8ui._elements.values()).indexOf(this), value)
                }
            };
            
            // Call draw with the bound context
            this.v8ui.draw.call(context);
        }
    }

    _callInteractionHandler(handler, ...args) {
        if (!handler) return;
        
        const context = {
            param: this.getParameter.bind(this),
            setparam: this.setParameter.bind(this),
            paraminfo: this.v8ui.getParameterConfig.bind(this),
            transform: {
                point: (x, y) => {
                    const [px, py] = this.v8ui.layout.toCanvasCoords(Array.from(this.v8ui._elements.values()).indexOf(this), x, y);
                    return { x: px, y: py };
                },
                vector: (x, y, mode = 'both') => this.v8ui.layout.scaleVector(Array.from(this.v8ui._elements.values()).indexOf(this), x, y, mode),
                scalar: (value) => this.v8ui.layout.scaleScalar(Array.from(this.v8ui._elements.values()).indexOf(this), value)
            }
        };
        
        const newParams = handler.call(context, ...args);
        if (newParams) {
            Object.entries(newParams).forEach(([name, value]) => {
                this.setParameter(name, value);
            });
        }
    }

    handleClick(x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._callInteractionHandler(this.v8ui.onclick, x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    handleDoubleClick(x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._callInteractionHandler(this.v8ui.ondblclick, x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    handleDrag(x, y, button, modifier1, shift, capslock, option, ctrl, dragInfo) {
        if (this.v8ui.ondrag) {
            const relPos = this.v8ui.layout._getRelativePosition(this, x, y);
            const relStartPos = this.v8ui.layout._getRelativePosition(this, dragInfo.start.x, dragInfo.start.y);
            const relLastPos = this.v8ui.layout._getRelativePosition(this, dragInfo.last.x, dragInfo.last.y);
            
            this._callInteractionHandler(this.v8ui.ondrag, x, y, button, modifier1, shift, capslock, option, ctrl, 
                relPos.x, relPos.y, {
                    start: relStartPos,
                    last: relLastPos,
                    delta: dragInfo.delta,
                    total: dragInfo.total
                }
            );
        }
    }

    handleIdle(x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._callInteractionHandler(this.v8ui.onidle, x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    handleIdleOut(x, y, button, modifier1, shift, capslock, option, ctrl) {
        this._callInteractionHandler(this.v8ui.onidleout, x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    getColor(name) {
        const color = this.v8ui.getColor(name);
        mgraphics.set_source_rgba(color[0], color[1], color[2], color[3]);
    }

    _notifyParameterChange(paramName) {
        const elementId = Array.from(this.v8ui._elements.values()).indexOf(this);
        this.v8ui._notifyParameterChange(elementId, paramName);
    }
}

exports.V8uiElement = V8uiElement;