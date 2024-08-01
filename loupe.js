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
        let startTime = data.messages[0].Timestamp;
        let endTime = data.messages[data.messages.length - 1].endTs;

        let xsd = new TransactionSequenceDiagram(
            startTime,
            endTime,
            $("#swimlane-header")[0], 
            $("#swimlane")[0]
        );

        xsd.timescale = data.timescale;
        
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

        let msgGrid = $("#grid").kendoGrid({
            columns: [
                { field: "Message" },
                { field: "Source Scope" },
                { field: "Target Scope" },
                {
                    field: "Timestamp", 
                    type: "number", 
                    template: dataItem => dataItem.Timestamp.toLocaleString() },
            ],
            dataSource: {
                data: data.messages,
                pageSize: 50
            },
            pageable: {
                //refresh: true,
                pageSizes: [5, 10, 20, 100],
                //info: true,
                buttonCount: 5,
                //numeric: false,
                alwaysVisible: true // Ensure the pager is always visible
            },
            toolbar: [
                { name: "clearFilters", text: "Clear All Filters" }
            ],
            resizable: true,
            selectable: "row",
            change: function(e) {
                var selectedRows = this.select();
                var dataItem = this.dataItem(selectedRows[0]);
                console.log(dataItem);
                xsd.addOrUpdateMessage(dataItem);
                xsd.draw();

                // when we click on a message in the grid we update the 
                // decoded flit grid
                let decoded = flitDecoders[dataItem.decoder];
                decoded.value = BigInt(dataItem.flit);
                flitGrid.dataSource.data(decoded.fields);
            },
            dataBound: function(e) {
                // Call the resize method after the grid has been databound
                // the old horrible timeout trickery
                setTimeout(function() {
                    $(window).resize();
                }, 10);            
                console.log("dataBound");

                // Access the grid instance
                var grid = this;
                
                // Get the data source
                var dataSource = grid.dataSource;
                
                // Get the data items
                var dataItems = dataSource.view(); // .view() returns the data items for the current page

                xsd.msgs = [];
                xsd.lastSwimlaneAdded = undefined;
                xsd.swimlanes = [];

                let minTime = Number.MAX_SAFE_INTEGER;
                let maxTime = Number.MIN_SAFE_INTEGER;

                // Iterate over the data items
                dataItems.forEach(function(item) {
                    let msg = xsd.addOrUpdateMessage(item); // Process each item as needed
                    if(msg.time < minTime) {
                        minTime = msg.time;
                    }
                    if(msg.endTs > maxTime) {
                        maxTime = msg.endTs;
                    }   
                });

                xsd.canvasSetTime(minTime, maxTime);
                xsd.draw();
    
            },
                

            filterable: true
        }).data("kendoGrid");

        // Attach event handlers to the custom buttons
        $('button[data-role="clearfilters"]').on("click", function() {
            var grid = $("#grid").data("kendoGrid");
            grid.dataSource.filter({});
            console.log("clearing filters");
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
