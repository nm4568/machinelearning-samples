// PRODUCT FORECASTING

var months = ["",
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun", "Jul",
    "Aug", "Sep", "Oct",
    "Nov", "Dec"
];

var full_months = ["",
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"];

function onLoadProductForecasting() {
    setResponsivePlots();
    setUpProductDescriptionTypeahead();
    $("footer").addClass("sticky");
}

function setResponsivePlots(plotSelector = ".responsive-plot") {
    // MAKE THE PLOTS RESPONSIVE
    // https://gist.github.com/aerispaha/63bb83208e6728188a4ee701d2b25ad5
    var d3 = Plotly.d3;
    var gd3 = d3.selectAll(plotSelector);
    var nodes_to_resize = gd3[0]; //not sure why but the goods are within a nested array
    window.onresize = function () {
        for (var i = 0; i < nodes_to_resize.length; i++) {
            //if (nodes_to_resize[i].attributes["width"])
            Plotly.Plots.resize(nodes_to_resize[i]);
        }
    };
}

function setUpProductDescriptionTypeahead(typeaheadSelector = "#remote .typeahead") {
    var productDescriptions = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: `${apiUri.catalog}/productSetDetailsByDescription?description=%QUERY`,
            wildcard: '%QUERY'
        }
    });

    $(typeaheadSelector)
        .typeahead
        ({
            minLength: 3,
            highlight: true
        },
        {
            name: 'products',
            display: 'description',
            limit: 10,
            source: productDescriptions
        })
        .on('typeahead:selected', function (e, data) {
            updateProductInfo(data);
            getProductData(data, e.currentTarget.baseURI.split("/").pop());
        });
}

function updateProductInfo(data) {
    $("#product").removeClass("d-none");
    $("#productName").text(data.description);
    $("#productPrice").text(`${data.price.toCurrencyLocaleString()}`);
    $("#productImage").attr("src", data.pictureUri).attr("alt", data.description);   
}

function getProductData(product, page) {
    productId = product.id;
    description = product.description;

    getHistory(productId)
        .done(function (history) {
            if (history.length < 4) return;
            $.when(
                getForecast(history[history.length - 1], page)
            ).done(function (forecast) {
                plotLineChart(forecast, history, description, product.price);
            });
        });
}

    function getHistory() {
    return $.getJSON(`${window.location.origin}/risk`);
}

function getStats(productId) {
    return $.getJSON(`${apiUri.ordering}/product/${productId}/stats`);
}

function plotLineChart(data, key, chartTitle) {
    //for(i = 0; i < history.length; i++) {
    //    history[i].sales = history[i].units * price;
    //}
    //forecast *= price;
    var description = data[0];
    var history = data[1];
    var forecast = 1;
    //updateProductStatistics(description, history.slice(history.length - 120), forecast);
    var real = history.filter(function (element, index) {
        if (index <= 100) {
            return element;
        }
    });
    var forecast = history.filter(function (element, index) {
        if (index >= 100) {
            return element;
        }
    });
    var trace_real = TraceProductHistory(real, key);
    debugger;
    var trace_forecast = TraceProductForecast(
        forecast,
        forecast,
        history[history.length - 1],
        trace_real.text[trace_real.text.length - 1],
        trace_real.y,
        forecast,
        key);
    var trace_forecast_min = TraceProductForecast(
        forecast,
        forecast,
        history[history.length - 1],
        trace_real.text[trace_real.text.length - 1],
        trace_real.y,
        forecast,
        'min');
    var trace_forecast_max = TraceProductForecast(
        forecast,
        forecast,
        history[history.length - 1],
        trace_real.text[trace_real.text.length - 1],
        trace_real.y,
        forecast,
        'max');

    var trace_mean = TraceMean(trace_real.x.concat(trace_forecast.x), trace_real.y, '#DE68FF');

    
    var layout = {
        //title: 'chart_title',      
        
        xaxis: {
            tickangle: 0,
            showgrid: false,
            showline: false,
            zeroline: true,
            //showticklabels: true,
            //autotick: false,
            ticks: 'outside',
            //tickcolor: 'rgb(204,204,204)',
            tickwidth: 2,
            ticklen: 5,
            tickfont: {
                family: 'Arial',
                size: 8,
                color: 'black'
            },
            showgrid: true,            
            title: 'Days',
            //domain: [0, 1],        
            range: [trace_real.x.minLength-0, trace_real.x.length] // was 12 beforen

        },
        yaxis: {
            showgrid: false,
            showline: false,
            zeroline: true,
            title: 'Sales',
            //domain: [0, 1], 
            tickformat: '$, .0',
            tickfont: {
                family: 'Arial',
                size: 8,
                color: 'black'
            },
           
        },
        hovermode: "closest",
        //dragmode: 'pan',
        
        legend: {
            orientation: "h",
            xanchor: "right",
            yanchor: "top",
            y: 10.5,
            x: 0.85,
            font: {
                size:8
            }
        }
    };

    //populating the charts

    Plotly.newPlot(chartTitle, [trace_real, trace_forecast, trace_forecast_min, trace_forecast_max, trace_mean], layout, { showSendToCloud: true, displayModeBar: false });}

function TraceProductHistory(historyItems, key) {
    var y = $.map(historyItems, function (d) { return d[key]; });
    var x = $.map(historyItems, function (d) { return d.day; });
    var texts = $.map(historyItems, function (d) { return d[key]; });
   
    return {
        x: x,
        y: y,
        mode: 'lines+markers',
        name: 'history',
        line: {
            shape: 'spline',
            color: '#E1334E'
        },
        hoveron: 'points',
        hoverinfo: 'text',
        hoverlabel: {
            bgcolor: 'white',
            bordercolor: '#333333',
            font: {
                color: 'black',
                size: 8
            }
        },
        text: texts,
       // fill: 'tozeroy',
        // fillcolor: 'red',
        marker: {
            symbol: "circle",
            color: "#B4FF00",
            size: 3,
            line: {
                color: "black",
                width: 0.5
            }
        }
    };
}

