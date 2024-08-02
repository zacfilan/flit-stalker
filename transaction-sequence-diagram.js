
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
    draw(hctx, ctx) {
        // draw the Label
        super.draw(hctx);
        // Create a horizontal linear gradient

        ctx.lineWidth = 10; // Set the stroke width to 5 pixels
        var gradient = ctx.createLinearGradient(this.center.x - ctx.lineWidth / 2, 0, this.center.x + ctx.lineWidth / 2, 0);

        // Add color stops
        gradient.addColorStop(0, '#0e4242'); // Start color
        gradient.addColorStop(0.5, '#2b7a74'); // Middle color
        gradient.addColorStop(1, '#0e4242'); // End color

        // Apply the gradient to the stroke style
        ctx.strokeStyle = gradient;

        // Draw the vertical line
        ctx.beginPath();
        ctx.moveTo(this.center.x, 0);
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
        this.time = this.Timestamp;
        this.endTs = other.endTs; // a number

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

        this.id = other.id;
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

        // Draw the arrow head as a filled triangle
        ctx.beginPath();
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(endPoint.x - headlen * Math.cos(angle - Math.PI / 6), endPoint.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endPoint.x - headlen * Math.cos(angle + Math.PI / 6), endPoint.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath(); // Close the path
        ctx.fill(); // Fill the path

        // draw the label of the message
        ctx.fillStyle = '#c9c9bb';
        this.label.center = new Point(
            (startPoint.x + endPoint.x) / 2,
            (startPoint.y + endPoint.y) / 2);
        this.label.draw(ctx);

        // FIXME:
        // This will go into another element
        // // draw the timestamp 
        // ctx.fillText(this.Timestamp, 50, startPoint.y);


    }
}

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
    constructor(startTime, endTime, hcanvas, canvas) {
        this.hctx = hcanvas.getContext('2d');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        for (let ctx of [this.ctx, this.hctx]) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
        }

        /** the timescale of the sime */
        this.timescale = null;

        this.canvasSetTime(startTime, endTime);

        /** the x-origin for the transactions */
        this.xorigin = 0;

        /** the y-origin for the transatiocns */
        this.yorigin = 0;

        /** Used to detect if a label is being hovered over */
        this.hoveredMsg = null;

        // there can be only one selected message at a time
        this.selectedMessageId = null;

        // the width of the cannvas was set in the HTML as 1920
        // the height of the canvas is set in the HTML as 1080
        // and get be referenced from the this.canvas property
        // canvas.width = 1920;
        // canvas.height = 1080;
        this.canvasHeight = this.canvas.height;
        this.canvasWidth = this.canvas.width - this.xorigin;

        // to map a time to a y locations on the canvas we do
        // y = (time - startTime) * yscale;

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
        this.activeSwimlane = null;

        let that = this;
        console.log("canvas: " + this.ctx);

        let isThrottled = false;
        let delay = 100; // milliseconds






        $(document).ready(function () {
            const draggable = document.getElementById('time-trough');
            let startY = 0;
            let currentY = 0;
            let isDragging = false;
            let highlightDiv = null;
            let draggableRect;
            let zoomTop;
            let zoomHeight;


            that.handleMouseMoves(that.canvas);

            // Event listener for mouse down
            draggable.addEventListener('mousedown', (e) => {
                // Get the top offset of the draggable element
                draggableRect = draggable.getBoundingClientRect();
                currentY = e.clientY - draggableRect.top;

                zoomTop = startY = currentY;
                zoomHeight = 0;

                isDragging = true;

                // Create the see-through colored div
                highlightDiv = document.createElement('div');
                highlightDiv.style.position = 'absolute';
                highlightDiv.style.top = zoomTop + 50 + 'px';
                highlightDiv.style.height = '0px';
                highlightDiv.style.width = '100%';
                highlightDiv.style.backgroundColor = 'rgba(0, 128, 0, 0.5)'; // Semi-transparent green
                highlightDiv.style.pointerEvents = 'none'; // Ensure it doesn't interfere with other events

                // Append the highlight div to the #topPane element
                const topPane = document.getElementById('topPane');
                topPane.appendChild(highlightDiv);

                //console.log(`top:${highlightDiv.style.top} height:${highlightDiv.style.height}`);

                // Add event listeners for mouse move and mouse up
                draggable.addEventListener('mousemove', onMouseMove);
                draggable.addEventListener('mouseup', onMouseUp);
            });

            // Function to handle mouse move
            function onMouseMove(e) {
                if (isDragging) {
                    currentY = e.clientY - draggableRect.top;
                    let verticalLength = currentY - startY;

                    // Update the highlight div's position and height
                    zoomTop = Math.min(startY, currentY);
                    zoomHeight = Math.abs(verticalLength);

                    highlightDiv.style.top = zoomTop + 50 + 'px';
                    highlightDiv.style.height = zoomHeight + 'px';

                    //console.log(`top:${highlightDiv.style.top} height:${highlightDiv.style.height}`);
                }
            }

            // Function to handle mouse up
            function onMouseUp(e) {
                isDragging = false;
                draggable.removeEventListener('mousemove', onMouseMove);
                draggable.removeEventListener('mouseup', onMouseUp);

                // zomm into the selected region
                // show everything in here in the unscrolled part of the canvas

                // fix the center line of the selection, that should not have  
                // moved after the zoom.

                // zoom until the top and bottem of the selection would be at
                // top and bottem of the unscrolled part of the canvas with some
                // visual padding left.

                console.log(`top:${zoomTop} height:${zoomHeight}`);

                //Define the filter criteria
                var filter = {
                    logic: "and",
                    filters: [
                        { field: "Timestamp", operator: "gte", value: that.canvasYOffsetToTime(zoomTop) },
                        { field: "Timestamp", operator: "lte", value: that.canvasYOffsetToTime(zoomTop + zoomHeight) }
                    ]
                };

                // Apply the filter to the grid's data source
                $("#grid").data("kendoGrid").dataSource.filter(filter);

                // that.canvasSetTime(
                //     that.canvasYOffsetToTime(zoomTop), 
                //     that.canvasYOffsetToTime(zoomTop + zoomHeight)
                // );

                // Remove the highlight div from the DOM
                if (highlightDiv) {
                    highlightDiv.remove();
                    highlightDiv = null;
                }

                that.draw();

            }

            let cornerElement = document.getElementById('corner');
            let prevScrollTop = 0;

            // adjust the time in the upper left corner as we scroll
            $('#topPane').scroll(function () {
                if (isThrottled) {
                    return;
                }

                let currentScrollTop = $(this).scrollTop();
                if (currentScrollTop === prevScrollTop) {
                    // hscroll
                    return;
                }
                prevScrollTop = currentScrollTop;
                let scrollHeight = this.scrollHeight - this.clientHeight;
                let scrollRatio = currentScrollTop / scrollHeight;

                cornerElement.textContent = Math.trunc(that.startTime +
                    scrollRatio * that.timeDuration).toLocaleString() + "\n" + that.timescale;
                setTimeout(function () {
                    isThrottled = false;
                }, delay);
            });
        });

        hcanvas.addEventListener('mousedown', function (event) {
            // Get the mouse position
            let rect = hcanvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            if (that.activeSwimlane instanceof Swimlane) {
                that.mouseDown = true;
                return
            }
        });

        hcanvas.addEventListener('mouseup', function (event) {
            that.mouseDown = false;
        });

        hcanvas.addEventListener('mousemove', function (event) {
            if (that.mouseDown) {
                // we are moving a node, only the x-coordinate matters as I move
                // it left or right

                if (event.clientX < 118 + that.activeSwimlane.width / 2) {
                    return; // don't move past the x-origin
                }

                that.activeSwimlane.center.x = event.clientX - 118;
                that.activeSwimlane._calcBB(); // if i only change one this is faster

                that.draw();
                return;
            }

            // Get the mouse position
            let rect = hcanvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            //console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            let found = false;
            // is the mouse over a label 
            for (let node of Object.values(that.swimlanes)) {             // FIXME: use dedicated array for speed?

                //console.log(`${node.label} (${node.bb.x1}, ${node.bb.y1}) - (${node.bb.x1 + node.bb.width}, ${node.bb.y1 + node.bb.height})`);
                // Check if the mouse is within the bounds of the text
                if (node._x1 < mouseX && mouseX < node._x2 &&
                    node._y1 < mouseY && mouseY < node._y2) {

                    // mouse is over this node
                    if (that.activeSwimlane !== node) {
                        // this node is now the active node
                        if (that.activeSwimlane) {
                            // exit the old active node
                            let customEvent = new CustomEvent('canvas_node_exit', {
                                detail: {
                                    node: node,
                                    mouseX: mouseX,
                                    mouseY: mouseY
                                }
                            });
                            hcanvas.dispatchEvent(customEvent);
                        }
                        // enter the new active node
                        let customEvent = new CustomEvent('canvas_node_enter', {
                            detail: {
                                node: node,
                                mouseX: mouseX,
                                mouseY: mouseY
                            }
                        });
                        hcanvas.dispatchEvent(customEvent);
                    }
                    // else we are just moving within the active node

                    found = true; // we found the active node
                    break; // no need to look any further
                }
            }

            if (!found && that.activeSwimlane) {
                // we are moving around outside of any node, but one was still
                // marked as active. need to clear that
                let customEvent = new CustomEvent('canvas_node_exit', {
                    detail: {
                        node: that.activeSwimlane,
                        mouseX: mouseX,
                        mouseY: mouseY
                    }
                });
                hcanvas.dispatchEvent(customEvent);
            }
        });

        hcanvas.addEventListener('canvas_node_enter', function (event) {
            console.log(`active node`, event.detail.node);
            that.activeSwimlane = event.detail.node;

            that.draw();
        });

        hcanvas.addEventListener('canvas_node_exit', function (event) {
            console.log(`exit node ${event.detail.node.label}`);
            if (that.activeSwimlane == event.detail.node) {
                that.activeSwimlane = null;
            }
            that.draw();
        });

        hcanvas.addEventListener('canvas_node_mousedown', function (event) {

        });

    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.hctx.clearRect(0, 0, this.hctx.canvas.width, this.hctx.canvas.height);
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

        let mt = this.hctx.measureText(labelText);

        let swimlane = new Swimlane({
            text: labelText,
            center: new Point(x, this.hctx.canvas.height / 2),
            width: this.hctx.measureText(labelText).width,
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
        // find the two nodes in the message. 
        // Add them if they don't exist.
        if (!(msg.start = this.swimlanes[msg['Source Scope']])) {
            msg.start = this.addSwimlane(msg['Source Scope']);
        }
        if (!(msg.end = this.swimlanes[msg['Target Scope']])) {
            msg.end = this.addSwimlane(msg['Target Scope']);
        }

        msg.time = msg.Timestamp;

        msg.label = new Label({
            text: msg.Message,
            center: new Point(
                (msg.start.center.x + msg.end.center.x) / 2,
                (msg.time + msg.time + Message.DEFAULT_DURATION) / 2), // FIXME: duration is a hack!!
            width: this.ctx.measureText(msg.Message).width,
            height: 12 + (2 * 5), // FIXME: hack
        });

        let message = new Message(msg);
        this.selectedMessageId = message.id;
        this.msgs.push(message);
        //console.log(`added message`, message);
        return message;
        //this.draw();
    }

    // FIXME: this only works if the messages thatr are in the duration are
    // always shown
    scrollToMessage(msg) {
        // keep the current duration size, but move the start and end times
        let midPoint = this.duration / 2;
        let newStartTime = msg.time - midPoint; // FIXME: prevent negative
        let newEndTime = newStartTime + this.duration;
        this.canvasSetTime(newStartTime, newEndTime);
    }

    // this draws the axis' of the grid
    drawAxis() {
        this.hctx.strokeStyle = TransactionSequenceDiagram.axisColor;
        this.hctx.beginPath();
        this.hctx.moveTo(0, this.hctx.canvas.height);
        this.hctx.lineTo(this.ctx.canvas.width, this.hctx.canvas.height);
        this.hctx.moveTo(this.xorigin, 0);
        this.hctx.lineTo(this.xorigin, this.hctx.canvas.height);
        this.hctx.stroke();

        this.ctx.strokeStyle = TransactionSequenceDiagram.axisColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.xorigin, 0);
        this.ctx.lineTo(this.xorigin, this.ctx.canvas.height);
        this.ctx.stroke();
    }

    // this redraws the whole canvas
    draw() {
        this.clear();
        this.drawAxis();

        if (this.activeSwimlane) {
            this.hctx.strokeStyle = TransactionSequenceDiagram.activeSwimlaneColor;
            this.hctx.fillStyle = TransactionSequenceDiagram.activeSwimlaneColor;
            this.activeSwimlane.draw(this.hctx, this.ctx);
            this.activeSwimlane.drawBorder(this.hctx);
        }

        this.hctx.strokeStyle = TransactionSequenceDiagram.color;
        this.hctx.fillStyle = TransactionSequenceDiagram.color;

        for (let swimlane of Object.values(this.swimlanes)) {
            if (swimlane === this.activeSwimlane) {
                continue;
            }
            swimlane.draw(this.hctx, this.ctx);
        }

        // only need to draw the messages in the time duration window
        this.ctx.lineWidth = 1;
        for (let msg of this.msgs) {
            let y1 = this.canvasTimeToYOffset(msg.time);
            let y2 = this.canvasTimeToYOffset(msg.endTs);

            let edge = msg.start.center.x <= msg.end.center.x ? 5 : -5;

            // from here...
            let startPoint = new Point(
                msg.start.center.x + edge,
                y1,
            );
            //.. to here
            let endPoint = new Point(
                msg.end.center.x - edge,
                y2
            );

            if (msg === this.hoveredMsg) {
                this.ctx.strokeStyle = TransactionSequenceDiagram.activeSwimlaneColor;
                this.ctx.fillStyle = TransactionSequenceDiagram.activeSwimlaneColor;
                // FIXME: scroll so we can see the message
                // this.canvas.parentElement.parentElement.scrollTop = y1;
                msg.label.drawBorder(this.ctx);
            }
            if(msg.id == this.selectedMessageId) { 
                this.ctx.strokeStyle = TransactionSequenceDiagram.activeSwimlaneColor;
                this.ctx.fillStyle = TransactionSequenceDiagram.activeSwimlaneColor;
            }
            else {
                this.ctx.strokeStyle = TransactionSequenceDiagram.inactiveSwimlaneColor;
                this.ctx.fillStyle = TransactionSequenceDiagram.inactiveSwimlaneColor;
            }
            msg.draw(this.ctx, startPoint, endPoint);


        }

    }

    // zooming in 
    zoomIn() {
        // i want the duration to double so the timescale looks zoomed in by 100%
        let zoom = 1.2; // say 20% each time
        let zoomDuration = this.timeDuration / zoom; // smaller duration means zoom in
        // the start time should be where we are scrolled to
        // for 0 it stays the same
        let newStartTime = this.startTime;
        let newEndTime = this.startTime + zoomDuration;

        var filter = {
            logic: "and",
            filters: [
                { field: "Timestamp", operator: "gte", value: newStartTime },
                { field: "Timestamp", operator: "lte", value: newEndTime }
            ]
        };
        // Apply the filter to the grid's data source
        $("#grid").data("kendoGrid").dataSource.filter(filter);
        console.log("zoom in", this.startTime, this.endTime);
    }

    zoomOut() {
        this.zoomAction = true;
        
        // i want the duration to double so the timescale looks zoomed in by 100%
        let zoom = 1.2; // say 20% each time
        let zoomDuration = this.timeDuration * zoom; // smaller duration means zoom in
        // the start time should be where we are scrolled to
        // for 0 it stays the same
        let newStartTime = this.startTime;
        let newEndTime = this.startTime + zoomDuration;

        let grid = $("#grid").data("kendoGrid");

        // Need to remove the previous timefilter to get full range again
        let currentFilters = grid.dataSource.filter();
        if (currentFilters) {
            // Filter out the filter for the specific column
            currentFilters.filters = currentFilters.filters.filter(function(filter) {
                return filter.field !== 'Timestamp';
            });
        }

        var filter = {
            logic: "and",
            filters: [
                { field: "Timestamp", operator: "gte", value: newStartTime },
                { field: "Timestamp", operator: "lte", value: newEndTime }
            ]
        };

        currentFilters.filters.push(filter);
        
        // Apply the filter to the grid's data source
        this.canvasSetTime(newStartTime, newEndTime);
        grid.dataSource.filter(currentFilters);
        console.log("zoom out", this.startTime, this.endTime);
    }

    // given any 0 based height in pixels in the canvas convert that to
    // a time offset
    canvasYOffsetToTime(offset) {
        return Math.trunc(this.startTime + (parseInt(offset) / this.canvasHeight) * this.timeDuration);
    }

    // inverse of above
    canvasTimeToYOffset(time) {
        return Math.trunc((time - this.startTime) / this.timeDuration * this.canvasHeight);
    }

    /** set the start, end and time duration of the canvas */
    canvasSetTime(startTime, endTime) {
        /** the start sim time of the display window.
         * theis depends on the messages we want to display int he window
         */
        this.startTime = startTime;

        /** then end sim time of the display window.
         * this depends on the messages we want to display in the window
         */
        this.endTime = endTime;

        /** the simtime duration that the display window covers */
        this.timeDuration = this.endTime - this.startTime;

        // now we buffer
        let pad_50 = this.timeDuration / this.canvas.height * 50;
        this.startTime -= pad_50;
        this.endTime += pad_50;
        this.timeDuration = this.endTime - this.startTime;
    }

    handleMouseMoves(canvas) {
        let that = this;
        canvas.addEventListener('mousemove', function (event) {
            // Get the mouse position
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            //console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            let found = false;
            // is the mouse over a label 
            for (let msg of that.msgs) {             // FIXME: use dedicated array for speed?
                let label = msg.label
                //console.log(`${node.label} (${node.bb.x1}, ${node.bb.y1}) - (${node.bb.x1 + node.bb.width}, ${node.bb.y1 + node.bb.height})`);
                // Check if the mouse is within the bounds of the text
                if (label._x1 < mouseX && mouseX < label._x2 &&
                    label._y1 < mouseY && mouseY < label._y2) {

                    // mouse is over this node
//                    console.log("compare that.hoveredMsg", that.hoveredMsg?.text, "label", label.text);

                    if (that.hoveredMsg !== msg) {
                        // this node is now the active node
                        if (that.hoveredMsg) {
                            // exit the old active node
                            let customEvent = new CustomEvent('canvas_node_exit', {
                                detail: {
                                    node: msg,
                                    mouseX: mouseX,
                                    mouseY: mouseY
                                }
                            });
                            canvas.dispatchEvent(customEvent);
                        }
                        // enter the new active node
                        let customEvent = new CustomEvent('canvas_node_enter', {
                            detail: {
                                node: msg,
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

            if (!found && that.hoveredMsg) {
                // we are moving around outside of any node, but one was still
                // marked as active. need to clear that
                let customEvent = new CustomEvent('canvas_node_exit', {
                    detail: {
                        node: that.hoveredMsg,
                        mouseX: mouseX,
                        mouseY: mouseY
                    }
                });
                canvas.dispatchEvent(customEvent);
            }
        });

        canvas.addEventListener('canvas_node_enter', function (event) {
            that.hoveredMsg = event.detail.node;
            console.log("hovered label", that.hoveredMsg.label.text);
            that.draw();
        });

        canvas.addEventListener('canvas_node_exit', function (event) {
            console.log(`exit node ${event.detail.node.label.text}`);
            if (that.hoveredMsg == event.detail.node) {
                that.hoveredMsg = null;
            }
            that.draw();
        });

        canvas.addEventListener('click', function (event) {
            if(that.hoveredMsg) {
                console.log("clicked on", that.hoveredMsg.label.text);
                let grid = $("#grid").data("kendoGrid");

                var dataItem = grid.dataSource.get(that.hoveredMsg.id);
                var row = grid.table.find("tr[data-uid='" + dataItem.uid + "']");
                grid.select(row);
                grid.trigger("change");
            }
        });
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

TransactionSequenceDiagram.activeSwimlaneColor = '#65c7f1';
TransactionSequenceDiagram.inactiveSwimlaneColor = '#699600';


export { TransactionSequenceDiagram };