'use strict';
//constants
var d3 = require('d3');

var HEIGHT = 500;
var WIDTH = 800;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };
var COUNTRIES = {
  firstCountry: {
    country: 'Afghanistan',
    colors: ['red', 'blue']
  },
  secondCountry: {
    country: 'Afghanistan',
    colors: ['purple', 'green']
  }
};

//scale
var x = d3.time.scale()
          .range([0, (WIDTH - MARGINS.right - MARGINS.left)])
          .domain([new Date(1990, 0, 1), new Date(2013, 0, 1)]);

var y = d3.scale.linear()
      .range([(HEIGHT - MARGINS.bottom - MARGINS.top), 0])
      .domain([0, 0.7]);

//svg elements
var svgLine = d3.svg.line()
      .x(function(d) {
          return x(new Date(d.year, 0, 1));
        })
      .y(function(d) {
          return y(d.mean);
        });

var area = d3.svg.area()
      .x(function(d) {
        console.log(d.x)
        return x(new Date(d.x, 0, 1));
      })
      .y0(function(d) {
        return y(d.y0);
      })
      .y1(function(d) {
        console.log(d.y1)
        return y(d.y1);
      })

var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(10);
var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

var chart = d3.select('#chart')
      .append('svg')
      .attr('height', HEIGHT)
      .attr('width', WIDTH)
      .attr('id', 'display');

chart.append('g').call(xAxis)
    .attr('transform', 'translate(' + MARGINS.left + ', ' +
      (HEIGHT - MARGINS.bottom) + ')')
    .attr('class', 'axis')
    .selectAll('text')
    .attr('y', 5)
    .attr('x', 6)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(45)')
    .style('text-anchor', 'start');

chart.append('g').call(yAxis)
    .attr('class', 'axis')
    .attr('transform', 'translate(' + MARGINS.left + ', ' + MARGINS.top + ')')
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr('dy', 7)
    .style("text-anchor", "end")
    .text("Mean");;

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

  drawCountry(data[COUNTRIES.firstCountry.country], 'firstCountry');
  drawCountry(data[COUNTRIES.secondCountry.country], 'secondCountry');

  menus.on('change', function() {
    updateChart(data, this.value, this.id);
  });

  checkboxes.on('change', function() {
    updateChecked(data, this.value, this.checked, this.name);
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

function updateLine(gender, data, lines) {
  var line = d3.select('.' + gender + '.' + lines)
    line.transition()
    .attr('d', svgLine(data))
    .attr('class', gender + ' ' + lines)
    .duration(750)
    .ease('easeOutQuint');
}

function updateChart(data, country, lines) {
  country = country.replace(/[ -,]/g, '');
  data = data[country];

  updateLine('male', data.male, lines);
  updateLine('female', data.female, lines);

  COUNTRIES[lines].country = country;
}

function updateChecked(data, gender, checked, lines) {
  var maleLines = d3.selectAll('.' + gender);
  var femaleLines = d3.selectAll('.' + gender);
  if (gender === 'male') {
    if (checked && !maleLines.node()) {
      drawGender(gender, data);
    } else {
      maleLines.remove();
    }
  } else {
    if (checked && !femaleLines.node()) {
      drawGender(gender, data);
    } else {
      femaleLines.remove();
    }
  }
}

function drawLine(gender, data, lines) {
  var chart = d3.select('#display');
  var strokeColor = gender === 'male' ? 'blue' : 'red';

  var line = chart.append('path')
    .attr('d', svgLine(data))
    .attr('stroke-width', 2)
    .attr('stroke', strokeColor)
    .attr('fill', 'none')
    .attr('transform', 'translate(' + MARGINS.left + ')')
    .attr('class', gender + ' ' + lines)

  return line;
}

function drawGender(gender, data) {
  var firstCountryData = data[COUNTRIES.firstCountry.country];
  var secondCountryData = data[COUNTRIES.secondCountry.country];

  drawLine(gender, firstCountryData[gender], 'firstCountry');
  drawLine(gender, secondCountryData[gender], 'secondCountry');
  drawArea(firstCountryData, secondCountryData, gender)
}

function drawCountry(data, lines) {

  drawLine('female', data.female, lines);
  drawLine('male', data.male, lines);
}

function drawArea(dataOne, dataTwo, gender) {
  var areaData = [];
  var color = gender === 'male' ? 'blue' : 'red';
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

  d3.select('#display')
    .append('g')
    .attr('transform', 'translate(' + MARGINS.left + ', 0)')
    .append('path')
    .attr('d', area(areaData))
    .attr('fill', color)

}

function testCircle() {
  var counter = 0;

  chart.append('circle')
      .attr('r', 10)
      .attr('cy', 0)
      .attr('cx', 200);

  setInterval(function() {
    chart.select('circle')
      .transition()
      .duration(1000)
      .attr('transform', 'translate(0, ' + (HEIGHT) + ')');

    counter += 10;
  }, 1000);
}
