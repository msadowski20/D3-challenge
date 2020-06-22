var svgArea = d3.select("#scatter").select("svg");

var svgHeight = 600
var svgWidth = 800

var margin = {
  top: 50,
  right: 100,
  bottom: 100,
  left: 100,
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3.select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var activeXaxis = "poverty";
var activeYaxis = "obesity";

// function used for updating x-scale var upon click on axis label
function xScale(censusData, activeXaxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, (d) => d[activeXaxis]),
      d3.max(censusData, (d) => d[activeXaxis]),
    ])
    .range([0, width]);
  return xLinearScale;
}

function yScale(censusData, activeYaxis) {
  // create scales
  var yLinearScale = d3.scaleLinear()
  .domain([d3.min(censusData, (d) => d[activeYaxis]),
      d3.max(censusData, (d) => d[activeYaxis]),
    ])
    .range([height, 0]);
  return yLinearScale;
}

// function used for updating xAxis var upon click on axis label
function renderAxesX(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);
  xAxis.transition().duration(1000).call(bottomAxis);
  return xAxis;
}

// function used for updating yAxis var upon click on axis label
function renderAxesY(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);
  yAxis.transition().duration(1000).call(leftAxis);
  return yAxis;
}

// function used for updating circles with a transition to new circles
function renderCircles(circlesGroup, newXScale, newYScale, activeXaxis, activeYaxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cx", (d) => newXScale(d[activeXaxis]))
    .attr("cy", (d) => newYScale(d[activeYaxis]));
  return circlesGroup;
}

