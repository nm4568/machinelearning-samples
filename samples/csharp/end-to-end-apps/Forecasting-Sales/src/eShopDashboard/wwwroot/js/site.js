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
    var real = history.splice(0, 100);
    var forecast = history.splice(0, 20);
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

    var trace_mean = TraceMean(trace_real.x.concat(trace_forecast.x), trace_real.y, '#ccff00');

    var layout = {
                   
        xaxis: {
            tickangle: 0,
            showgrid: false,
            showline: false,
            zeroline: false,
            range: [trace_real.x.minLength, trace_real.x.length] // was 12 beforen

        },
        yaxis: {
            showgrid: false,
            showline: false,
            zeroline: false,
            tickformat: '$,.0'
        },
        hovermode: "closest",
        //dragmode: 'pan',
        legend: {
            orientation: "h",
            xanchor: "center",
            yanchor: "top",
            y: 1.2,
            x: 0.85
        }
    };

    //populating the charts

    Plotly.newPlot(chartTitle, [trace_real, trace_forecast, trace_mean], {}, { showSendToCloud: true });}

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
            color: '#dd1828'
        },
        hoveron: 'points',
        hoverinfo: 'text',
        hoverlabel: {
            bgcolor: '#333333',
            bordercolor: '#333333',
            font: {
                color: 'white'
            }
        },
        text: texts,
        fill: 'tozeroy',
        fillcolor: 'red',
        marker: {
            symbol: "circle",
            color: "white",
            size: 10,
            line: {
                color: "black",
                width: 3
            }
        }
    };
}

function TraceProductForecast(labels, next_x_label, next_text, prev_text, values, forecast, key) {
    debugger;
    return {
        y: $.map(labels, function (label) {
            return label[key];
        }),
        x: $.map(labels, function (label) {
            return label.day;
        }),
        text: [prev_text, `next_text`],
        mode: 'lines+markers',
        name: 'forecasting',
        hoveron: 'points',
        hoverinfo: 'text',
        hoverlabel: {
            bgcolor: '#333333',
            bordercolor: '#333333',
            font: {
                color: 'white'
            }
        },
        line: {
            shape: 'spline',
            color: '#00A69C'
        },
        fill: 'tozeroy',
        fillcolor: '#00A69C',
        marker: {
            symbol: "circle",
            color: "white",
            size: 10,
            line: {
                color: "black",
                width: 3
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
            width: 3
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

