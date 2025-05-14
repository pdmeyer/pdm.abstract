const PARAM_TYPES = Object.freeze({
    BLOB: 'blob',
    ARRAY: 'array',
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    STRING: 'string',
    FUNCTION: 'function',
    DICTIONARY: 'dictionary'
});

/**
 * Error handling utility
 */
const ErrorHandler = {
    error: (message, ...args) => {
        error(jsarguments[0], message, ...args, '\n');
    },
    warn: (message, ...args) => {
        post(jsarguments[0], message, ...args, '\n');
    }
};

class Parameter {
    constructor(name, definition, element) {
        this.name = name;
        this.element = element;
        this.definition = definition;
        
        // Initialize properties from definition
        this.type = definition.type || PARAM_TYPES.BLOB;
        this.defaultValue = definition.default;
        this.enum = definition.enum;
        this.useEnumIndex = definition.useEnumIndex || false;
        this.echo = definition.echo || false;
        this.processor = definition.processor;
        this._dependents = new Set();
        
        // Create bound context for processor
        this._context = {
            param: (name) => this.element.getParameter(name),
        };
        
        // Initialize value with processor if defined
        this._value = this.processor ? this.processor.call(this._context, this.defaultValue) : this.defaultValue;
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        const processedValue = this._processValue(newValue);
        if (processedValue !== this._value) {
            this._value = processedValue;
            this._notifyDependents();
            if (this.echo) {
                this._outputEcho();
            }
            return true;
        }
        return false;
    }

    _processValue(value) {
        // Type conversion
        value = this._handleType(value);
        
        // Enum validation
        value = this._lookupEnum(value);
        
        // Range validation for numbers
        if (this.type === PARAM_TYPES.NUMBER) {
            if (this.definition.min !== undefined) value = Math.max(this.definition.min, value);
            if (this.definition.max !== undefined) value = Math.min(this.definition.max, value);
        }

        // Apply processor function if exists
        if (this.processor) {
            value = this.processor.call(this._context, value);
        }

        return value;
    }

    _handleType(value) {
        switch (this.type) {
            case PARAM_TYPES.ARRAY:
                return Array.isArray(value) ? value : [value];
            case PARAM_TYPES.BLOB:
                return value;
            case PARAM_TYPES.BLOB:
                return value;
            case PARAM_TYPES.BOOLEAN:
                return !!Number(value);
            case PARAM_TYPES.NUMBER:
                return Number(value);
            case PARAM_TYPES.STRING:
                return String(value);
            case PARAM_TYPES.DICTIONARY:
                const dictName = value[0] === 'dictionary' ? value[1] : value[0];
                const d = new Dict(dictName);
                return JSON.parse(d.stringify());
            default:
                return value;
        }
    }

    _lookupEnum(value) {
        if (this.enum !== null && this.enum !== undefined) {
            if (!this.useEnumIndex) {
                if (this.enum.indexOf(value) === -1) {
                    ErrorHandler.error(
                        `${this.constructor.name}.lookupEnum: value ${value} is not in enum ${this.enum} for parameter ${this.name}. Using default value ${this.defaultValue}`
                    );
                    return this.defaultValue;
                }
            } else {
                if (value < 0 || value >= this.enum.length) {
                    ErrorHandler.error(
                        `${this.constructor.name}.lookupEnum: value ${value} is not in enum range for parameter ${this.name}. Using default value ${this.defaultValue}`
                    );
                    return this.defaultValue;
                }
                return this.enum[value];
            }
        }
        return value;
    }

    addDependent(dependent) {
        this._dependents.add(dependent);
    }

    _notifyDependents() {
        for (const dependent of this._dependents) {
            dependent.recalculate();
        }
        // Trigger canvas redraw after all dependent parameters are updated
        if (this.element.v8ui.maxObj && typeof this.element.v8ui.maxObj.mgraphics !== 'undefined') {
            this.element.v8ui.maxObj.mgraphics.redraw();
        }
    }

    recalculate() {
        if (this.processor) {
            this.value = this.processor(this._value, this.element.getAllParameters());
        }
    }

    _outputEcho() {
        let v = this.value;
        if (this.type === PARAM_TYPES.DICTIONARY) {
            const d = new Dict();
            d.parse(JSON.stringify(this.value));
            v = ['dictionary', d.name];
        }
        outlet(this.element.v8ui.dumpOutlet, this.name, v);
    }
}

exports.Parameter = Parameter; 