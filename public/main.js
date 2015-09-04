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
  mainCountry: {
    country: "Afghanistan",
    colors: ['red', 'blue']
  },
  overlayOne: {
    country: 'Afghanistan',
    colors: ['purple', 'green']
  },
  overlayTwo: {
    country: 'Afghanistan',
    colors: ['yellow', 'brown']
  }
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
var checkboxes = d3.selectAll('input[type=checkbox]')
console.log(checkboxes)

d3.csv('./data.csv', function(data) {
  data = sortByLocationNameThenAgeGroup(data, "20+ yrs, age-standardized", 'obese');

  menus.selectAll('option')
    .data(data.countryNames)
    .enter()
    .append('option')
    .attr('value', function(d) { return d })
    .text(function(d) {return d})

  drawCountry(data, COUNTRIES.mainCountry, 'mainCountry');
  drawCountry(data, COUNTRIES.overlayOne, 'overlayOne');
  drawCountry(data, COUNTRIES.overlayTwo, 'overlayTwo');


  //event handlers
  menus.on('change', function() {
    updateChart(data, this.value, this.id);
  });

  checkboxes.on('change', function() {
    console.log(this.checked)
    MALE = !MALE;
    updateChecked(data, COUNTRIES[this.name], this.value, this.checked, this.name)
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

function updateChart(data, country, lines) {
  //TODO constants module? don't like tweaking global

  country = country.replace(/[ -,]/g, '');
  var prevCountry = COUNTRIES[lines].country;
  var maleLine = d3.select('.male-' + prevCountry + lines);
  var femaleLine = d3.select('.female-' + prevCountry + lines);

  maleLine.transition()
    .attr('d', svgLine(data[country].male))
    .attr('class', 'male-' + country + lines)
    .duration(750)
    .ease('easeOutQuint');


  femaleLine.transition()
    .attr('d', svgLine(data[country].female))
    .attr('class', 'female-' + country + lines)
    .duration(750)
    .ease('easeOutQuint');

  COUNTRIES[lines].country = country;
}

function updateChecked(data, country, gender, checked, lines) {
    var countryName = country.country;
    var colors = country.colors;
    console.log('IN UPDATE CHECKED', country);

    var maleLine = d3.select('.male-' + countryName + lines);
    var femaleLine = d3.select('.female-' + countryName + lines);
    if (gender === 'male') {
      if (checked && !maleLine.node()) {
        drawLine(data, country, 'male', colors[0], lines);
      } else {
        maleLine.remove();
      }  
    } else {
      if (checked && !femaleLine.node()) {
        console.log('HIT')
        drawLine(data, country, 'female', colors[1], lines);
      }else {
        femaleLine.remove();
      }
    }
}

function drawLine(data, country, gender, strokeColor, lines) {
  var countryName = country.country.replace(/[ -,]/g, '')
  var chart = d3.select('#display');

  var line = chart.append('path')
    .attr('d', svgLine(data[countryName][gender]))
    .attr('stroke-width', 2)
    .attr('stroke', strokeColor)
    .attr('fill', 'none')
    .attr('transform', 'translate(' + MARGINS.left + ')')
    .attr('class', gender + '-' + countryName + lines);

  return line;
}

function drawCountry(data, country, lines) {
  console.log(country);
  var countryName = country.country;
  var colors = country.colors;
  console.log(country, colors);
  drawLine(data, country, 'female', colors[1], lines);
  drawLine(data, country, 'male', colors[0], lines);
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
