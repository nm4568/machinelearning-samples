
function onLoadProductForecasting() {
    setResponsivePlots();
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

function updateProductInfo(data) {
    $("#product").removeClass("d-none");
    $("#productName").text(data.description);
    $("#productPrice").text(`${data.price.toCurrencyLocaleString()}`);
    $("#productImage").attr("src", data.pictureUri).attr("alt", data.description);   
}

function getHistory() {
    return $.getJSON(`${window.location.origin}/risk`);
}


function plotLineChart(data, key, chartTitle) {
    var history = data[1];
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

    var trace_forecast = TraceProductForecast(
        forecast,
        forecast,
        history[history.length - 1],
        trace_real.text[trace_real.text.length - 1],
        trace_real.y,
        forecast,
        key);
    var trace_forecast_confidence = TraceProductForecastConfidence(
        forecast);

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

    // hide the modebar (hover bar) buttons, plotly logo. show plotly tooltips
    var defaultPlotlyConfiguration = { modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian', 'lasso2d', 'select2d'], displaylogo: false, showTips: true };

    //populating the charts
    Plotly.newPlot(chartTitle, [trace_real, trace_forecast_confidence, trace_forecast, trace_mean], layout, { showSendToCloud: true, displayModeBar: false });}

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
            color: "rgba(242,242,242,1)",
            fillcolor: "rgba(242,242,242,1)"
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
            color: "#00A69C",
            
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

function TraceProductForecastConfidence(labels) {
    var x = $.map(labels, function (label) {
        return label.day;
    });

    var reverseX = [...x].reverse();

    var y = $.map(labels, function (label) {
        return label["max"];
    });

    var yBottom = $.map(labels, function (label) {
        return label["min"];
    });
    var reverseY = yBottom.reverse();

    var allX = x.concat(reverseX);
    var allY = y.concat(reverseY);

    return {
        fill: "toself",
        y: allY,
        x: allX,
        text: $.map(labels, function (label, index) {
            return allY[index];
        }),
        mode: "lines+markers",
        name: "90% Confidence",
        type: 'scatter',
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
        yaxis: 'y',
        line: {
            dash: 'dot',
            shape: 'spline',//shape: 'hvh'
            color: "#CCCCCC"
        },
        fillcolor: "#CCCCCC",
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
                        chartTitle = 'risk_lineChart';
                        break;
                    case 2:
                    case 3:
                        key = 'riskBaseValue';
                        chartTitle = 'base_lineChart';
                        break;
                    case 4:
                    case 5:
                        key = 'riskImpactValue';
                        chartTitle = 'impact_lineChart';
                        break;
                    case 6:
                        key = 'riskImpactValue';
                        chartTitle = 'impact_entity_lineChart';
                        break;
                }

                plotLineChart(chartData, key, chartTitle + suffix);
            });
        });
});

