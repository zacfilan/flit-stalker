import {Swimlane, MeshNode, Message} from './swimlane.js';

let sl = new Swimlane(0, 100, $("#swimlane")[0]);

let n1 = sl.addNode({label: "Node 0", x: 10});
let n2 = sl.addNode({label: "Node 1", x: 50});

sl.addMessage({
    id: "ReadUnique 0x20080000000", 
    start: {node: n1, time: 0}, 
    end: {node: n2, time: 55}
});
sl.addMessage({
    id: "ReadUnique 0x20081111111", 
    start: {node: n1, time: 40}, 
    end: {node: n2, time: 60}
});
sl.addMessage({
    id: "ReadUnique 0x20082222222", 
    start: {node: n1, time: 20}, 
    end: {node: n2, time: 70}
});

sl.draw();

$("#menu").kendoMenu({
    openOnClick: true
});

$("#toolbar").kendoToolBar({
    items: [
        { type: "button", text: "ZoomIn", click: x => sl.zoomIn() },
        { type: "button", text: "ZoomOut", click: x => sl.zoomOut() },
        { type: "splitButton", text: "SplitButton", menuButtons: [{text: "Option 1"}, {text: "Option 2"}] }
    ]
});

$("#hSplitter").kendoSplitter({
orientation: "horizontal"
});

$("#leftVSplitter").kendoSplitter({
orientation: "vertical"
});

$("#tabstrip").kendoTabStrip({
});

$("#grid").kendoGrid({
columns: [
    { field: "Message" },
    { field: "Source Scope" },
    { field: "Target Scope" },
    { field: "Timestamp" }
],
dataSource: [
    { Message: "Jane Doe", age: 30},
    { Message: "John Doe", age: 33},
]
});


