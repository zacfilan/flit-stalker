
/**
 * Abstraction of a html-like nodes view area in TransactionSequenceDiagram
 */
class BoundingBox {
    /** The center of the bounding box
     * @type Point
     */
    _center;

    /** private/internal x1 value */
    _x1 = 0;
    /** private/internal y1 value */
    _y1 = 0;
    /** private/internal x2 value */
    _x2 = 0;
    /** private/internal y2 value */
    _y2 = 0;
    /** private/internal width value */
    _width = 0;
    /*  private/internal height value */
    _height = 0;
    /** private/internal padding */
    _padding = 0;
    /** private/internal midpoint x */
    _center = null;
    
    /** (Re-)calcuate the upper-left and lower-right points based on the center,
     * width and height.
    */
    _calcBB() {
        this._x1 = this._center.x - this._width / 2;
        this._y1 = this._center.y - this._height / 2;
    
        this._x2 = this._x1 + this._width;
        this._y2 = this._y1 + this._height;
    }

    /** this is the horizontal center of the bounding box */
    set center(to) {
        this._center = to;
        this._calcBB();
    }

    get center() {
        return this._center;    
    }

    /** Public width */
    get width() {
        return this._width;
    }

    /**
     * Public width -
     * altering width doesn't change the center */ 
    set width(value) {
        this._width = value;
        this._calcBB();
    }

    /** Public height */
    get height() {
        return this._height;
    }
    
    /** 
     * Public height - 
     * altering height doesn't change the center */
    set height(value) {
        this._height = value;
        this._calcBB();
    }

    /** Copy-like constructor
     * @param {BoundingBox} other config object
     */
    constructor(other) {
        this._padding = other._padding ?? 5;
        this._width = other.width;
        this._height = other.height;
        this.center = new Point(other.center.x, other.center.y);
    }

    /**
     * Draw a border around the bounding box
     */
    drawBorder(ctx) {
        ctx.strokeRect(this._x1, this._y1, this._width, this._height);
    }

}

/**
 * Text in a BoundingBox 
 * */
class Label extends BoundingBox {
    /**
     * Copy-like constructor
     * @param {Label} other config object
     */
    constructor(other) {
        super(other);

        /** The text of the label */
        this.text = other.text;
        Label.instances.push(this);
    }

    /**
     * Draw the text and optionally a border
     */
    draw(ctx) {
        // the y-value is the bottem of the text
        // to center this we need to add 1/2 the text height to the midine
        ctx.fillText(this.text, this.center.x, this.center.y);
    }
}
/**
 * The instances of the Label class created
 * @type {Array.<Label>}
 */
Label.instances = [];

/**
 * A swimlane is a vertical line and a label on top
 */
class Swimlane extends Label {
    /** The x-location of the vertical line */

    constructor(other) {
        super(other);
    }

    /** Draw the complete swimlane on the canvas */
    draw(ctx) {
        // draw the Label
        super.draw(ctx);
        
        // draw the verical line
        ctx.beginPath();
        ctx.moveTo(this.center.x, this._y2);
        ctx.lineTo(this.center.x, ctx.canvas.height);
        ctx.stroke();
    }
}

/**
 * @brief Represents a message between two nodes
 *  */
class Message {
    /**
     * Copy-like constructor 
     * @param {Message} other config object
     */
    constructor(other) {
        /** Source node identifier 
         * e.g. "HN-S [417]
        */
        this["Source Scope"] = other["Source Scope"];

        /** Target node identifier
         * e.g. "SN-F [NID 24]",
         */
        this["Target Scope"] = other["Target Scope"];

        /** The timestamp on the message, start time? */
        this.Timestamp = other.Timestamp;

        /** the timestamp as a nnumber */
        this.time = +this.Timestamp.replace(/,/g, '');

        /**
         * The message text <opcode address>
         * e.g. "access 0x20081151BC0"
         */
        this.Message = other.Message;

        /** The starting swimlane of the message 
         * @type Swimlane
        */
        this.start = other.start;

        /** The ending swimlane of the message 
         * @type Swimlane
        */
        this.end = other.end;

        /** The label of the message 
         * @type Label
        */
        this.label = other.label;
    }