// function used for updating state abbr with a transition to new locations
function renderState(stateGroup, newXScale, newYScale, activeXaxis, activeYaxis) {
  stateGroup.transition()
    .duration(1000)
    .attr("x", (d) => newXScale(d[activeXaxis]))
    .attr("y", (d) => newYScale(d[activeYaxis]) + 4);
  return stateGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(activeXaxis, activeYaxis, circlesGroup) {
  
  var xLabel;
  if (activeXaxis === "poverty") {
    xLabel = "Poverty:";
  } else if (activeXaxis === "age") {
    xLabel = "Age:";
  } else {
    xLabel = "Income:";
  }

  var yLabel;
  if (activeYaxis === "obesity") {
    yLabel = "Obesity:";
  } else if (activeYaxis === "smokes") {
    yLabel = "Smokers:";
  } else {
    yLabel = "Lacks Healthcare:";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function (d) {
      if (activeXaxis === "poverty") {
        return `${d.state}<br>${xLabel} ${d[activeXaxis]}%<br>${yLabel} ${d[activeYaxis]}%`;
      } else if (activeXaxis === "age") {
        return `${d.state}<br>${xLabel} ${d[activeXaxis]}<br>${yLabel} ${d[activeYaxis]}%`;
      } else {
        return `${d.state}<br>${xLabel} ${d[activeXaxis].toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}<br>${yLabel} ${d[activeYaxis]}%`;
      }
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function (data) {
      toolTip.show(data);
    })
    // onmouseout event
    .on("mouseout", function (data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("data/data.csv").then(function (censusData, err) {
    if (err) throw err;

    // parse data
    censusData.forEach(function (data) {
      data.poverty = +data.poverty;
      data.age = +data.age;
      data.income = +data.income;
      data.obesity = +data.obesity;
      data.smokes = +data.smokes;
      data.healthcare = +data.healthcare;
    });

    // xLinearScale function above csv import
    var xLinearScale = xScale(censusData, activeXaxis);

    // Create y scale function
    var yLinearScale = yScale(censusData, activeYaxis);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // append x axis
    var xAxis = chartGroup.append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis);

    // append y axis
    var yAxis = chartGroup.append("g")
      .classed("y-axis", true)
      .call(leftAxis);

    // append initial circles
    var circlesGroup = chartGroup.selectAll("circle")
      .data(censusData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xLinearScale(d[activeXaxis]))
      .attr("cy", (d) => yLinearScale(d[activeYaxis]))
      .attr("r", 12)
      .attr("fill", "#3373A7")
      .attr("stroke", "#FFFFFF");

    var stateAbbr = chartGroup.append("g");

    // append initial abbreviations
    var stateGroup = stateAbbr.selectAll("text")
      .data(censusData)
      .enter()
      .append("text")
      .text((d) => d.abbr)
      .attr("x", (d) => xLinearScale(d[activeXaxis]))
      .attr("y", (d) => yLinearScale(d[activeYaxis]) + 3)
      .attr("text-anchor", "middle")
      .attr("fill", "#FFFFFF")
      .style("font-size", "8px");

    // Create group for x-axis labels
    var xLabelGroup = chartGroup.append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var yLabelGroup = chartGroup.append("g")
      .attr("transform", "rotate(-90)")
      .attr("dy", "1em")
      .classed("axis-text", true);

    var povertyLabel = xLabelGroup.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("value", "poverty") // value to grab for event listener
      .classed("active", true)
      .text("In Poverty (%)");

    var ageLabel = xLabelGroup.append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("value", "age") // value to grab for event listener
      .classed("inactive", true)
      .text("Age (Median)");

    var incomeLabel = xLabelGroup.append("text")
      .attr("x", 0)
      .attr("y", 60)
      .attr("value", "income") // value to grab for event listener
      .classed("inactive", true)
      .text("Household Income (Median) ($)");

    var obesityLabel = yLabelGroup.append("text")
      .attr("x", 0 - height / 2)
      .attr("y", 20 - margin.left)
      .attr("value", "obesity") // value to grab for event listener
      .classed("active", true)
      .text("Obese (%)");

    var smokesLabel = yLabelGroup.append("text")
      .attr("x", 0 - height / 2)
      .attr("y", 40 - margin.left)
      .attr("value", "smokes") // value to grab for event listener
      .classed("inactive", true)
      .text("Smokes (%)");

    var healthcareLabel = yLabelGroup.append("text")
      .attr("x", 0 - height / 2)
      .attr("y", 60 - margin.left)
      .attr("value", "healthcare") // value to grab for event listener
      .classed("inactive", true)
      .text("Lacks Healthcase (%)");

    // updateToolTip function above csv import
    var circlesGroup = updateToolTip(activeXaxis, activeYaxis, circlesGroup);

    // x axis labels event listener
    xLabelGroup.selectAll("text").on("click", function () {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== activeXaxis) {
        // replaces activeXaxis with value
        activeXaxis = value;

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(censusData, activeXaxis);

        // updates x axis with transition
        xAxis = renderAxesX(xLinearScale, xAxis);

        // updates circles with new x and y values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);

        // updates abbr with new x amd y values
        stateGroup = renderState(stateGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(activeXaxis, activeYaxis, circlesGroup);

        // changes classes to change bold text
        if (activeXaxis === "age") {
          ageLabel.classed("active", true).classed("inactive", false);
          povertyLabel.classed("active", false).classed("inactive", true);
          incomeLabel.classed("active", false).classed("inactive", true);
        } else if (activeXaxis === "income") {
          ageLabel.classed("active", false).classed("inactive", true);
          povertyLabel.classed("active", false).classed("inactive", true);
          incomeLabel.classed("active", true).classed("inactive", false);
        } else {
          ageLabel.classed("active", false).classed("inactive", true);
          povertyLabel.classed("active", true).classed("inactive", false);
          incomeLabel.classed("active", false).classed("inactive", true);
        }
      }
    });

    // y axis labels event listener
    yLabelGroup.selectAll("text").on("click", function () {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== activeYaxis) {
        // replaces activeYaxis with value
        activeYaxis = value;

        // functions here found above csv import
        // updates y scale for new data
        yLinearScale = yScale(censusData, activeYaxis);

        // updates y axis with transition
        yAxis = renderAxesY(yLinearScale, yAxis);

        // updates circles with new x and y values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);

        // updates abbr with new x amd y values
        stateGroup = renderState(stateGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(activeXaxis, activeYaxis, circlesGroup);

        // changes classes to change bold text
        if (activeYaxis === "smokes") {
          smokesLabel.classed("active", true).classed("inactive", false);
          obesityLabel.classed("active", false).classed("inactive", true);
          healthcareLabel.classed("active", false).classed("inactive", true);
        } else if (activeYaxis === "healthcare") {
          smokesLabel.classed("active", false).classed("inactive", true);
          obesityLabel.classed("active", false).classed("inactive", true);
          healthcareLabel.classed("active", true).classed("inactive", false);
        } else {
          smokesLabel.classed("active", false).classed("inactive", true);
          obesityLabel.classed("active", true).classed("inactive", false);
          healthcareLabel.classed("active", false).classed("inactive", true);
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });

