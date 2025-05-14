const V8uiElement = require('./pdm.v8ui.element.js').V8uiElement;
const Interaction = require('./pdm.v8ui.interaction.js').Interaction;
const DynamicColor = require('./pdm.dynamiccolor.js').DynamicColor;
const MaxJsObject = require('./pdm.maxjsobject.js').MaxJsObject;

mgraphics.init();

class V8ui{
    constructor(config = {}) {
        this.maxObj = config.maxObj;
        this._draw = config.draw

        // interactions
        this.onclick = null;
        this.ondblclick = null;
        this.ondrag = null;
        this.onresize = null;
        this.onidle = null;
        this.onidleout = null;
        
        // Initialize interaction handler
        this.interaction = null;
        this.multiElementDrag = false;
        this.doubleClickTimeout = 500;
        this.dragTimeout = 25;
        this.dumpOutlet = 1;
        this.drawDelay = 20;
        
        // parameters
        this.parameters = new Map();
        this.paramDependencyGraph = null;

        //colors
        this.colors = new Map();

        //elements
        this._numElements = 1;
        this._elements = new Map();
        this.layout = null

        //config
        this.dumpOutlet = 1;
        this.drawDelay = 20;
    
        //api
        this._messageHandlers = {
            bang: () => {
                this._redraw();
            },
            redraw: () => {
                this._redraw();
            },
            set: (args) => {
                // Check if it's a color first
                if (this.colors.has(args[0])) {
                    return this.setColor(args[0], args.slice(1));
                }
                // Otherwise treat as parameter
                this.setParameter(0, args[0], args.slice(1));
            },
            get: (args) => {
                // Check if it's a color first
                if (this.colors.has(args[0])) {
                    return this.getColor(args[0]);
                }
                // Otherwise treat as parameter
                return this.getParameter(0, args[0]);
            }
        };

        if(config.config) {
            this._initializeV8uiConfig(config.config);
        }

        if(config.parameters) {
            this._initializeParameters(config.parameters);
        }

        if(config.colors) {
            this._initializeColors(config.colors);
        }

        if(config.interactions) {
            this._initializeInteractions(config.interactions);
        }

        this._initializeElements();
        

        this._active = config.active || true;

        this._redrawTask = new Task(function() {
            if (this.active) {
                mgraphics.redraw();
            }
            this._pendingChanges.clear();
        }.bind(this), this);
        this._pendingChanges = new Set();
    }

    /**
     * @param {boolean} active
     */
    set active(active) {
        this._active = Boolean(active);
        // Update all colors to greyscale when inactive
        for (const color of this.colors.values()) {
            color.setGreyscale(!this._active);
        }
    }

    get active() {
        return this._active;
    }

    get dim() {
        const rect = this.maxObj.box.rect;
        return [rect[2] - rect[0], rect[3] - rect[1]];
    }

    get aspect() {
        const dim = this.dim;
        return dim[0] / dim[1];
    }

    get elements() {
        return this._numElements;
    }

    set elements(value) {
        const oldCount = this._numElements;
        
        // If we need more elements, create them
        if (value > oldCount) {
            for (let i = oldCount; i < value; i++) {
                this._elements.add(this._createElement());
            }
        }
        this.layout.elements(value);
    }

    set draw(draw) {
        if (typeof draw !== 'function') {
            throw new Error('draw must be a function or null');
        }
        this._draw = draw;
    }

    get draw() {
        return this._draw;
    }

    _initializeParameters(parameters) {
        // First create the dependency graph
        this.paramDependencyGraph = new DependencyGraph(parameters);
        
        // Get parameters in processing order (dependencies first)
        const orderedParams = this.paramDependencyGraph.getProcessingOrder();
        
        // Initialize parameters in dependency order
        for (const name of orderedParams) {
            this.parameters.set(name, parameters[name]);
        }

        // Now set initial values from object args
        this.setParametersFromObject(this.getObjectArgs());
    }

    _initializeColors(colors) {
        for (const [name, id] of Object.entries(colors)) {
            this.colors.set(name, new DynamicColor(id));
        }
    }

