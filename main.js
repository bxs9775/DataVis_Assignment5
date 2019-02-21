/* Assignment 5 
 *
 * Use this template to add interactivity:
 *
 * - Bars: on mouseover, change fill color to green show you're hovering over the bar.
 * - Bars: on mouseover, have secondary data show up in floating div.
 * - Bars: on mouseout, change fill color to the bar's original color (use cScale).
 * - Bars: on click: toggle bar being selected or not (shown with visual change). 
 *   Implement by setting a CSS class on the bar. We won't use this interaction for 
 *   anything else at this time, but this will be useful for later work.  
 *
 *  */

let dataset;
let w = 600;
let h = 500;
let svg;
let xScale, yScale, cScale;
let xAxis, yAxis;
let xAxisGroup, yAxisGroup;

let toolOffX = 10;
let toolOffY = 50;

let numDaysSlider = document.querySelector("#numDaysSlider");

let dataURL = "data.csv";

// D3 time parsing function for the date format of our data
let parseDate = d3.timeParse("%Y-%m-%d");
//Tooltip date formatter
let ttDateFormat = d3.timeFormat("%Y-%m-%d");

// some values for the good sleep line
let goodSleep = 7.5;

// Our key function for joining our data to our bars
let key = (d) => d.date;

// Row conversion function
function rowConverter(d) {
  return {
    date: parseDate(d.date), 
    sleep: parseFloat(d.hours_of_sleep)
  }
}

//event functions
// Mouseover event function for the svg rect elements (bars)
function barOver(d){
  var bar = d3.select(this);
  
  console.dir(bar.attr('x'));
  console.dir(bar.attr('y'));
  var tooltipX = 1*bar.attr('x') + bar.attr('width')/2 + toolOffX;
  var tooltipY = 1*bar.attr('y') + toolOffY;
  console.log(`(${tooltipX},${tooltipY})`);
  bar.style('fill','green');
  //console.dir(`Mouseover - day = ${d.date}`);
  var tooltip = d3.select('#barInfo')
  .style('left',`${tooltipX}px`)
  .style('top',`${tooltipY}px`);
  tooltip.select('#barDate').text(ttDateFormat(d.date));
  tooltip.select('#barHours').text(d.sleep);
  tooltip.classed('hidden',false);
}

// Mouseout event function for the svg rect elements (bars)
function barOut(d){
  d3.select(this)
    .style('fill',cScale(d.sleep));
  //console.dir(`Mouseout - day = ${d.date}`);
  d3.select('#barInfo').attr('class','hidden');
}

// Mouseclick event function for the svg rect elements (bars)
function barClick(d){
  let bar = d3.select(this);
  bar.classed('selected',!bar.classed('selected'));
}

// Creates the graph
function initGraph() {
  d3.csv(dataURL, rowConverter).then((data) => {
    // sort by date ascending
    data.sort((a,b) => a.date - b.date);

    // save the dataset globally
    dataset = data;

    console.log(dataset);

    // create our SVG element
    svg = d3.select('body').append('svg').attr('width', w).attr('height', h);

    // create a scale for y-axis: use linear for the sleep data variable
    yScale = d3.scaleLinear()
               .domain([0, 12])
               .range([h - 20, 20]);

    // create a scale for x-axis: use time for the date data variable
    // set the end to be the day after the last date, which is hard 
    // coded here, so that the far right end of the scale is going to
    // allow the last day within the data set to show within the range
    xScale = d3.scaleTime()
               .domain([d3.min(dataset, (d) => d.date), 
                        parseDate("2018-10-03")])
               .range([30, w - 20]);

    // use a color scale for the bar colors
    cScale = d3.scaleLinear()
                .domain([0, 12])
                .range(['red', 'orange']);

    let barlen = ((w - 50) / dataset.length) - 4;

    // Some visual elements to show the good sleep line 
    // and amount
    let lineY = yScale(goodSleep);

    // background rect
    svg.append('g')
      .append('rect')
      .attr('x', 30)
      .attr('height', h - 20 - yScale(goodSleep))
      .attr('width', w-50 )
      .attr('y', yScale(goodSleep))
      .style('fill', '#f002');

    // good sleep line 
    svg.append('line')
      .attr('x1', 20)
      .attr('y1', lineY)
      .attr('x2', w-20)
      .attr('y2', lineY)
      .style('stroke', 'red');

    // selecting by class instead of element type
    // we do this here because if we don't, this will also
    // select the above background rect which want to use just
    // for decoration
    svg.selectAll('.bars')
      .data(dataset, key)
      .enter()
      .append('rect')
      .classed('bars',true)
      .attr('x', (d) => xScale(d.date))
      .attr('height', (d) => h - 20 - yScale(d.sleep))
      .attr('width', barlen )
      .attr('y', (d) => yScale(d.sleep))
      .style('fill', (d) => cScale(d.sleep))
      //Adding interactivity.
      .on('mouseover',barOver)
      .on('mouseout',barOut)
      .on('click',barClick);

    // create our x-axis and customize look with .ticks() and
    // .tickFormat()
    xAxis = d3.axisBottom(xScale)
              .ticks(dataset.length + 1)
              .tickFormat(d3.timeFormat('%a'));
    xAxisGroup = svg.append('g')
                   .attr('transform', `translate(0, ${h - 20})`)
                   .call(xAxis);

    yAxis = d3.axisLeft(yScale);
    yAxisGroup = svg.append('g')
                   .attr('transform', `translate(30, 0)`)
                   .call(yAxis);
  })
}

// Updates the graph
function updateGraph() {
  let numDays = numDaysSlider.value;

  // use a subset of the data
  // .slice() returns a shallow copy of dataset with only
  // values from 7-numDays to 7
  let data = dataset.slice(7 - numDays, 7);

  xScale.domain([d3.min(data, (d) => d.date), 
                        parseDate("2018-10-03")]);

  let barlen = ((w - 50) / data.length) - 4;

  // again, select by class
  let bars = svg.selectAll('.bars')
                .data(data, key);

  // here we handle what to do for new items (entering) and
  // also what to do with both entering and updating items
  // (the code after .merge())
  bars
    .enter()
      .append('rect')
      .classed('bars', true)
      .attr('x', -barlen)
      .attr('height', (d) => h - 20 - yScale(d.sleep))
      .attr('width', barlen )
      .attr('y', (d) => yScale(d.sleep))
      .style('fill', (d) => cScale(d.sleep))
      .on('mouseover',barOver)
      .on('mouseout',barOut)
      .on('click',barClick)
    .merge(bars)
      .transition()
      .duration(1000)
      .attr('x', (d) => xScale(d.date))
      .attr('width', barlen);

  // here we handle data that is no longer in the dataset
  bars.exit()
    .transition()
    .duration(1000)
    .attr('x', -barlen)
    .remove();

  xAxis.ticks(data.length + 1)

  xAxisGroup.transition()
    .duration(1000)
    .call(xAxis);

  yAxisGroup.transition()
    .duration(1000)
    .call(yAxis);

}

window.onload = function() {
  initGraph(); 
  numDaysSlider.addEventListener('change', updateGraph);
}
