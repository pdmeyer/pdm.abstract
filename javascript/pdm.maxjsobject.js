/**
 * @file pdm.maxjsobject.js
 * @description Base class for Max/MSP JavaScript objects with parameter and message handling.
 * Provides common functionality for parsing arguments, handling parameters, and routing messages.
 * 
 * This class serves as the foundation for Max/MSP JavaScript objects, providing:
 * - Argument parsing and validation
 * - Parameter management with callbacks
 * - Message routing and handling
 * - Signature-based argument mapping
 * 
 * @module pdm.maxjsobject  
 */

/**
 * Base class for Max/MSP JavaScript objects
 * @class
 */
class MaxJsObject {
    /**
     * Creates a new MaxJsObject instance
     * @constructor
     */
    constructor() {
        this.args = this.parseJsArgs();
        this.initialized = false;
        this._parameterCallbacks = new Map();
    }

    /**
     * API specification for the object
     * @static
     * @returns {Object} API configuration object
     */
    static get api() {
        return {
            parameters: {
                // Format: 'paramName': { 
                //     required: true|false, 
                //     default: value,
                //     callback: 'methodName' // Optional callback method
                // }
            },
            messages: {
                // Format: 'messageName': { handler: 'methodName', parameters: ['param1', 'param2'] }
            },
            signatures: [
                // Format 1: Simple count-based mapping
                // {
                //     count: number, // Number of unaddressed arguments to match
                //     params: [paramName1, paramName2, ...] // Parameters to map to, in order
                // }
                // 
                // Format 2: Full signature with custom condition
                // {
                //     when: (args) => boolean, // Condition for when to apply this signature
                //     then: {
                //         mappings: {
                //             paramName: index // Map unaddressed argument at index to parameter
                //         },
                //         defaults: {
                //             paramName: value // Default values for parameters not in mappings
                //         }
                //     }
                // }
            ]
        };
    }

    /**
     * Parses Max jsarguments into a structured object
     * @private
     * @returns {Object} Parsed arguments object with grouped and mapped parameters
     */
    parseJsArgs() {
        const argsArray = jsarguments.slice(1);
        const groupedArgs = { unaddressed: [] };
        let currentKey = 'unaddressed';

        // First pass: parse into grouped and unaddressed arguments
        argsArray.forEach((arg) => {
            if (String(arg).indexOf('@') === 0) {
                currentKey = arg.substring(1);
                groupedArgs[currentKey] = [];
            } else {
                if (!groupedArgs[currentKey]) {
                    groupedArgs[currentKey] = [];
                }
                groupedArgs[currentKey].push(arg);
            }
        });

        // Second pass: apply signatures to unaddressed arguments
        if (groupedArgs.unaddressed.length > 0) {
            const api = this.constructor.api;
            if (api.signatures) {
                // Find matching signature
                const matchingSignature = api.signatures.find(signature => {
                    if (signature.count !== undefined) {
                        return signature.count === groupedArgs.unaddressed.length;
                    }
                    return signature.when(groupedArgs);
                });

                if (matchingSignature) {
                    if (matchingSignature.count !== undefined) {
                        // Handle simple count-based mapping
                        // First, collect all values for each parameter
                        const paramValues = {};
                        matchingSignature.params.forEach((paramName, index) => {
                            if (index < groupedArgs.unaddressed.length) {
                                if (!paramValues[paramName]) {
                                    paramValues[paramName] = [];
                                }
                                paramValues[paramName].push(groupedArgs.unaddressed[index]);
                            }
                        });
                        
                        // Then apply the collected values
                        Object.entries(paramValues).forEach(([paramName, values]) => {
                            if (!groupedArgs[paramName]) {
                                groupedArgs[paramName] = values;
                            }
                        });
                    } else {
                        // Handle full signature with custom condition
                        Object.entries(matchingSignature.then.mappings || {}).forEach(([paramName, index]) => {
                            if (index < groupedArgs.unaddressed.length && !groupedArgs[paramName]) {
                                groupedArgs[paramName] = [groupedArgs.unaddressed[index]];
                            }
                        });

                        Object.entries(matchingSignature.then.defaults || {}).forEach(([paramName, value]) => {
                            if (!groupedArgs[paramName]) {
                                groupedArgs[paramName] = [value];
                            }
                        });
                    }
                }
            }
        }

        if (groupedArgs.unaddressed.length === 0) {
            delete groupedArgs.unaddressed;
        }

        // Filter out internal MaxJsObject properties
        const internalProps = new Set([
            'args',
            'initialized',
            '_parameterCallbacks'
        ]);

        const filteredArgs = {};
        Object.entries(groupedArgs).forEach(([key, value]) => {
            if (!internalProps.has(key)) {
                filteredArgs[key] = value;
            }
        });

        return filteredArgs;
    }

