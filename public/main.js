'use strict';

//constants
var HEIGHT = 350;
var WIDTH = 500;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };
var COUNTRY = "United States";
var MALE = true;
var FEMALE = true;
var YEAR_STANDARD = 1989;

//scale
var x = d3.scale.linear()
          .range([0, (WIDTH - MARGINS.right - MARGINS.left)])
          .domain([1990, 2013])
var y = d3.scale.linear()
      .range([(HEIGHT - MARGINS.bottom - MARGINS.top), 0])
      .domain([0, 0.5])

//svg elements
var drawLine = d3.svg.line()
    .x(function(d) { 
      return x(d.year); })
    .y(function(d) { 
      console.log(d.mean);
      return y(d.mean); });

var chart = d3.select('#display')
var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(10)
      //.tickValues(generateYears(1990, 2013));
var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');
var menu = d3.select('#countries');
var maleCheck = d3.select('#male-check');
var femaleCheck = d3.select('#female-check');

d3.csv('./data.csv', function(data) {
  data = sortByLocationNameThenAgeGroup(data, "20+ yrs, age-standardized", 'obese');
  console.log(data);
  testCircle()

  chart.append('g').call(xAxis)
    .attr('transform', 'translate(' + MARGINS.left + ', ' + (HEIGHT - MARGINS.bottom) + ')');
  chart.append('g').call(yAxis)
    .attr('transform', 'translate(' + MARGINS.left + ', ' + MARGINS.top + ')');

  menu.selectAll('option')
    .data(data.countryNames)
    .enter()
    .append('option')
    .attr('value', function(d) { return d })
    .text(function(d) {return d})

  var female = chart.append('path')
    .attr('class', 'female')
    .attr('d', drawLine(data[COUNTRY].female))
    .attr('stroke-width', 2)
    .attr('stroke', 'red')
    .attr('fill', 'none')
    .attr('transform', 'translate(' + MARGINS.left + ')')

  var male = chart.append('path')
    .attr('class', 'male')
    .attr('d', drawLine(data[COUNTRY].male))
    .attr('stroke-width', 2)
    .attr('stroke', 'blue')
    .attr('fill', 'none')
    .attr('transform', 'translate(' + MARGINS.left + ')')

  function update(data, COUNTRY) {
    if(MALE) {
    male.transition()
      .attr('d', drawLine(data[COUNTRY].male))
      .duration(750)
      .ease('easeOutQuint');
    } else {
      male.remove();
    }
    if(FEMALE) {
      female.transition()
        .attr('d', drawLine(data[COUNTRY].female))
        .duration(750)
        .ease('easeOutQuint');
    } else {
      female.remove();
    }
  }

  //event handlers
  menu.on('change', function() {
    COUNTRY = this.value;
    update(data, COUNTRY);
  });

  maleCheck.on('change', function() {
    MALE = !MALE;
    update(data, COUNTRY);
  });

  femaleCheck.on('change', function() {
    FEMALE = !FEMALE;
    update(data, COUNTRY);
  });
});

//helpers
function sortByLocationNameThenAgeGroup(dataset, ageGroup, metric) {
  var sorted = {};
  var countriesSeen = {};

  ageGroup = ageGroup || 'age_group';
  sorted.countryNames = [];

  for (var i = 0; i < dataset.length; i++) {
    var curr = dataset[i];
    var currLocation = curr.location_name;
    var currAgeGroup = curr.age_group;

    if (!sorted[currLocation]) sorted[currLocation] = {
      location_name: currLocation,
      male: [],
      female: []
    };
    //if (!sorted[currLocation][currAgeGroup]) sorted[currLocation][currAgeGroup] = [];
    if(currAgeGroup === ageGroup && curr.sex != 'both' && curr.metric == metric) {
      sorted[currLocation][curr.sex].push(curr);
      if(!countriesSeen[currLocation]) {
        sorted.countryNames.push(currLocation);
        countriesSeen[currLocation] = true;
      }
    }
  };
  return sorted;
}

function testCircle(){
  var counter = 0;

  chart.append('circle')
      .attr('r', 10)
      .attr('cy', 0)
      .attr('cx', 200)

  setInterval(function() {
    chart.select('circle')
      .transition()
      .duration(1000)
      .attr('transform', 'translate(0, ' + (HEIGHT) + ')')
      //.attr('cy', counter);

    counter += 10;
  }, 1000);
}

function generateYears(start, end) {
  var range = end - start;
  var years = [];

  for (var i = 0; i < end; i++) {
    years.push(start + i);
  };

  return years;
}
