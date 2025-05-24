class Preset {
    constructor(name, data) {
         this.name = name;
         this.data = data;
    }
    
    update(data) {
        this.data = data;
    }

    updateParam(param, value) {
        data[param] = value;
    }

    
}

class PresetCollection {
    constructor() {
        this.presets = {}
        this.parameters = {}
        this.activePreset = null;
        this.isDirty = false;
    }

    

    static filterHiddenParams(paramsInfo) {
        const VISIBLE_STATES = ['automated', 'storedonly']

        return Object.keys(paramsInfo)
            .filter(param => !VISIBLE_STATES.includes(param.visibility))
    }   
}