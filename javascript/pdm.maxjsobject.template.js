// Set up inlets and outlets
inlets = 1;
outlets = 1;
autowatch = 1;

// Import required classes
const MaxJsObject = require('pdm.maxjsobject.js').MaxJsObject;
// Import any other required classes
// const SomeClass = require('some.module.js').SomeClass;

class MyMaxObject extends MaxJsObject {
    // Define the API specification
    static get api() {
        return {
            // Define parameters that can be set via arguments or messages
            parameters: {
                // Required parameters
                requiredParam: { type: 'string', required: true },
                // Optional parameters with defaults
                optionalParam: { type: 'number', required: false, default: 0 },
                // Boolean parameters
                flagParam: { type: 'boolean', required: false, default: false }
            },
            // Define messages that can be sent to the object
            messages: {
                // Simple message with no parameters
                simpleMessage: { handler: 'handleSimpleMessage' },
                // Message with required parameters
                messageWithParams: { 
                    handler: 'handleMessageWithParams',
                    parameters: ['param1', 'param2']
                },
                // Message with optional parameters
                messageWithOptionalParams: {
                    handler: 'handleMessageWithOptionalParams',
                    parameters: ['param1', 'param2?']  // ? indicates optional
                }
            }
        };
    }

    constructor() {
        super();
        // Initialize any instance variables
        this.someState = null;
    }

    // Custom initialization after parameters are set
    _init() {
        try {
            // Initialize your object here using the parameters
            // this.someState = new SomeClass(this.requiredParam, this.optionalParam);
            return true;
        } catch (error) {
            post("Error initializing: ", error.message, "\n");
            return false;
        }
    }

    // Message handlers
    handleSimpleMessage() {
        // Handle the simple message
        // outlet(0, "result", someValue);
    }

    handleMessageWithParams(param1, param2) {
        // Handle message with required parameters
        // outlet(0, "result", param1, param2);
    }

    handleMessageWithOptionalParams(param1, param2) {
        // Handle message with optional parameters
        // param2 will be undefined if not provided
        // outlet(0, "result", param1, param2);
    }

    // Override bang if needed
    bang() {
        // Default behavior when object receives a bang
        // this.handleSimpleMessage();
    }

    // Override unknown message handling if needed
    _handleUnknownMessage(message, ...args) {
        // Custom handling of unknown messages
        // post(`Custom handling of unknown message: ${message}\n`);
        super._handleUnknownMessage(message, ...args);
    }
}

// Create and export instance
const instance = new MyMaxObject();

// Export functions for Max
function init() { return instance.init(); }
function anything() { instance.anything(messagename, ...arrayfromargs(arguments)); }
function bang() { instance.bang(); }
function loadbang() { instance.init(); }