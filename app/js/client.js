'use strict';

var d3 = require('d3');
var config = require('./d3-config');
var x = config.x;
var y = config.y
var svgLine = config.line;
var area = config.area;
var tip = config.tip;
var countries = config.countries;

config.init();

var HEIGHT = 600;
var WIDTH = 1000;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };

var menus = d3.selectAll('select');
var checkboxes = d3.selectAll('input[type=checkbox]');

d3.csv('./data.csv', function(data) {

  data = parseData(data, '20+ yrs, age-standardized', 'obese');

  //populate selects with country names
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

  sorted.countryNames = [];

  for (var i = 0; i < dataset.length; i++) {
    var curr = dataset[i];
    var currLocation = curr.location_name;
    var currAgeGroup = curr.age_group;

    classFriendlyLocation = condenseLocationName(currLocation);
    //convert mean decimal to percentage
    curr.mean *= 100;

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

function updateChart(data, country, lineGroup) {
  country = condenseLocationName(country);
  countries.set(country, lineGroup);
  var firstCountryName = countries.get('firstCountry');
  var secondCountryName = countries.get('secondCountry');

  updateLine(data[country].male, 'male', lineGroup);
  updateLine(data[country].female, 'female', lineGroup);
  updateArea(data[firstCountryName], data[secondCountryName], 'male')
  updateArea(data[firstCountryName], data[secondCountryName], 'female')
}

function updateChecked(gender, checked) {
  var updateLines = d3.selectAll('.' + gender);
  var updateArea = d3.select('.area' + gender);
  var label = d3.select('label.' + gender);
  var visibility = checked ? 'visible' : 'hidden';
  var className = checked ? gender + ' checked' : gender;

  label.attr('class', className);
  updateLines.attr('visibility', visibility);
  updateArea.attr('visibility', visibility);
}

function drawChart(data) {
  var firstCountryData = data[countries.get('firstCountry')]
  var secondCountryData = data[countries.get('secondCountry')]

  drawLine(firstCountryData, 'male', 'firstCountry');
  drawLine(firstCountryData, 'female', 'firstCountry');
  drawLine(secondCountryData, 'male', 'secondCountry');
  drawLine(secondCountryData, 'female', 'secondCountry');
  drawArea(firstCountryData, secondCountryData, 'male');
  drawArea(firstCountryData, secondCountryData, 'female');
}

/**
*Draws a line in a group with the given gender and line group as a class. Adds chart dots.
*@param {Object} country data object
*@param {String} gender
*@param {String} line grouping the line belongs to
**/

function drawLine(data, gender, lineGroup) {
  data = data[gender];
  var lastY = +data[data.length - 1].mean;
  var countryName = data[0].location_name;
  var className = gender + ' ' + lineGroup;
  var group = d3.select('svg')
    .append('g')
    .attr('transform', 'translate(' + MARGINS.left + ')')
    .attr('class', className)

  group.append('path')
    .attr('d', svgLine(data))
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .attr('class', gender + ' ' + lineGroup)

  group.append("text")
    .attr("transform", "translate(" + (WIDTH - 50) + "," + y(lastY + 1.5) + ")")
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .attr('class', className)
    .text(countryName);

  group.selectAll('circle' + '.' + gender + '.' + lineGroup)
    .data(data)
    .enter()
    .append('circle')
    .attr('cy', function(d) {
      return y(d.mean);
    })
    .attr('cx', function(d) {
      return x(parseDate(d.year))
    })
    .attr('r', 4)
    .attr('class', className)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
}

function updateLine(data, gender, lineGroup) {
  var className = '.' + gender + '.' + lineGroup;
  //gets last y position for text
  var lastY = +data[data.length - 1].mean;
  var countryName = data[0].location_name;
  var line = d3.select('path' + className)
  var text = d3.select("text" + className); 
  var circles = d3.selectAll('g' + className + ' circle');
  var textWidth = countryName.length * 7;

  line.transition()
    .attr('d', svgLine(data))
    .duration(750)
    .ease('easeOutQuint');

  text.transition()
    .attr("transform", "translate(" + (WIDTH - textWidth) + "," + y(lastY + 1.5) + ")")
    .text(countryName)
    .duration(750)
    .ease('easeOutQuint');

  circles.data(data)
    .transition()
    .attr('cy', function(d) {
      return y(d.mean);
    })
    .attr('cx', function(d) {
      return x(parseDate(d.year))
    })
    .duration(750)
    .ease('easeOutQuint');
}

/**
*Filters line data for svg area tool.
*@param {Object} data used for first line
*@param {Object} data used for second line
*@param {String} gender
**/

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

/**
*Draws an area between the lines of the given gender.
*@param {Object} data used for first line
*@param {Object} data used for second line
*@param {String} gender
**/

function drawArea(dataOne, dataTwo, gender) {
  var areaData = parseAreaData(dataOne, dataTwo, gender);

  d3.select('#display')
    .append('g')
    .attr('transform', 'translate(' + MARGINS.left + ', 0)')
    .append('path')
    .attr('d', area(areaData))
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

function condenseLocationName(name) {
  return name.replace(/[ -,]/g, '')
}

function parseDate(date) {
  return new Date(date, 0, 1)
}
