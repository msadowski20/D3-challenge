// Create svg area,
// define margins,
// set width and height for svg area
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

// Create an SVG wrapper,
// append an SVG group that will hold chart
var svg = d3.select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

var activeXaxis = "poverty";
var activeYaxis = "obesity";

// Functions for scaling x-axis and y-axis
function xScale(censusData, activeXaxis) {
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, (d) => d[activeXaxis]),
      d3.max(censusData, (d) => d[activeXaxis]),
    ])
    .range([0, width]);
  return xLinearScale;
}

function yScale(censusData, activeYaxis) {
  var yLinearScale = d3.scaleLinear()
  .domain([d3.min(censusData, (d) => d[activeYaxis]),
      d3.max(censusData, (d) => d[activeYaxis]),
    ])
    .range([height, 0]);
  return yLinearScale;
}

// Functions for rendering x-axis and y-axis
function renderAxesX(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);
  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);
  return xAxis;
}

function renderAxesY(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);
  yAxis.transition()
    .duration(1000)
    .call(leftAxis);
  return yAxis;
}

// Function for rendering circles 
function renderCircles(circlesGroup, newXScale, newYScale, activeXaxis, activeYaxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cx", (d) => newXScale(d[activeXaxis]))
    .attr("cy", (d) => newYScale(d[activeYaxis]));
  return circlesGroup;
}

// Function for adding state abbreviations to circles
function renderState(stateGroup, newXScale, newYScale, activeXaxis, activeYaxis) {
  stateGroup.transition()
    .duration(1000)
    .attr("x", (d) => newXScale(d[activeXaxis]))
    .attr("y", (d) => newYScale(d[activeYaxis]) + 4);
  return stateGroup;
}

// Function for adding tooltips to circles,
// updated based on active axes, only active on mouse over event
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
    .attr("class", "d3-tip")
    .offset([80, -60])
    .html(function (d) {
      if (activeXaxis === "poverty") {
        return `${d.state}<br>${xLabel} ${d[activeXaxis]}%<br>${yLabel} ${d[activeYaxis]}%`;
      } else if (activeXaxis === "age") {
        return `${d.state}<br>${xLabel} ${d[activeXaxis]}<br>${yLabel} ${d[activeYaxis]}%`;
      } else {
        return `${d.state}<br>${xLabel} ${d[activeXaxis].toLocaleString(
          "en-US",
          {
            style: "currency",
            currency: "USD",
          }
        )}<br>${yLabel} ${d[activeYaxis]}%`;
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

// Read the csv file and parse data to integer format
d3.csv("data/data.csv").then(function (censusData, err) {
    if (err) throw err;

    censusData.forEach(function (data) {
      data.poverty = +data.poverty;
      data.age = +data.age;
      data.income = +data.income;
      data.obesity = +data.obesity;
      data.smokes = +data.smokes;
      data.healthcare = +data.healthcare;
    });

    // Scaling the x-axis and y-axis
    var xLinearScale = xScale(censusData, activeXaxis);
    var yLinearScale = yScale(censusData, activeYaxis);

    // Create the top axis and bottom axis
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Append x-axis and y-axis
    var xAxis = chartGroup.append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis);

    var yAxis = chartGroup.append("g")
      .classed("y-axis", true)
      .call(leftAxis);

    // Append circles with state abbreviations
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

    // Create labels groups for x-axis and y-axis
    var xLabelGroup = chartGroup.append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var yLabelGroup = chartGroup.append("g")
      .attr("transform", "rotate(-90)")
      .attr("dy", "1em")
      .classed("axis-text", true);

    // Create labels for x-axis and y-axis,
    // append the labels to the x-axis and y-axis,
    // check event listeners for active axis
    var povertyLabel = xLabelGroup.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("value", "poverty")
      .classed("active", true)
      .text("In Poverty (%)");

    var ageLabel = xLabelGroup.append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("value", "age")
      .classed("inactive", true)
      .text("Age (Median)");

    var incomeLabel = xLabelGroup.append("text")
      .attr("x", 0)
      .attr("y", 60)
      .attr("value", "income")
      .classed("inactive", true)
      .text("Household Income (Median) ($)");

    var obesityLabel = yLabelGroup.append("text")
      .attr("x", 0 - height / 2)
      .attr("y", 20 - margin.left)
      .attr("value", "obesity")
      .classed("active", true)
      .text("Obese (%)");

    var smokesLabel = yLabelGroup.append("text")
      .attr("x", 0 - height / 2)
      .attr("y", 40 - margin.left)
      .attr("value", "smokes")
      .classed("inactive", true)
      .text("Smokes (%)");

    var healthcareLabel = yLabelGroup.append("text")
      .attr("x", 0 - height / 2)
      .attr("y", 60 - margin.left)
      .attr("value", "healthcare")
      .classed("inactive", true)
      .text("Lacks Healthcase (%)");

    // Update tooltip function to use active axis
    var circlesGroup = updateToolTip(activeXaxis, activeYaxis, circlesGroup);

    // Event listener for x-axis
    xLabelGroup.selectAll("text").on("click", function () {
      var value = d3.select(this).attr("value");
      if (value !== activeXaxis) {
        activeXaxis = value;

        // Update scale of x-axis, render based on active axis
        xLinearScale = xScale(censusData, activeXaxis);
        xAxis = renderAxesX(xLinearScale, xAxis);

        // Update and render circles based on x,y values for active axis,
        // Update and render state abbreviations based on x,y values for active axis,
        // Update and render tooltips based on x,y values for active axis
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);
        stateGroup = renderState(stateGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);
        circlesGroup = updateToolTip(activeXaxis, activeYaxis, circlesGroup);

        // Change and format x-axis labels based on active axis
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

    // Event listener for y-axis
    yLabelGroup.selectAll("text").on("click", function () {
      var value = d3.select(this).attr("value");
      if (value !== activeYaxis) {
        activeYaxis = value;

        // Update scale of y-axis, render based on active axis
        yLinearScale = yScale(censusData, activeYaxis);
        yAxis = renderAxesY(yLinearScale, yAxis);

        // Update and render circles based on x,y values for active axis,
        // Update and render state abbreviations based on x,y values for active axis,
        // Update and render tooltips based on x,y values for active axis
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);
        stateGroup = renderState(stateGroup, xLinearScale, yLinearScale, activeXaxis, activeYaxis);
        circlesGroup = updateToolTip(activeXaxis, activeYaxis, circlesGroup);

        // Change and format y-axis labels based on active axis
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