    _initializeInteractions(interactions) {
        this.interaction = new Interaction(this);

        const validInteractions = ['onclick', 'ondblclick', 'ondrag', 'onresize', 'onidle', 'onidleout'];
        
        // Validate each interaction
        for (const [key, value] of Object.entries(interactions)) {
            if (!validInteractions.includes(key)) {
                throw new Error(`Invalid interaction: ${key}. Valid interactions are: ${validInteractions.join(', ')}`);
            }
            if (value !== null && typeof value !== 'function') {
                throw new Error(`Interaction ${key} must be a function or null`);
            }
        }

        // Initialize valid interactions
        this.onclick = interactions.onclick || null;
        this.ondblclick = interactions.ondblclick || null;
        this.ondrag = interactions.ondrag || null;
        this.onresize = interactions.onresize || null;
        this.onidle = interactions.onidle || null;
        this.onidleout = interactions.onidleout || null;
    }

    _initializeElements() {
        for(let i = 0; i < this._numElements; i++) {
            this._createElement();
        }

        this.layout = new Layout(this, Array.from(this._elements.values()));
    }

    _initializeV8uiConfig(config) {
        // Validate and set interactionTimeout
        if (typeof config.doubleClickTimeout === 'number' && config.doubleClickTimeout >= 0) {
            this.doubleClickTimeout = config.doubleClickTimeout;
        }

        // Validate and set dragTimeout
        if (typeof config.dragTimeout === 'number' && config.dragTimeout >= 0) {
            this.dragTimeout = config.dragTimeout;
        }

        // Validate and set dumpOutlet
        if (typeof config.dumpOutlet === 'number' && Number.isInteger(config.dumpOutlet) && config.dumpOutlet >= 0) {
            this.dumpOutlet = config.dumpOutlet;
        }

        // Validate and set multiElementDrag
        if (typeof config.multiElementDrag === 'boolean') {
            this.multiElementDrag = config.multiElementDrag;
        }

        // Validate and set _numElements
        if (typeof config.elements === 'number' && Number.isInteger(config.elements) && config.elements > 0) {
            this._numElements = config.elements;
        }
    }

    getColor(name) {
        if (!this.colors.has(name)) {
            throw new Error(`Color ${name} not found in color definitions`);
        }
        return this.colors.get(name).getRGBA();
    }

    setColor(name, value) {
        if (!this.colors.has(name)) {
            throw new Error(`Color ${name} not found in color definitions`);
        }
        this.colors.get(name).setId(value);
        return this.colors.get(name).getRGBA();
    }

    _redraw() {
        if(this.drawDelay > 0) {
            // Cancel any existing scheduled task
            this._redrawTask.cancel();
            // Schedule the change task to run after a short delay
            if(this.active) {
                this._redrawTask.schedule(this.drawDelay);
            }
        } else {
            this._redrawTask.execute();
        }
    }

    _notifyParameterChange(elementId, paramName) {
        this._pendingChanges.add(`${elementId}:${paramName}`);
        this._redraw();
    }

    _createElement() {
        const id = `element_${this._elements.size}`;
        const element = new V8uiElement(id, this);
        this._elements.set(id, element);
        return element;
    }

    paint() {
        for (const element of this._elements.values()) {
            element.paint();
        }
    }

    getParameter(elementId, paramName) {
        const element = this._elements.get(`element_${elementId}`);
        if (!element) {
            throw new Error(`Element ${elementId} not found`);
        }
        return element.getParameter(paramName);
    }

    setParameter(elementId, paramName, value) {
        // Validate parameter exists
        if (!this.parameters.has(paramName)) {
            throw new Error(`Parameter ${paramName} not found in parameter definitions`);
        }

        // Convert to number and handle 0 as special case
        const id = Number(elementId);
        let valueChanged = false;
        
        if (id === 0) {
            // Set parameter for all elements
            for (const element of this._elements.values()) {
                if (element.setParameter(paramName, value)) {
                    valueChanged = true;
                }
            }
        } else {
            // For non-zero IDs, get element with ID (1-based indexing)
            const element = this._elements.get(`element_${id - 1}`);
            if (!element) {
                throw new Error(`Element ${id} not found`);
            }
            valueChanged = element.setParameter(paramName, value);
        }
    }

