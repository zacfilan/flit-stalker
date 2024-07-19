
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
 * Represents the start point or end point of a message.
 * This is a swimlane and a time.
 */
class MessageBoundary {
    /**
     * @brief Copy-like constructor
     * @param {MessageBoundary} other config object
     */
    constructor(other) {
        /** The swimlane of this message boundary
         * @type Swimlane
        */
        this.swimlane = other.swimlane;

        /** the time */
        this.time = other.time;
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

        /**
         * The message text <opcode address>
         * e.g. "access 0x20081151BC0"
         */
        this.Message = other.Message;

        /** The starting swimlane of the message 
         * @type MessageBoundary
        */
        this.start = other.start;

        /** The ending swimlane of the message 
         * @type MessageBoundary
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
    draw(ctx, yscale, yorigin) {
        // arrow from here..
        let startPoint = new Point(
            this.start.swimlane.center.x, 
            yorigin + (this.start.time * yscale)
        );
        //.. to here
        let endPoint = new Point(
            this.end.swimlane.center.x, 
            yorigin + (this.end.time * yscale)
        );

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
        //this.label.drawBorder(ctx);

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
    constructor(startTime, endTime, canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        this.startTime = startTime;
        this.endTime = endTime;
        this.timeDuration = endTime - startTime;


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

        this.xorigin = 118;
        this.yorigin = 50;

        /** Position newly added nodes to the right */
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
        let startSwimlane;
        let endSwimlane;

        // find the two nodes in the message. 
        // Add them if they don't exist.
        if (!(startSwimlane = this.swimlanes[msg['Source Scope']])) {
            startSwimlane = this.addSwimlane(msg['Source Scope']);
        }
        if (!(endSwimlane = this.swimlanes[msg['Target Scope']])) {
            endSwimlane = this.addSwimlane(msg['Target Scope']);
        }

        /**
         * Startpoint end of the message (x=const vertical line)
         * @type MessageBoundary
         */
        msg.start = new MessageBoundary({
            swimlane: startSwimlane,
            time: +msg.Timestamp 
        });

        /**
         * Endpoint end of the message (x=const vertical line)
         * @type MessageBoundary
         */
        msg.end = new MessageBoundary({
            swimlane: endSwimlane,
            time: +msg.Timestamp + Message.DEFAULT_DURATION
        });

        msg.label = new Label({
            text: msg.Message,
            center: new Point(
                (msg.start.swimlane.center.x + msg.end.swimlane.center.x) / 2,
                (msg.start.time + msg.end.time) / 2),
            width: this.ctx.measureText(msg.Message).width,
            height: 12 + (2 * 5), // FIXME: hack
        });

        let message = new Message(msg);

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
            msg.draw(this.ctx, this.yscale, this.yorigin);
        }

    }

    // zooming in 
    zoomIn() {
        // when i zoom in time differences appear larger
        // i effectively stretch the y-axis
        this.yscale *= 1.1;
        this.draw();
    }

    zoomOut() {
        // when i zoom out the large difference become smaller
        // i effectively contract the y-axis
        this.yscale *= .9;
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