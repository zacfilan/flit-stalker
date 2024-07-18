import {TransactionSequenceDiagram} from './transaction-sequence-diagram.js';

let xsd = new TransactionSequenceDiagram(0, 100, $("#swimlane")[0]);
xsd.draw();

$("#menu").kendoMenu({
    openOnClick: true
});

$("#toolbar").kendoToolBar({
    items: [
        { type: "button", text: "ZoomIn", click: x => xsd.zoomIn() },
        { type: "button", text: "ZoomOut", click: x => xsd.zoomOut() },
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

// FIXME: this does load the who 11MB into memory, but the bottleneck is the rendering
// the paging fixes that.
$.getJSON('messages.json', function(data) {
    $("#grid").kendoGrid({
        columns: [
            { field: "Message" },
            { field: "Source Scope" },
            { field: "Target Scope" },
            { field: "Timestamp" }
        ],
        dataSource: {
            data: data,
            pageSize: 50
        },
        pageable: true,
        resizable: true,
        selectable: "row",
        change: function(e) {
            var selectedRows = this.select();
            var dataItem = this.dataItem(selectedRows[0]);
            console.log(dataItem);
            xsd.addOrUpdateMessage(dataItem);
        }
    });
});
