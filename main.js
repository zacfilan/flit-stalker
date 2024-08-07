import { TransactionSequenceDiagram } from './transaction-sequence-diagram.js';
import { Flit, FlitField } from './flit.js';

async function main() {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    $("#menu").kendoMenu({
        openOnClick: true,
        select: function(e) {
            var item = $(e.item);
            var text = item.children(".k-link").text();
    
            // Perform actions based on the selected item
            if (text === "About") {
                window.open("https://github.com/zacfilan/flit-stalker", "_blank");
            } 
            else if (text === "Report Issue") {
                window.open("https://github.com/zacfilan/flit-stalker/issues", "_blank");
            }
        }
    });

    $("#hSplitter").kendoSplitter({
        orientation: "horizontal"
    });

    $("#leftVSplitter").kendoSplitter({
        orientation: "vertical"
    });

    $("#tabstrip").kendoTabStrip({
    }).data("kendoTabStrip").select(0);

    let filterOnContainsOnly = {
        operators: {
            string: {
                contains: "Contains",
                doesnotcontain: "Does not contain"
            }
        }
    };

    let msgGrid = $("#grid").kendoGrid({
        columns: [
            { field: "Message", filterable: filterOnContainsOnly },
            { field: "Source Scope", filterable: filterOnContainsOnly },
            { field: "Target Scope", filterable: filterOnContainsOnly },
            {
                field: "Timestamp",
                type: "number",
                template: dataItem => dataItem.Timestamp?.toLocaleString()
            },
            { 
                field: "decodedFlitString", 
                title: "Decoded Flit", 
                filterable: filterOnContainsOnly,
                attributes: {class: "ellipsis"}
             },
        ],
        dataSource: {
            // data: [],
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
        filterable: true
    }).data("kendoGrid");

    let gridElement = $("#grid");
    kendo.ui.progress(gridElement, true); // Show the progress indicator
    
    let flitGrid = $("#flit-grid").kendoGrid({
        columns: [
            { field: "Field" },
            { field: "Bits" },
            { field: "Number" },
            { field: "Decoded" }
        ],
        resizable: true,
    }).data("kendoGrid");


    let response = await fetch('ambaviz_messages.json');
    let data = await response.json();

    let startTime = data.messages[0].Timestamp;
    let endTime = data.messages[data.messages.length - 1].endTs;

    let xsd = new TransactionSequenceDiagram(
        startTime,
        endTime,
        $("#topPane")[0]
    );

    xsd.timescale = data.timescale;

    // add the data bound now
    msgGrid.setOptions({
        dataBound: function (e) {
            // Call the resize method after the grid has been databound
            // the old horrible timeout trickery
            setTimeout(function () {
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
            dataItems.forEach(function (item) {
                let msg = xsd.addOrUpdateMessage(item); // Process each item as needed
                if (msg.time < minTime) {
                    minTime = msg.time;
                }
                if (msg.endTs > maxTime) {
                    maxTime = msg.endTs;
                }
            });

            if (!xsd.zoomAction) {
                xsd.canvasSetTime(minTime, maxTime);
            }
            // for zoom actions just use the current zoom time scale
            xsd.zoomAction = false;
            xsd.draw();
        },
        change: function (e) {
            var selectedRows = this.select();
            var dataItem = this.dataItem(selectedRows[0]);
            console.log(dataItem);

            xsd.selectedMessageId = dataItem.id;
            xsd.draw();

            // scroll the canvas to the msg center x maybe plus a bit
            $('#topPane')[0].scrollTo(
                Math.min(dataItem.start._x1, dataItem.label._x1) - 10,  
                dataItem.label._center.y - 50);

            flitGrid.dataSource.data(dataItem.flit.fields);

            // scroll to the bottom of the flit grid
        },
    });


    /** decoders for different types of flit 
     * singleton instances of a "flit"
     * @type {Object.<string, Flit.Decoder>}
     */
    let flitDecoders = {};
    Object.entries(data.decoders).forEach(([name, fieldDecoderArray]) => {
        flitDecoders[name] = new Flit(fieldDecoderArray);
    });
    
    // hydrate the messages 
    let messages = xsd.hydrateMessages(data.messages, flitDecoders);

    msgGrid.dataSource.data(messages);

    kendo.ui.progress(gridElement, false); // Hide the progress indicator

    // Attach event handlers to the custom buttons
    $('button[data-role="clearfilters"]').on("click", function () {
        var grid = $("#grid").data("kendoGrid");
        grid.dataSource.filter({});
        console.log("clearing filters");
    }); 

    $("#toolbar").kendoToolBar({
        items: [
            { 
                type: "button", 
                text: "ZoomIn",
                click: x => xsd.zoomIn() 
            },
            { type: "button", text: "ZoomOut", click: x => xsd.zoomOut() },
            { type: "button", text: "Advanced Search", click: x => xsd.advancedSearch() },
//            { type: "splitButton", text: "SplitButton", menuButtons: [{ text: "Option 1" }, { text: "Option 2" }] }
        ]
    });
};

try {
    await main();
}
catch(e) {
    let gridElement = $("#grid");
    kendo.ui.progress(gridElement, false); // Hide the progress indicator
    console.log(e);
    alert(`Unhandled Exception\n\n${e}`);
}   