    /**
     * Initializes the object from arguments
     * @returns {boolean} True if initialization was successful
     */
    init() {
        if (this.initialized) return true;
        
        // Validate API configuration
        if (this.constructor.api) {
            const api = this.constructor.api;
            
            // Validate handlers in messages
            if (api.messages) {
                for (const [messageName, spec] of Object.entries(api.messages)) {
                    if (spec.handler) {
                        const handler = this[spec.handler];
                        if (typeof handler !== 'function') {
                            error(`Error: Handler '${spec.handler}' for message '${messageName}' is not a function\n`);
                            return false;
                        }
                    }
                }
            }
            
            // Validate handlers in parameters
            if (api.parameters) {
                for (const [paramName, spec] of Object.entries(api.parameters)) {
                    if (spec.handler) {
                        const handler = this[spec.handler];
                        if (typeof handler !== 'function') {
                            error(`Error: Handler '${spec.handler}' for parameter '${paramName}' is not a function\n`);
                            return false;
                        }
                    }
                }
            }
        }
        
        // Validate required parameters
        const requiredParams = Object.entries(this.constructor.api.parameters)
            .filter(([_, spec]) => spec.required)
            .map(([name]) => name);
            
        if (!this.checkRequiredArgs(requiredParams)) {
            error(`Error: Missing required parameters: ${requiredParams.join(', ')}\n`);
            return false;
        }

        // Set parameters from arguments and register callbacks
        Object.entries(this.constructor.api.parameters).forEach(([name, spec]) => {
            const value = this.getArg(name, spec.default);
            if (value !== null) {
                this[name] = value;
                // Register callback if specified
                if (spec.callback && typeof this[spec.callback] === 'function') {
                    this._parameterCallbacks.set(name, this[spec.callback].bind(this));
                }
            }
        });

        this.initialized = true;
        return this._init();
    }

    /**
     * Custom initialization hook for subclasses
     * @protected
     * @returns {boolean} True if initialization was successful
     */
    _init() {
        return true;
    }

    /**
     * Checks if all required arguments are present
     * @private
     * @param {Array<string>} requiredArgs - List of required argument names
     * @returns {boolean} True if all required arguments are present
     */
    checkRequiredArgs(requiredArgs) {
        for (const arg of requiredArgs) {
            if (!this.args[arg] || this.args[arg].length === 0) {
                error(`Error: Missing required argument @${arg}\n`);
                return false;
            }
        }
        return true;
    }

    /**
     * Gets a single argument value
     * @private
     * @param {string} argName - Name of the argument
     * @param {any} defaultValue - Default value if argument is not present
     * @returns {any} Argument value or default
     */
    getArg(argName, defaultValue = null) {
        return this.args[argName] ? this.args[argName][0] : defaultValue;
    }

    /**
     * Gets all values for an argument
     * @private
     * @param {string} argName - Name of the argument
     * @returns {Array} Array of argument values
     */
    getArgValues(argName) {
        return this.args[argName] || [];
    }

    /**
     * Handles parameter changes
     * @private
     * @param {string} paramName - Name of the parameter that changed
     * @param {...any} args - New parameter values
     */
    _handleParameterChange(paramName, ...args) {
        post('Parameter change detected for ', paramName, ' with values: ', args, '\n');
        post('this._parameterCallbacks: ', this._parameterCallbacks, '\n');
        post('this._parameterCallbacks.get(paramName): ', this._parameterCallbacks.get(paramName), '\n');
        const callback = this._parameterCallbacks.get(paramName);
        if (callback) {
            post('Calling callback for ', paramName, '\n');
            callback(args);
        }
    }

    /**
     * Handles incoming messages
     * @param {string} message - Message name
     * @param {...any} args - Message arguments
     */
    anything(message, ...args) {
        const api = this.constructor.api;
        
        // Handle init message
        if (message === 'init') {
            return this.init();
        }
        
        // Check if it's a parameter set
        if (message in api.parameters) {
            this._handleParameterChange(message, ...args);
            return;
        }

        // Check if it's a defined message
        if (message in api.messages) {
            const spec = api.messages[message];
            if (spec.parameters && args.length < spec.parameters.length) {
                error(`Error: Message ${message} requires ${spec.parameters.length} parameters\n`);
                return;
            }
            return this[spec.handler](...args);
        }

        // Handle unknown messages
        this._handleUnknownMessage(message, ...args);
    }

    /**
     * Handles unknown messages
     * @protected
     * @param {string} message - Unknown message name
     * @param {...any} args - Message arguments
     */
    _handleUnknownMessage(message, ...args) {
        error(`Unknown message: ${message}\n`);
    }
}

exports.MaxJsObject = MaxJsObject; 