    /**
     * Draw the message on the given canvas
     * @param {Canvas} ctx the canvas context
     */
    draw(ctx, startPoint, endPoint) {
        var headlen = 10; // length of head in pixels
        var dx = endPoint.x - startPoint.x;
        var dy = endPoint.y - startPoint.y;
        var angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();

        // draw the label of the message
        this.label.center = new Point( 
            (startPoint.x + endPoint.x) / 2,
            (startPoint.y + endPoint.y) / 2);
        this.label.draw(ctx);

        // draw the timestamp 
        ctx.fillText(this.Timestamp, 50, startPoint.y);
        
        // Draw the arrow head as a filled triangle
        ctx.beginPath();
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(endPoint.x - headlen * Math.cos(angle - Math.PI / 6), endPoint.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endPoint.x - headlen * Math.cos(angle + Math.PI / 6), endPoint.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath(); // Close the path
        ctx.fill(); // Fill the path
    }
}

/** The number of messages in memory
 * these will also be the id's of the messages
 */
Message.count = 0;

/**
 * A message only comes in with one timestamp, i assume that is the start, so
 * the end of the message is this much later
 */
Message.DEFAULT_DURATION = 50;

/**
 * Abstract point in 2D space
 */
class Point {
    /**
     * 
     * @param {*} x 
     * @param {*} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * This is the TransactionSequenceDiagram widget. view and model.
 */
class TransactionSequenceDiagram {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        /** the start sim time of the display window.
         * theis depends on the messages we want to display int he window
         */
        this.startTime = Number.MAX_SAFE_INTEGER;
        
        /** then end sim time of the display window.
         * this depends on the messages we want to display in the window
         */
        this.endTime = Number.MIN_SAFE_INTEGER;

        /** the simtime duration that the display window covers */
        this.timeDuration = this.endTime - this.startTime;

        /** the x-origin for the transactions */
        this.xorigin = 118;

        /** the y-origin for the transatiocns */
        this.yorigin = 50;

        /** The last message added or selected */
        this.lastMessageSelected = null;

        // the width of the cannvas was set in the HTML as 1920
        // the height of the canvas is set in the HTML as 1080
        // and get be referenced from the this.canvas property
        // canvas.width = 1920;
        // canvas.height = 1080;
        this.canvasHeight = this.canvas.height - this.yorigin;
        this.canvasWidth = this.canvas.width - this.xorigin;

        // to map a time to a y locations on the canvas we do
        // y = yorigin + (time - startTime) * yscale;

        /** nodes are the named TransactionSequenceDiagrams 
         * @type {Object.<string, Swimlane>}
        */
        this.swimlanes = {};

        /** the last swimlane added 
         * @type {Swimlane}
        */
        this.lastSwimlaneAdded = null;

        this.node_order = []; // this is the current display order of the nodes

        /** messages are the arrows between the nodes 
         * @type {Array.<Message>}
        */
        this.msgs = [];

        /** Position newly added nodes to the right, so remember the x 
         * coordinate of the last swimlane added */
        this.lastSwimlaneX = this.xorigin;

        this.yscale = 1;

        /** the active swimlane. under the cursor, and or being moved currently */
        /**
         * @type {Swimlane}
         */
        this.activeNode = null;

        let that = this;
        console.log("canvas: " + this.ctx);

        canvas.addEventListener('mousedown', function (event) {
            // Get the mouse position
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            if(that.activeNode instanceof Swimlane) {
                that.mouseDown = true;
                return
            }
        });

        canvas.addEventListener('mouseup', function (event) {
            that.mouseDown = false;
        });

