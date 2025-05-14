"use strict";
autowatch = 1;

const V8ui = require('./pdm.v8ui.js').V8ui;

const config = {
    elements: 1,
    clickTimeout: 250,
    multiElementDrag: false,
    dumpOutlet: 1,
    drawDelay: 20
}

// Define parameters
const parameters = {
    // Number parameter with range and processor
    'number_param': {
        type: 'number',
        default: 25,
        min: 0,
        max: 100,
        processor: (value, params) => value / 100, // Convert to 0-1 range
        echo: true // Output changes to dump outlet
    },

    // Boolean parameter
    'boolean_param': {
        type: 'boolean',
        default: false,
        echo: true
    },

    // Enum parameter with index-based lookup
    'enum_param': {
        type: 'string',
        default: 'circle',
        enum: ['circle', 'square', 'triangle'],
        useEnumIndex: false
    },

    // Array parameter
    'array_param': {
        type: 'array',
        default: [0.5, 0.5]
    },

    // Dictionary parameter
    'dictionary_param': {
        type: 'dictionary',
        default: { enabled: true, mode: 'normal' }
    },

    // Using parameter dependencies
    'boss': {
        type: 'number',
        default: 0,
        min: 0,
        max: 100
    },
    'subordinate': {
        type: 'number',
        default: 0,
        min: 0,
        max: 100,
        dependsOn: ['boss'],
        processor: function(value) {
            // Get boss value using bound param function
            const bossValue = this.param('boss');
            // Calculate and return processed value
            return value * bossValue / 100;
        }
    },
    'grandSubordinate': {
        type: 'number',
        default: 0,
        min: 0,
        max: 100,
        dependsOn: ['boss', 'subordinate'],
        processor: function(value) {
            // Can read both boss and subordinate values
            const bossValue = this.param('boss');
            const subValue = this.param('subordinate');
            // Calculate based on both values
            return value * (bossValue + subValue) / 200;
        }
    }
};

const colors = {
    'on' : 'live_control_selection',
    'off' : 'live_control_zombie'
}

// Create v8ui instance first
const v8ui = new V8ui({
    maxObj: this,
    draw: draw,
    parameters: parameters,
    colors: colors,
    config: config,
    interactions: {
        onclick: click,
        ondblclick: dblclick,
        ondrag: drag,
        onidle: idle,
        onidleout: idleout
    }
});

function draw() {
    // set mgraphics color
    const circleColor = this.param('boolean_param') ? 'on' : 'off';
    this.color(circleColor);

    // get parameters
    const radius = this.param('number_param');
    const shape = this.param('enum_param');

    const center = this.param('array_param');
    const origin = [center[0] - radius, center[1] - radius];

    // get a parameter value
    const {x, y} = this.transform.point(origin[0], origin[1]);
    const dimensions = this.transform.scalar(radius * 2);

    // draw shape based on enum_param
    switch(shape) {
        case 'circle':
            // Draw circle
            mgraphics.ellipse(x, y, dimensions.x, dimensions.y);
            break;
        case 'square':
            // Draw rectangle
            mgraphics.rectangle(x, y, dimensions.x, dimensions.y);
            break;
        case 'triangle':
            // Draw triangle
            const halfWidth = dimensions.x / 2;
            const halfHeight = dimensions.y / 2;
            mgraphics.move_to(x + halfWidth, y);  // Top point
            mgraphics.line_to(x + dimensions.x, y + dimensions.y);  // Bottom right
            mgraphics.line_to(x, y + dimensions.y);  // Bottom left
            mgraphics.close_path();
            break;
    }
    mgraphics.fill();
}

function click(x, y, button, modifier1, shift, capslock, option, ctrl) {
    const b = this.param('boolean_param');
    this.setparam('boolean_param', !b,'\n');
}

function dblclick(x, y, button, modifier1, shift, capslock, option, ctrl) {
    const enumOptions = this.paraminfo('enum_param').enum;
    const currentIndex = enumOptions.indexOf(this.param('enum_param'));
    const nextIndex = (currentIndex + 1) % enumOptions.length;
    const nextValue = enumOptions[nextIndex];
    this.setparam('enum_param', nextValue);
}

function drag(x, y, button, modifier1, shift, capslock, option, ctrl, dragInfo) {
    this.setparam('array_param', [x, y]);
}

function idle(x, y, button, modifier1, shift, capslock, option, ctrl) {
}

function idleout(x, y, button, modifier1, shift, capslock, option, ctrl) {
}








function paint() {
    v8ui.paint();
}

function onclick(x, y, button, modifier1, shift, capslock, option, ctrl) {
    v8ui.interact('click', x, y, button, modifier1, shift, capslock, option, ctrl);
}

function ondrag(x, y, button, modifier1, shift, capslock, option, ctrl) {
    v8ui.interact('drag', x, y, button, modifier1, shift, capslock, option, ctrl);
}

function ondblclick(x, y, button, modifier1, shift, capslock, option, ctrl) {
    v8ui.interact('dblclick', x, y, button, modifier1, shift, capslock, option, ctrl);
}

// function onidle(x, y, button, modifier1, shift, capslock, option, ctrl) {
//     v8ui.interact('idle', x, y, button, modifier1, shift, capslock, option, ctrl);
// }

// function onidleout(x, y, button, modifier1, shift, capslock, option, ctrl) {
//     v8ui.interact('idleout', x, y, button, modifier1, shift, capslock, option, ctrl);
// }

function onresize() {
    v8ui.resize();
}

function bang() {
    mgraphics.redraw();
}

function anything() {  
    v8ui.api(messagename, arrayfromargs(arguments));
}

