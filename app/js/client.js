'use strict';
//constants
var d3 = require('d3');
var config = require('./d3-init');
var x = config.x;
var y = config.y
var svgLine = config.line;
var area = config.area;
var tip = config.tip;

config.init();

var HEIGHT = 600;
var WIDTH = 1000;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };
var COUNTRIES = {
  firstCountry: 'Afghanistan',
  secondCountry: 'Afghanistan'
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
  var className = '.' + gender + '.' + lines;
  var lastY = +data[data.length - 1].mean;
  var countryName = data[0].location_name;
  var line = d3.select('path' + className)
  var text = d3.select("text" + className); 
  var circles = d3.selectAll('g' + className + ' circle');
  var textWidth = text.node().getComputedTextLength();

    line.transition()
    .attr('d', svgLine(data))
    .duration(750)
    .ease('easeOutQuint');

  text.transition()
    .attr("transform", "translate(" + (WIDTH + 3 - textWidth) + "," + y(lastY + .015) + ")")
    .text(countryName)
    .duration(750)
    .ease('easeOutQuint');

  circles.data(data)
    .transition()
    .attr('cy', function(d) {
      return y(d.mean);
    })
    .attr('cx', function(d) {
      return x(new Date(d.year, 0, 1))
    })
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
  var label = d3.select('label.' + gender);
  var visibility = checked ? 'visible' : 'hidden';
  var className = checked ? gender + ' checked' : gender;

  label.attr('class', className);
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
  var strokeColor = gender === 'male' ? 'blue' : 'red';
  var lastY = +data[data.length - 1].mean;
  var countryName = data[0].location_name;
  var className = gender + ' ' + lines;
  var group = d3.select('svg')
    .append('g')
    .attr('transform', 'translate(' + MARGINS.left + ')')
    .attr('class', className)

  group.append('path')
    .attr('d', svgLine(data))
    .attr('stroke-width', 2)
    .attr('stroke', strokeColor)
    .attr('fill', 'none')
    .attr('class', gender + ' ' + lines)

  group.append("text")
    .attr("transform", "translate(" + (WIDTH+3) + "," + y(lastY + .015) + ")")
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .attr('class', className)
    .style("fill", strokeColor)
    .text(countryName);

  group.selectAll('circle' + '.' + gender + '.' + lines)
    .data(data)
    .enter()
    .append('circle')
    .attr('cy', function(d) {
      return y(d.mean);
    })
    .attr('cx', function(d) {
      return x(new Date(d.year, 0, 1))
    })
    .attr('r', 4)
    .attr('fill', strokeColor)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
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