    getParameterConfig(paramName) {
        return this.parameters.get(paramName);
    }

    setParametersFromObject(params) {
        for(const [paramName, value] of Object.entries(params)) {
            if(paramName === 'unaddressed') {
                continue;
            } else {
                this.setParameter(0, paramName, value);
            }
        }
    }

    _getRelativePosition(element, x, y) {
        const layout = this.layout.layout;
        const elementIndex = Array.from(this._elements.values()).indexOf(element);
        const elementLayout = layout[elementIndex];
        
        return {
            x: x - elementLayout.x,
            y: y - elementLayout.y
        };
    }

    // Interaction methods that delegate to Interaction class
    interact(message, x, y, button, modifier1, shift, capslock, option, ctrl) {
        this.interaction.interact(message, x, y, button, modifier1, shift, capslock, option, ctrl);
    }

    resize() {
        this.layout.update();
    }

    api(message, ...args) {
        // Handle parameter messages
        if (this.parameters.has(message)) {
            this.setParameter(0, message, args[0]);
            return;
        }

        // Handle color messages
        if (this.colors.has(message)) {
            this.setColor(message, args[0]);
            return;
        }

        // Handle known API commands
        const handler = this._messageHandlers[message];
        if (handler) {
            return handler(args);
        }

        // Handle interaction messages
        this.interaction.interact(message, ...args);
    }

    getObjectArgs() {
        return MaxJsObject.getJsArgs();
    }

}

class Layout {
    constructor(v8ui, elements, mode = 'horizontal') {
        this._v8ui = v8ui;
        this._mode = mode; //'vertical' or 'grid'  or 'horizontal'
        this._elements = elements;

        this.layout = [];

        this.update();
    }

    get elements() {
        return this._elements;
    }

    set elements(elements) {
        this._elements = elements;
        this.update();
    }

    get dim() {
        return this._v8ui.dim;
    }

    get aspect() {
        return this._v8ui.aspect;
    }

    update() {
        let layout = [];
        const width = this.dim[0];
        const height = this.dim[1];

        this._elements.forEach((element, index) => {
            let l = {};
            switch(this._mode) {
                case 'vertical':
                    l = {
                        x: 0,
                        y: index * height / this._elements.length,
                        width: width,
                        height: height / this._elements.length
                    };
                    break;
                case 'grid':
                    l = {
                        x: index % this._elements.length * width / this._elements.length,
                        y: Math.floor(index / this._elements.length) * height / this._elements.length,
                        width: width / this._elements.length,
                        height: height / this._elements.length
                    };
                    break;
                default: //horizontal
                    l = {
                        x: index * width / this._elements.length,
                        y: 0,
                        width: width / this._elements.length,
                        height: height
                    };
                    break;
            }
            layout.push(l);
        });

        if(layout.length > 0) {
            this.layout = layout;
        }
    }

    toCanvasCoords(index, x, y) {
        const l = this.layout[index];
        return [
            Math.floor(x * l.width + l.x),
            Math.floor(y * l.height + l.y)
        ];
    }

    toElementCoords(index, x, y) {
        const l = this.layout[index];
        return [
            (x - l.x) / l.width,
            (y - l.y) / l.height
        ];
    }

    scaleVector(index, x, y, mode = 'both') {
        const l = this.layout[index];
        switch(mode) {
            case 'x':
                return {
                    x: x * l.width,
                    y: y
                };
            case 'y':
                return {
                    x: x,
                    y: y * l.height
                };
            case 'both':
            default:
                return {
                    x: x * l.width,
                    y: y * l.height
                };
        }
    }

    scaleScalar(index, distance) {
        const l = this.layout[index];
        return {
            x: distance * l.width,
            y: distance * l.height
        };
    }

