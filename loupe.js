import {TransactionSequenceDiagram} from './transaction-sequence-diagram.js';

$("#menu").kendoMenu({
    openOnClick: true
});



$("#hSplitter").kendoSplitter({
orientation: "horizontal"
});

$("#leftVSplitter").kendoSplitter({
orientation: "vertical"
});

let tabStrip = $("#tabstrip").kendoTabStrip({
}).data("kendoTabStrip");

// FIXME: this does load the who 11MB into memory, but the bottleneck is the rendering
// the paging fixes that.
$.getJSON('ambaviz_messages.json')
    .done(function(data) {
        let startTime = +(data[0].Timestamp.replace(/,/g, ''));
        let endTime = +(data[data.length - 1].Timestamp.replace(/,/g, ''));

        let xsd = new TransactionSequenceDiagram(
            startTime,
            endTime,
            $("#swimlane-header")[0], 
            $("#swimlane")[0]
        );

        // //FIXME: should I dump them all?
        // let count = 0;
        // for(let msg in data) {
        //     xsd.addOrUpdateMessage(data[msg]);
        // }

        // xsd.draw();

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
                xsd.draw();
            },
            dataBound: function(e) {
                // Call the resize method after the grid has been databound
                setTimeout(function() {
                    $(window).resize();
                }, 100);            },
                // the old horrible timeout trickery

            filterable: true
        });

        tabStrip.select(0);

        $("#toolbar").kendoToolBar({
            items: [
                { type: "button", text: "ZoomIn", click: x => xsd.zoomIn() },
                { type: "button", text: "ZoomOut", click: x => xsd.zoomOut() },
                { type: "splitButton", text: "SplitButton", menuButtons: [{text: "Option 1"}, {text: "Option 2"}] }
            ]
        });

    })
    .fail(function(jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.error("Request Failed: " + err);
        alert("Failed to load data: " + err);
    });
