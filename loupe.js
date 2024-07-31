import {TransactionSequenceDiagram} from './transaction-sequence-diagram.js';
import {Flit, FlitField} from './flit.js';
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

/** decoders for different types of flit 
 * @type {Object.<string, Flit.Decoder>}
 */
let flitDecoders = {};

// FIXME: this does load the who 11MB into memory, but the bottleneck is the rendering
// the paging fixes that.
$.getJSON('ambaviz_messages.json')
    .done(function(data) {
        let startTime = +(data.messages[0].Timestamp.replace(/,/g, ''));
        let endTime = +(data.messages[data.messages.length - 1].Timestamp.replace(/,/g, ''));

        let xsd = new TransactionSequenceDiagram(
            startTime,
            endTime,
            $("#swimlane-header")[0], 
            $("#swimlane")[0]
        );

        xsd.timescale = data.timescale;

        // //FIXME: should I dump them all?
        // let count = 0;
        // for(let msg in data.messages) {
        //     xsd.addOrUpdateMessage(data.messages[msg]);
        // }

        // xsd.draw();
        
        // consume and build up the decoders
        Object.entries(data.decoders).forEach( ([name, fieldDecoderArray]) => {
            flitDecoders[name] = new Flit(fieldDecoderArray);
        });

        let flitGrid = $("#flit-grid").kendoGrid({
            columns: [
                { field: "Field" },
                { field: "Bits" },
                { field: "Number" },
                { field: "Decoded" }
            ],
            resizable: true,
        }).data("kendoGrid");

        $("#grid").kendoGrid({
            columns: [
                { field: "Message" },
                { field: "Source Scope" },
                { field: "Target Scope" },
                { field: "Timestamp" }
            ],
            dataSource: {
                data: data.messages,
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

                let decoded = flitDecoders[dataItem.decoder];
                decoded.value = BigInt(dataItem.flit);
                flitGrid.dataSource.data(decoded.fields);
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