function TraceProductForecast(labels, next_x_label, next_text, prev_text, values, forecast, key) {
    var fill_color = (key === "min" || key === "max") ? "#CCCCCC" : "#00A69C";

    return {
        y: $.map(labels, function (label) {
            return label[key];
        }),
        x: $.map(labels, function (label) {
            return label.day;
        }),
        text: $.map(labels, function (label) {
            return label[key];
        }),
        mode: key === "min" || key === "max" ? 'lines+markers' : "lines+markers",
        name: key === "min" || key === "max" ? key : "forecasting",
        type: key === "min" || key === "max" ? 'scatter' : "spline",
        hoveron: 'points',
        hoverinfo: 'text',
        hoverlabel: {
            bgcolor: 'white',
            bordercolor: '#333333',
            font: {
                color: 'black',
                size: 8
            }
        },     
        xaxis: 'x',
        yaxis:'y',
        line: {
            dash: key === "min" || key === "max" ? 'dot' : "dashdot",
            shape: 'spline',//shape: 'hvh'
            color: fill_color,
            
        },
        fill: key === "min" || key === "max" ? 'tonexty' : '',//toself, tonexty, tozeroy
         //fillcolor: '#00A69C',
        marker: {
            symbol: "circle",
            color: "#B4FF00",
            size: 3,
            line: {
                color: "black",
                width: 0.5
            }
        }
    };
}

function TraceMean(labels, values, color) {
    var y_mean = values.slice(0, values.length - 2).reduce((previous, current) => current += previous) / values.length;
    return {
        x: labels,
        y: Array(labels.length).fill(y_mean),
        name: 'average',
        mode: 'lines',
        hoverinfo: 'none',
        line: {
            color: color,
            width: 2
        }
    };
}


function onLoadCountryForecasting() {
    setResponsivePlots();
    $("footer").addClass("sticky");
}
function updateProductStatistics(product, historyItems, forecasting) {
    showStatsLayers();

    //populateForecastDashboard(product, historyItems, forecasting);
    populateHistoryTable(historyItems);

    refreshHeightSidebar();
}

function showStatsLayers() {
    $("#plot,#tableHeader,#tableHistory").removeClass('d-none');
}

function populateForecastDashboard(country, historyItems, forecasting, units = false) {
    var lastday = historyItems[historyItems.length - 1].day;
    var values = historyItems.map(y => y.year === lastday ? y.sales : 0);
    var total = values.reduce((previous, current) => current += previous);

    $("#labelTotal").text(`${lastday} sales`);
    $("#valueTotal").text(units ? total.toNumberLocaleString() : total.toCurrencyLocaleString());
    $("#labelForecast").text(`${nextFullMonth(historyItems[historyItems.length - 1], true).toLowerCase()} sales`);
    $("#valueForecast").text(units ? forecasting.toNumberLocaleString() : forecasting.toCurrencyLocaleString());
    $("#labelItem").text(country); 
    $("#tableHeaderCaption").text(`Sales ${units ? "units" : (1).toCurrencyLocaleString().replace("1.00", "")} / month`);
}

function populateHistoryTable(historyItems) {
    var table = '';
    var lastYear = '';
    for (i = 0; i < historyItems.length; i++) {
        if (historyItems[i].year !== lastYear) {
            lastYear = historyItems[i].year;
            table += `<div class="col-11 border-bottom-highlight-table month font-weight-bold">${lastYear}</div>`;
        }
        table += `<div class="col-8 border-bottom-highlight-table month">${full_months[historyItems[i].month]}</div> <div class="col-3 border-bottom-highlight-table">${historyItems[i].sales.toLocaleString()}</div >`;
    }
    $("#historyTable").empty().append($(table));
}

function refreshHeightSidebar() {
    $("aside").css('height', $(document).height());
}

Number.prototype.toCurrencyLocaleString = function toCurrencyLocaleString() {
    var currentLocale = navigator.languages ? navigator.languages[0] : navigator.language;
    return this.toLocaleString(currentLocale, { style: 'currency', currency: 'USD' });
};

Number.prototype.toNumberLocaleString = function toNumberLocaleString() {
    var currentLocale = navigator.languages ? navigator.languages[0] : navigator.language;
    return this.toLocaleString(currentLocale, { useGrouping: true }) + " units";
};

$(function () {
    getHistory()
        .done(function (data, index) {
            Object.entries(data).forEach(function (chartData, index) {
                var key = '';
                var chartTitle = '';
                var suffix = index % 2 ? '_2' : '_1';
                switch (index) {
                    case 0:
                    case 1:
                        key = 'riskValue';
                        chartTitle = 'risk_lineChart'
                        break;
                    case 2:
                    case 3:
                        key = 'riskBaseValue';
                        chartTitle = 'base_lineChart'
                        break;
                    case 4:
                    case 5:
                        key = 'riskImpactValue';
                        chartTitle = 'impact_lineChart'
                        break;
                    case 6:
                        key = 'riskImpactValue';
                        chartTitle = 'impact_entity_lineChart'
                        break;
                }

                /*
                if (index === 7) { return; }
                console.log(chartTitle + suffix);
                */

                plotLineChart(chartData, key, chartTitle + suffix);
            });
        });
});

