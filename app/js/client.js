'use strict';
//constants
var d3 = require('d3');

var init = require('./d3-init');
var x = init.x;
var y = init.y
var svgLine = init.line;
var area = init.area;

init.init();

var HEIGHT = 500;
var WIDTH = 800;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };
var COUNTRIES = {
  firstCountry: 'Afghanistan',
  secondCountry: 'UnitedStates'
};

var menus = d3.selectAll('select');
var checkboxes = d3.selectAll('input[type=checkbox]');

d3.csv('./data.csv', function(data) {

  data = parseData(data, '20+ yrs, age-standardized', 'obese');

  menus.selectAll('option')
    .data(data.countryNames)
    .enter()
    .append('option')
    .attr('value', function(d) { return d; })
    .text(function(d) {return d; });

  drawChart(data)

  menus.on('change', function() {
    updateChart(data, this.value, this.id);
  });

  checkboxes.on('change', function() {
    updateChecked(this.value, this.checked);
  });
});

//helpers
function parseData(dataset, ageGroup, metric) {
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

    if (currAgeGroup === ageGroup && curr.sex != 'both' &&
      curr.metric == metric) {
      sorted[classFriendlyLocation][curr.sex].push(curr);
      if (curr.mean > maxMean) maxMean = curr.mean;

      //creates array of country names
      if (!countriesSeen[currLocation]) {
        sorted.countryNames.push(currLocation);
        countriesSeen[currLocation] = true;
      }
    }
  }
  sorted.maxMean = maxMean;
  return sorted;
}

function updateLine(data, gender, lines) {
  var line = d3.select('.' + gender + '.' + lines)
    line.transition()
    .attr('d', svgLine(data))
    .attr('class', gender + ' ' + lines)
    .duration(750)
    .ease('easeOutQuint');
}


function updateChart(data, country, lines) {
  country = country.replace(/[ -,]/g, '');
  COUNTRIES[lines] = country;

  updateLine(data[country].male, 'male', lines);
  updateLine(data[country].female, 'female', lines);
  updateArea(data[COUNTRIES.firstCountry], data[COUNTRIES.secondCountry], 'male')
  updateArea(data[COUNTRIES.firstCountry], data[COUNTRIES.secondCountry], 'female')
}

function updateChecked(gender, checked) {
  var updateLines = d3.selectAll('.' + gender);
  var updateArea = d3.select('.area' + gender);
  var visibility = checked ? 'visible' : 'hidden';

  updateLines.attr('visibility', visibility);
  updateArea.attr('visibility', visibility);
}

function drawChart(data) {
  var firstCountryData = data[COUNTRIES.firstCountry]
  var secondCountryData = data[COUNTRIES.secondCountry]

  drawLine('male', firstCountryData, 'firstCountry');
  drawLine('female', firstCountryData, 'firstCountry');
  drawLine('male', secondCountryData, 'secondCountry');
  drawLine('female', secondCountryData, 'secondCountry');
  drawArea(firstCountryData, secondCountryData, 'male');
  drawArea(firstCountryData, secondCountryData, 'female');
}

function drawLine(gender, data, lines) {
  data = data[gender];
  var chart = d3.select('#display');
  var strokeColor = gender === 'male' ? 'blue' : 'red';

  chart.append('path')
    .attr('d', svgLine(data))
    .attr('stroke-width', 2)
    .attr('stroke', strokeColor)
    .attr('fill', 'none')
    .attr('transform', 'translate(' + MARGINS.left + ')')
    .attr('class', gender + ' ' + lines)
}

function parseAreaData(dataOne, dataTwo, gender) {
  var areaData = [];
  var y0;
  var y1;
  var meanOne;
  var meanTwo;

  for (var i = 0; i < dataOne[gender].length; i++) {
    meanOne = dataOne[gender][i].mean;
    meanTwo = dataTwo[gender][i].mean;

    y0 = Math.min(meanOne, meanTwo);
    y1 = Math.max(meanOne, meanTwo);

    areaData.push({
      y0: y0,
      y1: y1,
      x: dataOne[gender][i].year
    })
  }
  return areaData;
}

function drawArea(dataOne, dataTwo, gender) {
  var areaData = parseAreaData(dataOne, dataTwo, gender);
  var color = gender === 'male' ? 'rgba(80, 80, 255, .5)' : 'rgba(255, 80, 80, .5)';

  d3.select('#display')
    .append('g')
    .attr('transform', 'translate(' + MARGINS.left + ', 0)')
    .append('path')
    .attr('d', area(areaData))
    .attr('fill', color)
    .attr('class', 'area' + gender);
}

function updateArea(dataOne, dataTwo, gender) {
  var areaData = parseAreaData(dataOne, dataTwo, gender);

  d3.select('.area' + gender)
    .transition()
    .attr('d', area(areaData))
    .duration(750)
    .ease('easeOutQuint');
}
