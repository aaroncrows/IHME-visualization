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
  firstCountry: {
    country: 'Afghanistan',
    colors: ['red', 'blue']
  },
  secondCountry: {
    country: 'UnitedStates',
    colors: ['purple', 'green']
  }
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

  // drawCountry(data[COUNTRIES.firstCountry.country], 'firstCountry');
  // drawCountry(data[COUNTRIES.secondCountry.country], 'secondCountry');
  drawGender('male', data);
  drawGender('female', data);

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
  COUNTRIES[lines].country = country;
  //data = data[country];

  updateLine('male', data[country].male, lines);
  updateLine('female', data[country].female, lines);
  updateArea(data[COUNTRIES.firstCountry.country], data[COUNTRIES.secondCountry.country], 'male')
  updateArea(data[COUNTRIES.firstCountry.country], data[COUNTRIES.secondCountry.country], 'female')

}

function updateChecked(data, gender, checked, lines) {
  var maleLines = d3.selectAll('.' + gender);
  var femaleLines = d3.selectAll('.' + gender);
  var maleArea = d3.select('.area' + gender);
  var femaleArea = d3.select('.area' + gender);
  console.log(maleLines, checked)


  if (gender === 'male') {
    if (checked) {
      //drawGender(gender, data);
      maleLines.attr('visibility', 'visible');
      maleArea.attr('visibility', 'visible')
    } else {
      // maleLines.remove();
      maleLines.attr('visibility', 'hidden');
      maleArea.attr('visibility', 'hidden');
    }
  } else {
    if (checked) {
      // drawGender(gender, data);
      femaleLines.attr('visibility', 'visible');
      femaleArea.attr('visibility', 'visible');
    } else {
      femaleLines.attr('visibility', 'hidden');
      femaleArea.attr('visibility', 'hidden');
      // femaleLines.remove();
      // femaleArea.remove();
    }
  }
}

function drawLine(gender, data, lines) {
  var chart = d3.select('#display');
  console.log(data);
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
  var color = gender === 'male' ? 'rgba(80, 80, 255, .5)' : 'rgba(255, 80, 80, .5)';
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
    .attr('class', 'area' + gender)

}

function updateArea(dataOne, dataTwo, gender) {
  var areaData = [];
  var color = gender === 'male' ? 'rgba(80, 80, 255, .5)' : 'rgba(255, 80, 80, .5)';
  var y0;
  var y1;
  var meanOne;
  var meanTwo;
  console.log('updateArea', dataOne, dataTwo)
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
  console.log('IN UPDATE', areaData)
  var area1 = d3.select('.area' + gender);
    console.log(area1)

    area1.transition()
    .attr('d', area(areaData))
    .duration(750)
    .ease('easeOutQuint');
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