        canvas.addEventListener('mousemove', function (event) {
            if (that.mouseDown) {
                // we are moving a node, only the x-coordinate matters as I move
                // it left or right

                if(event.clientX < that.xorigin + that.activeNode.width / 2) {
                    return; // don't move past the x-origin
                }

                that.activeNode.center.x = event.clientX;
                that.activeNode._calcBB(); // if i only change one this is faster
                
                that.draw();
                return;
            }

            // Get the mouse position
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            //console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            let found = false;
            // is the mouse over a label 
            for (let node of Label.instances) {             // FIXME: use dedicated array for speed?

                //console.log(`${node.label} (${node.bb.x1}, ${node.bb.y1}) - (${node.bb.x1 + node.bb.width}, ${node.bb.y1 + node.bb.height})`);
                // Check if the mouse is within the bounds of the text
                if (node._x1 < mouseX && mouseX < node._x2 &&
                    node._y1 < mouseY && mouseY < node._y2) {

                    // mouse is over this node
                    if (that.activeNode !== node) {
                        // this node is now the active node
                        if (that.activeNode) {
                            // exit the old active node
                            let customEvent = new CustomEvent('canvas_node_exit', {
                                detail: {
                                    node: node,
                                    mouseX: mouseX,
                                    mouseY: mouseY
                                }
                            });
                            canvas.dispatchEvent(customEvent);
                        }
                        // enter the new active node
                        let customEvent = new CustomEvent('canvas_node_enter', {
                            detail: {
                                node: node,
                                mouseX: mouseX,
                                mouseY: mouseY
                            }
                        });
                        canvas.dispatchEvent(customEvent);
                    }
                    // else we are just moving within the active node

                    found = true; // we found the active node
                    break; // no need to look any further
                }
            }

            if (!found && that.activeNode) {
                // we are moving around outside of any node, but one was still
                // marked as active. need to clear that
                let customEvent = new CustomEvent('canvas_node_exit', {
                    detail: {
                        node: that.activeNode,
                        mouseX: mouseX,
                        mouseY: mouseY
                    }
                });
                canvas.dispatchEvent(customEvent);
            }
        });

        canvas.addEventListener('canvas_node_enter', function (event) {
            console.log(`active node`, event.detail.node);
            that.activeNode = event.detail.node;
            
            that.draw();
        });

        canvas.addEventListener('canvas_node_exit', function (event) {
            console.log(`exit node ${event.detail.node.label}`);
            if (that.activeNode == event.detail.node) {
                that.activeNode = null;
            }
            that.draw();
        });

        canvas.addEventListener('canvas_node_mousedown', function (event) {

        });

    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    /**
     * @param {string} label of the node to add
     * @returns 
     */
    addSwimlane(labelText) {
        // FIXME: is a swimlane moves then if it passes last it becomes last 

        // we want the center of the next swimlane to be
        let x = this.lastSwimlaneAdded?._x2 ?? this.xorigin;
        x += TransactionSequenceDiagram.MIN_NODE_SPACING;
        
        let mt = this.ctx.measureText(labelText);

        let swimlane = new Swimlane({
            text: labelText,
            center: new Point(x, this.yorigin - 12 - 5 - 5 - 1 -1),
            width: this.ctx.measureText(labelText).width,
            height: 12 + (2 * 5), // FIXME: hack
        });

        this.swimlanes[labelText] = swimlane;
        
        // record the last one inserted
        this.lastSwimlaneAdded = swimlane;

        console.log(`added swimlane`, swimlane);

        return swimlane;
    }

