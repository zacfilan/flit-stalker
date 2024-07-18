/**
 * Abstraction of the text name of the node at the top
 * of a swim lane
 * */
class MeshNode {
    /**
     * Copy-like constructor
     * @param {MeshNode} other config object
     */
    constructor(other) {
        this.label = other.label;
        // this 
        this.x = other.x;

        // will be calculated once the text is drawn
        this.measureText = other.measureText;

        // calc the bounding box
        this.textWidth = this.measureText.width;
        this.textHeight = 12;//parseInt(this.ctx.font, 10); // assuming the font size is the first value in the font string
        let padding = 5; // padding around the text
        this.bb = {
            width: this.textWidth + 2 * padding,
            height: this.textHeight + 2 * padding,

            // should be constant, until I allow stacking
            y1: 40 - 10 * 2 - 2 * padding
        };
        this.calcBB();
        this.color = '#1e6b65';
    }

    // calculate x1 of the bounding box
    calcBB() {
        this.bb.x1 = this.x - this.textWidth / 2 - 2;
    }
}

/**
 * Represents the start point or end point of a message.
 */
class MessageBoundary {
    /**
     * @brief Copy-like constructor
     * @param {MessageBoundary} other config object
     */
    constructor(other) {
        /** The node id, used to lookup the node */
        this.node = other.node;

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

        this.start = other.start;
        this.end = other.end;
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


        /** nodes are the named TransactionSequenceDiagrams */
        this.nodes = {};

        this.node_order = []; // this is the current display order of the nodes

        /** messages are the arrows between the nodes */
        this.msgs = [];

        this.xorigin = 118;
        this.yorigin = 40;

        /** Position newly added nodes to the right */
        this.last_node_x = this.xorigin;

        this.yscale = 1;

        /** the node under the cursor */
        this.activeNode = null;

        let that = this;
        console.log("canvas: " + this.ctx);

        canvas.addEventListener('mousedown', function (event) {
            // Get the mouse position
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            if(that.activeNode) {
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
                that.activeNode.x = event.clientX;
                that.activeNode.calcBB();
                that.draw();
                return;
            }

            // Get the mouse position
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            //console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            let found = false;
            // if the mouse over a node?
            for (let node of Object.values(that.nodes)) {             // FIXME: use dedicated array for speed?

                //console.log(`${node.label} (${node.bb.x1}, ${node.bb.y1}) - (${node.bb.x1 + node.bb.width}, ${node.bb.y1 + node.bb.height})`);
                // Check if the mouse is within the bounds of the text
                if (node.bb.x1 < mouseX && mouseX < node.bb.x1 + node.bb.width &&
                    node.bb.y1 < mouseY && mouseY < node.bb.y1 + node.bb.height) {
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

    drawBorder(node) {
        this.ctx.strokeStyle = node.color;
        this.ctx.strokeRect(node.bb.x1, node.bb.y1, node.bb.width, node.bb.height);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    /**
     * 
     * @param {string} label of the node to add
     * @returns 
     */
    addNode(label) {
        let x = (this.last_node_x += TransactionSequenceDiagram.MIN_NODE_SPACING);
        let mn = new MeshNode({
            label,
            x,
            measureText: this.ctx.measureText(label)
        });
        this.nodes[label] = mn;
        console.log(`added node`, mn);

        return mn;
    }

    /**
     * Add a message to the TransactionSequenceDiagram
     * @param {Message} msg the message to add
     */
    addOrUpdateMessage(msg) {
        // FIXME: there is no explict id on the message
        let startnode;
        let endnode;

        // find the two nodes in the message. 
        // Add them if they don't exist.
        if (!(startnode = this.nodes[msg['Source Scope']])) {
            startnode = this.addNode(msg['Source Scope']);
        }
        if (!(endnode = this.nodes[msg['Target Scope']])) {
            endnode = this.addNode(msg['Target Scope']);
        }

        /**
         * Startpoint end of the message (x=const vertical line)
         * @type MessageBoundary
         */
        msg.start = new MessageBoundary({
            node: startnode,
            time: msg.Timestamp
        });

        /**
         * Endpoint end of the message (x=const vertical line)
         * @type MessageBoundary
         */
        msg.end = new MessageBoundary({
            node: endnode,
            time: msg.Timestamp + Message.DEFAULT_DURATION
        });

        this.msgs[Message.count++] = msg;
        console.log(`added message`, msg);
        this.draw();
    }

    // Draw a node at the given x coordinate. This is really just the text label
    // of the node
    drawNode(node) {
        this.ctx.beginPath();

        // this is the text
        this.ctx.strokeStyle = node.color;
        this.ctx.moveTo(node.x, this.yorigin + 1);
        this.ctx.fillText(node.label, node.x, this.yorigin - 17.25);

        if (this.activeNode === node) {
            this.drawBorder(node);
        }

        // this is the TransactionSequenceDiagram below the text
        this.ctx.lineTo(node.x, this.ctx.canvas.height);
        this.ctx.strokeStyle = '#1e6b65';
        this.ctx.fillStyle = '#1e6b65';
        this.ctx.stroke();
    }

    // a message is drawn as an arrow between 2 node TransactionSequenceDiagrams
    drawMessage(msg) {
        let startPoint = new Point(msg.start.node.x, this.yorigin + msg.start.time / this.yscale);
        let endPoint = new Point(msg.end.node.x, this.yorigin + msg.end.time / this.yscale);

        var headlen = 10; // length of head in pixels
        var dx = endPoint.x - startPoint.x;
        var dy = endPoint.y - startPoint.y;
        var angle = Math.atan2(dy, dx);
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x, startPoint.y);
        this.ctx.lineTo(endPoint.x, endPoint.y);
        this.ctx.strokeStyle = '#689500';
        this.ctx.fillStyle = '#689500';
        this.ctx.stroke();

        // draw the label of the message
        this.ctx.fillText(msg.Message, (startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2);

        // Draw the arrow head as a filled triangle
        this.ctx.beginPath();
        this.ctx.moveTo(endPoint.x, endPoint.y);
        this.ctx.lineTo(endPoint.x - headlen * Math.cos(angle - Math.PI / 6), endPoint.y - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(endPoint.x - headlen * Math.cos(angle + Math.PI / 6), endPoint.y - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath(); // Close the path
        this.ctx.fill(); // Fill the path
    }

    // this draws the axis' of the grid
    drawAxis() {

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.yorigin);
        this.ctx.lineTo(this.ctx.canvas.width, this.yorigin);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.xorigin, 0);
        this.ctx.lineTo(this.xorigin, this.ctx.canvas.height);
        this.ctx.stroke();
    }

    // this redraws the whole canvas, us sparingly
    draw() {
        this.clear();

        this.ctx.strokeStyle = '#93a1a1';
        this.drawAxis();
        for (let node of Object.values(this.nodes)) {
            this.drawNode(node);
        }

        for (let msg of this.msgs) {
            this.drawMessage(msg);
        }

    }

    // zooming in 
    zoomIn() {
        this.yscale *= 1.1;
        this.draw();
    }

    zoomOut() {
        this.yscale *= .9;
        this.draw();
    }
}

/** How close nodes are allowed to be */
TransactionSequenceDiagram.MIN_NODE_SPACING = 50;

export { TransactionSequenceDiagram };