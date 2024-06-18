// Abstraction of the text name of the node at the top
// of a swim lane
class MeshNode {
    constructor({label = '', x = 0, measureText} = {})
    {
        this.label = label;
        // this 
        this.x = x;
        
        // will be calculated once the text is drawn
        this.measureText = measureText;

        // calc the bounding box
        this.textWidth = measureText.width;
        this.textHeight = 12;//parseInt(this.ctx.font, 10); // assuming the font size is the first value in the font string
        let padding = 5; // padding around the text
        this.bb = {
            width: this.textWidth + 2 * padding,
            height: this.textHeight + 2 * padding,
            
            // should be constant, until I allow stacking
            y1: 40 - 10*2 - 2*padding
        };
        this.calcBB();
        console.log(`${this.label} is ${this.bb.width}x${this.bb.height}`);
    }

    // calculate x1 of the bounding box
    calcBB() {
        this.bb.x1 = this.x - this.textWidth/2 -2;
    }
}

/**
 * Represents the start or end of a message.
 */
class MessageEndpoint {
    constructor({node, time}) {
        this.node = node;
        this.time = time;
    }
}

/**
 * Represents a message between two nodes.
 */
class Message {
    constructor({id, start, end}) {
        this.id = id;

        // start NODE of the message (x=const line)
        this.start = new MessageEndpoint(start);

        // end NODE of the message (x=const line)
        this.end = new MessageEndpoint(end);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Swimlane {
    constructor(startTime, endTime, canvas) {
        this,canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        this.startTime = startTime;
        this.endTime = endTime;
        this.timeDuration = endTime - startTime;

        console.log("canvas: " + this.ctx);

        this.nodes = [];
        this.msgs = [];
        this.xorigin = 118;
        this.yorigin = 40;
        this.yscale = 1;
        
        let that = this;
        canvas.addEventListener('mousemove', function(event) {
            // Get the mouse position
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            console.log(`Mouse down at (${mouseX}, ${mouseY})`);

            for(let node of that.nodes) {
                console.log(`${node.label} (${node.bb.x1}, ${node.bb.y1}) - (${node.bb.x1 + node.bb.width}, ${node.bb.y1+node.bb.height})`);
                // Check if the mouse is within the bounds of the text
                if ( node.bb.x1 < mouseX && mouseX < node.bb.x1 + node.bb.width && 
                     node.bb.y1 < mouseY && mouseY < node.bb.y1 + node.bb.height) {

                    that.drawBorder(node);
                    console.log(`Mouse down on ${node.label}`);
                }
            }
        });
    }

    drawBorder(node) {
        this.ctx.strokeRect(node.bb.x1, node.bb.y1, node.bb.width, node.bb.height);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    addNode({label, x}) {
        // rebase the x coordinate to the new origin
        x += this.xorigin;
        let measureText = this.ctx.measureText(label);
        let mn = new MeshNode({label, x, measureText});
       this.nodes.push(mn);
        return mn
    }

    addMessage({id, start, end}) {
        let startep = new MessageEndpoint(start)
        let endep = new MessageEndpoint(end)
        this.msgs.push(new Message({id, start: startep, end: endep}));
    }

    drawNode(node) {
        this.ctx.beginPath();
        this.ctx.moveTo(node.x, this.yorigin+1);
        this.ctx.fillText(node.label, node.x, this.yorigin - 17.25);
        this.ctx.lineTo(node.x, this.ctx.canvas.height);
        this.ctx.strokeStyle = '#1e6b65';
        this.ctx.fillStyle = '#1e6b65';
        this.ctx.stroke();
    }

    drawMessage(msg) {
        let startPoint = new Point(msg.start.node.x, this.yorigin + msg.start.time/this.yscale);
        let endPoint = new Point(msg.end.node.x, this.yorigin+msg.end.time/this.yscale);

        console.log(startPoint);
        console.log(endPoint);

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

        // Draw the arrow head as a filled triangle
        this.ctx.beginPath();
        this.ctx.moveTo(endPoint.x, endPoint.y);
        this.ctx.lineTo(endPoint.x - headlen * Math.cos(angle - Math.PI / 6), endPoint.y - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(endPoint.x - headlen * Math.cos(angle + Math.PI / 6), endPoint.y - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath(); // Close the path
        this.ctx.fill(); // Fill the path
    }

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

    draw() {
        this.clear();

        this.ctx.strokeStyle = '#93a1a1';
        this.drawAxis();
        for (let node of this.nodes) {
            this.drawNode(node);
        }
        
        for (let msg of this.msgs) {
            this.drawMessage(msg);
        }
 
    }

    zoomIn() {
        this.yscale *= 1.1;
        this.draw();
    }

    zoomOut() {
        this.yscale *= .9;
        this.draw();
    }
}

export { Swimlane, Point, MeshNode , Message};