    /**
     * Add a message to the TransactionSequenceDiagram
     * @param {Message} msg the message to add
     */
    addOrUpdateMessage(msg) {
        // FIXME: there is no explict id on the message

        // find the two nodes in the message. 
        // Add them if they don't exist.
        if (!(msg.start = this.swimlanes[msg['Source Scope']])) {
            msg.start = this.addSwimlane(msg['Source Scope']);
        }
        if (!(msg.end = this.swimlanes[msg['Target Scope']])) {
            msg.end = this.addSwimlane(msg['Target Scope']);
        }

        // update the time range of the diagram
        msg.time = +msg.Timestamp.replace(/,/g, '');
        if(msg.time < this.startTime) {
            this.startTime = msg.time;
        }
        if(this.endTime < msg.time) {
            this.endTime = msg.time;
        }
        this.timeDuration = (this.endTime - this.startTime) || 100; // FIXME: edge case

        msg.label = new Label({
            text: msg.Message,
            center: new Point(
                (msg.start.center.x + msg.end.center.x) / 2,
                (msg.time + msg.time + Message.DEFAULT_DURATION) / 2), // FIXME: duration is a hack!!
            width: this.ctx.measureText(msg.Message).width,
            height: 12 + (2 * 5), // FIXME: hack
        });

        let message = new Message(msg);
        this.lastMessageSelected = message;
        this.msgs[Message.count++] = message;
        console.log(`added message`, message);

        this.draw();
    }

    // this draws the axis' of the grid
    drawAxis() {
        this.ctx.strokeStyle = TransactionSequenceDiagram.axisColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.yorigin);
        this.ctx.lineTo(this.ctx.canvas.width, this.yorigin);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.xorigin, 0);
        this.ctx.lineTo(this.xorigin, this.ctx.canvas.height);
        this.ctx.stroke();
    }

    // this redraws the whole canvas
    draw() {
        this.clear();
        this.drawAxis();

        if(this.activeNode) {
            this.ctx.strokeStyle = TransactionSequenceDiagram.activeNodeColor;
            this.ctx.fillStyle = TransactionSequenceDiagram.activeNodeColor;
            this.activeNode.draw(this.ctx);
            this.activeNode.drawBorder(this.ctx);
        }

        this.ctx.strokeStyle = TransactionSequenceDiagram.color;
        this.ctx.fillStyle = TransactionSequenceDiagram.color;

        for (let swimlane of Object.values(this.swimlanes)) {
            if(swimlane === this.activeNode) {
                continue;
            }
            swimlane.draw(this.ctx);
        }

        for (let msg of this.msgs) {
            let y = 
                this.yorigin 
                + 50 // leave pad at top
                + ((msg.time - this.startTime)/this.timeDuration) 
                    * (this.canvasHeight - 100) 
                     this.yscale;
            // from here...
            let startPoint = new Point(
                msg.start.center.x, 
                y,
            );
            //.. to here
            let endPoint = new Point(
                msg.end.center.x, 
                y
            );

            if(msg === this.lastMessageSelected) {
                this.ctx.strokeStyle = TransactionSequenceDiagram.activeNodeColor;
                this.ctx.fillStyle = TransactionSequenceDiagram.activeNodeColor;
                // scroll so we can see the message
                this.canvas.parentElement.scrollTop = y - 100;
                this.lastMessageSelected = null;
            }
            else {
                this.ctx.strokeStyle = TransactionSequenceDiagram.color;
                this.ctx.fillStyle = TransactionSequenceDiagram.color;
            }

            msg.draw(this.ctx, startPoint, endPoint);

        }

    }

    // zooming in 
    zoomIn() {
        // when i zoom in time differences appear larger
        // i effectively stretch the y-axis
        this.yscale *= 2;
        this.draw();
    }

    zoomOut() {
        // when i zoom out the large difference become smaller
        // i effectively contract the y-axis
        this.yscale *= .5;
        this.draw();
    }
}

/** How close nodes are allowed to be */
TransactionSequenceDiagram.MIN_NODE_SPACING = 100;

/** default text color */
TransactionSequenceDiagram.color = '#e4e4e4';

/** color of the axis */
TransactionSequenceDiagram.axisColor = '#93a1a1';

/** the default background color of the sequence diagram */
TransactionSequenceDiagram.backgroundColor = '#00252e';

TransactionSequenceDiagram.activeNodeColor = '#689500';

export { TransactionSequenceDiagram };