// Common Max-specific utilities and patterns for JavaScript objects

class MaxJsObject {
    constructor() {
        this.args = this.parseJsArgs();
    }

    // Parse Max jsarguments into an object
    parseJsArgs() {
        const argsArray = jsarguments.slice(1);
        const groupedArgs = { unaddressed: [] };
        let currentKey = 'unaddressed';

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

        if (groupedArgs.unaddressed.length === 0) {
            delete groupedArgs.unaddressed;
        }

        return groupedArgs;
    }

    // Helper to check for required arguments
    checkRequiredArgs(requiredArgs) {
        for (const arg of requiredArgs) {
            if (!this.args[arg] || this.args[arg].length === 0) {
                post(`Error: Missing required argument @${arg}\n`);
                return false;
            }
        }
        return true;
    }

    // Helper to get a single argument value
    getArg(argName, defaultValue = null) {
        return this.args[argName] ? this.args[argName][0] : defaultValue;
    }

    // Helper to get all values for an argument
    getArgValues(argName) {
        return this.args[argName] || [];
    }
}

// Export the class
exports.MaxJsObject = MaxJsObject; 