    findElementAtPosition(x, y) {
        for (let i = 0; i < this.layout.length; i++) {
            const l = this.layout[i];
            if (x >= l.x && x <= l.x + l.width &&
                y >= l.y && y <= l.y + l.height) {
                return Array.from(this._v8ui._elements.values())[i];
            }
        }
        return null;
    }

    _getRelativePosition(element, x, y) {
        const elementIndex = Array.from(this._v8ui._elements.values()).indexOf(element);
        const elementLayout = this.layout[elementIndex];
        
        return {
            x: x - elementLayout.x,
            y: y - elementLayout.y
        };
    }
}

class DependencyGraph {
    constructor(parameters) {
        this.graph = {};
        this._buildGraph(parameters);
        this._validateGraph();
    }

    _buildGraph(parameters) {
        // First pass: initialize all nodes
        for (const [paramName, config] of Object.entries(parameters)) {
            this.graph[paramName] = {
                dependencies: [],
                dependants: []
            };
        }

        // Second pass: build dependencies
        for (const [paramName, config] of Object.entries(parameters)) {
            if (config.dependsOn) {
                // Validate that all dependencies exist
                if (!Array.isArray(config.dependsOn)) {
                    throw new Error(`Parameter ${paramName} depends on non-array value ${config.dependsOn}`);
                }
                config.dependsOn.forEach(dep => {
                    if (!this.graph[dep]) {
                        throw new Error(`Parameter ${paramName} depends on non-existent parameter ${dep}`);
                    }
                });
                
                this.graph[paramName].dependencies = config.dependsOn;
                config.dependsOn.forEach(dep => {
                    this.graph[dep].dependants.push(paramName);
                });
            }
        }
    }

    _validateGraph() {
        // Check for circular dependencies
        for (const [paramName, node] of Object.entries(this.graph)) {
            const intersection = node.dependencies.filter(dep => node.dependants.includes(dep));
            if (intersection.length > 0) {
                throw new Error(`Circular dependency detected for parameter ${paramName}: ${intersection.join(', ')}`);
            }
        }
    }
    // Get all dependants recursively for a parameter
    getAllDependants(paramName) {
        if (!this.graph[paramName]) {
            throw new Error(`Parameter ${paramName} does not exist`);
        }

        const visited = new Set();
        const dependants = new Set();

        const traverse = (param) => {
            if (visited.has(param)) return;
            visited.add(param);

            this.graph[param].dependants.forEach(dependant => {
                dependants.add(dependant);
                traverse(dependant);
            });
        };

        traverse(paramName);
        return Array.from(dependants);
    }

    // Get parameters in processing order (dependencies first)
    getProcessingOrder() {
        const visited = new Set();
        const order = [];

        const visit = (param) => {
            if (visited.has(param)) return;
            visited.add(param);

            this.graph[param].dependencies.forEach(dep => visit(dep));
            order.push(param);
        };

        Object.keys(this.graph).forEach(param => visit(param));
        return order;
    }

    // Check if a parameter has any dependencies
    hasDependencies(paramName) {
        if (!this.graph[paramName]) {
            throw new Error(`Parameter ${paramName} does not exist`);
        }
        return this.graph[paramName].dependencies.length > 0;
    }

    // Get all parameters that need to be processed when a parameter changes
    getParametersToProcess(paramName) {
        if (!this.graph[paramName]) {
            throw new Error(`Parameter ${paramName} does not exist`);
        }

        // Get all parameters that need to be processed
        const toProcess = new Set([paramName]);
        const visited = new Set();

        // Recursively collect all dependants
        const collectDependants = (param) => {
            if (visited.has(param)) return;
            visited.add(param);

            this.graph[param].dependants.forEach(dependant => {
                toProcess.add(dependant);
                collectDependants(dependant);
            });
        };

        collectDependants(paramName);

        // Get the processing order for all parameters
        const order = this.getProcessingOrder();
        
        // Return only the parameters that need processing, in the correct order
        return Array.from(toProcess)
            .filter(param => order.includes(param))
            .sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
} 

module.exports.V8ui = V8ui;