'use strict';

//constants
var HEIGHT = 500;
var WIDTH = 800;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };
var COUNTRIES = {
  main: "Afghanistan",
  overlayOne: ''
}
var MALE = true;
var FEMALE = true;
var YEAR_STANDARD = 1989;

//scale
var x = d3.scale.linear()
          .range([0, (WIDTH - MARGINS.right - MARGINS.left)])
          .domain([1990, 2013])
var y = d3.scale.linear()
      .range([(HEIGHT - MARGINS.bottom - MARGINS.top), 0])
      .domain([0, 0.7])

//svg elements
var svgLine = d3.svg.line()
    .x(function(d) { 
        return x(d.year);
      })
    .y(function(d) {
        return y(d.mean);
      });

var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(10)
var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

var chart = d3.select('#chart')
      .append('svg')
      .attr('height', HEIGHT)
      .attr('width', WIDTH)
      .attr('id', 'display')

chart.append('g').call(xAxis)
    .attr('transform', 'translate(' + MARGINS.left + ', ' + (HEIGHT - MARGINS.bottom) + ')');
chart.append('g').call(yAxis)
    .attr('transform', 'translate(' + MARGINS.left + ', ' + MARGINS.top + ')');


var menus = d3.selectAll('select');
var maleCheck = d3.select('#male-check');
var femaleCheck = d3.select('#female-check');

d3.csv('./data.csv', function(data) {
  data = sortByLocationNameThenAgeGroup(data, "20+ yrs, age-standardized", 'obese');

  menus.selectAll('option')
    .data(data.countryNames)
    .enter()
    .append('option')
    .attr('value', function(d) { return d })
    .text(function(d) {return d})

  drawCountry(data, COUNTRIES.main);

  function update(data, country) {
    //TODO constants module? don't like tweaking global
    country = country.replace(/[ -,]/g, '');
    var prevCountry = COUNTRIES.main;
    var maleLine = d3.select('.male-' + prevCountry);
    var femaleLine = d3.select('.female-' + prevCountry);

    maleLine.transition()
      .attr('d', svgLine(data[country].male))
      .attr('class', 'male-' + country)
      .duration(750)
      .ease('easeOutQuint');
  

    femaleLine.transition()
      .attr('d', svgLine(data[country].female))
      .attr('class', 'female-' + country)
      .duration(750)
      .ease('easeOutQuint');

    COUNTRIES.main = country;
  }

  //event handlers
  menus.on('change', function() {
    update(data, this.value);
  });

  maleCheck.on('change', function() {
    MALE = !MALE;
    updateChecked(data, COUNTRIES.main, 'male')
  });

  femaleCheck.on('change', function() {
    FEMALE = !FEMALE;
    updateChecked(data, COUNTRIES.main, 'female');
  });
});

//helpers
function sortByLocationNameThenAgeGroup(dataset, ageGroup, metric) {
  var sorted = {};
  var countriesSeen = {};
  var maxMean = 0;
  var classFriendlyLocation;

  ageGroup = ageGroup || 'age_group';
  sorted.countryNames = [];

  for (var i = 0; i < dataset.length; i++) {
    var curr = dataset[i];
    var currLocation = curr.location_name;
    var currAgeGroup = curr.age_group;
    classFriendlyLocation = currLocation.replace(/[ -,]/g, '');

    if (!sorted[classFriendlyLocation]) sorted[classFriendlyLocation] = {
      location_name: currLocation,
      male: [],
      female: []
    };

    //if (!sorted[currLocation][currAgeGroup]) sorted[currLocation][currAgeGroup] = [];
    if(currAgeGroup === ageGroup && curr.sex != 'both' && curr.metric == metric) {
      sorted[classFriendlyLocation][curr.sex].push(curr);
      if (curr.mean > maxMean) maxMean = curr.mean;

      //creates array of country names
      if(!countriesSeen[currLocation]) {
        sorted.countryNames.push(currLocation);
        countriesSeen[currLocation] = true;
      }
    }
  };
  sorted.maxMean = maxMean;
  return sorted;
}

function updateChecked(data, country, gender) {
    var maleLine = d3.select('.male-' + country);
    var femaleLine = d3.select('.female-' + country);
    if (gender === 'male') {
      if (MALE && !maleLine.node()) {
        drawLine(data, country, 'male');
      } else {
        maleLine.remove();
      }  
    } else {
      if (FEMALE && !femaleLine.node()) {
        console.log('HIT')
        drawLine(data, country, 'female');
      }else {
        femaleLine.remove();
      }
    }
}

function drawLine(data, country, gender) {
  country = country.replace(/[ -,]/g, '')
  var chart = d3.select('#display');
  var strokeColor = gender === 'male' ? 'blue' : 'red';

  var line = chart.append('path')
    .attr('d', svgLine(data[country][gender]))
    .attr('stroke-width', 2)
    .attr('stroke', strokeColor)
    .attr('fill', 'none')
    .attr('transform', 'translate(' + MARGINS.left + ')')
    .attr('class', gender + '-' + country);

  return line;
}

function drawCountry(data, country) {
  drawLine(data, country, 'female');
  drawLine(data, country, 'male');
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
