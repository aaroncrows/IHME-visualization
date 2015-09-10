'use strict';

var d3 = require('d3');
var config = require('./d3-config');
var x = config.x;
var y = config.y;
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

var COUNTRIES = {
  firstCountry: 'Afghanistan',
  secondCountry: 'UnitedStates'
}

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

  updateChart(data)

  menus.on('change', function() {
    var country = parseLocation(this.value);
    countries.set(country, this.id);
    updateChart(data);
  });

  checkboxes.on('change', function() {
    updateChecked(this.value, this.checked);
  });
});

function parseData(dataset, ageGroup, metric) {
  var sorted = {};
  var countriesSeen = {};
  var maxMean = 0;
  var location;
  var currLocation;
  var currAgeGroup;
  var curr;

  sorted.countryNames = [];

  for (var i = 0; i < dataset.length; i++) {
    curr = dataset[i];
    currLocation = curr.location_name;
    currAgeGroup = curr.age_group;
    curr.mean *= 100;
    location = parseLocation(currLocation);

    if (!sorted[location]) sorted[location] = {
      location_name: currLocation,
      male: [],
      female: []
    };

    if (currAgeGroup === ageGroup && curr.sex != 'both' &&
      curr.metric == metric) {
      sorted[location][curr.sex].push(curr);
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

function updateChecked(gender, checked) {
  var updateLines = d3.selectAll('.' + gender);
  var label = d3.select('label.' + gender);
  var visibility = checked ? 'visible' : 'hidden';
  var className = checked ? gender + ' checked' : gender;

  label.attr('class', className);
  updateLines.attr('visibility', visibility);
}

function updateChart(data) {
  var firstCountryData = data[countries.get('firstCountry')];
  var secondCountryData = data[countries.get('secondCountry')];
  var areaData = updateAreaData(firstCountryData, secondCountryData);
  var allCountryData = [
    firstCountryData.male,
    secondCountryData.male,
    firstCountryData.female,
    secondCountryData.female
  ];
  var svg;
  var groups;
  var areas;

  svg = d3.select('#display')

  groups = svg.selectAll('.pathGroup')
    .data(allCountryData, function(d, i) {
        return d[0].sex + i;
    });

    groups.transition()
      .attr('class', function(d, i) {
      return 'pathGroup ' + d[0].sex + i;
    })

    groups.enter()
    .append('g')
    .attr('class', function(d, i) {
      return 'pathGroup ' + d[0].sex + i;
    })
    .attr('transform', 'translate(' + MARGINS.left + ')')

  areas = svg.selectAll('.area')
      .data(areaData, function(d) {
        return d.gender;
      })

    areas.enter()
      .append('path')
      .attr('transform', 'translate(' + MARGINS.left + ', 0)')
      .attr('d', function(d) {
        return area(d.data);
      })
      .attr('class', function(d) {
        return 'area ' + d.gender;
      });

    areas.transition()
    .attr('d', function(d) {
      return area(d.data);
    })
    .duration(750)
    .ease('easeOutQuint');

  groups.each(function(d, i) {
    var gender = d[0].sex;
    var currentGroup = d3.select(this);
    var textOffsetY = Number(d[d.length - 1].mean) + 2;
    var textOffsetX = d[0].location_name.length * 6;
    var groupKey = d[0].sex + i;
    var paths;
    var circles;
    var text;

    paths = currentGroup.selectAll('path')
      .data(d, function(d, i) {
        return groupKey;
    });

    paths.transition()
      .attr('d', svgLine(d))
      .duration(750)
      .ease('easeOutQuint');

    paths.enter()
      .append('path')
      .attr('d', svgLine(d))
      .attr('class', function(d) {
        return gender;
      })
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    circles = currentGroup.selectAll('circle')
      .data(d, function(d, i) {
        return gender + i;
      });

    circles.enter()
      .append('circle')
      .attr('cy', function(d) {
        return y(d.mean);
      })
      .attr('cx', function(d) {
        return x(new Date(d.year, 0, 1))
      })
      .attr('r', 4)
      .attr('class', function(d) {
        return gender;
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

      circles.transition()
        .attr('cy', function(d) {
          return y(d.mean);
        })
        .attr('cx', function(d) {
          return x(new Date(d.year, 0, 1))
        })
        .duration(750)
        .ease('easeOutQuint');

    text = currentGroup.selectAll('text')
      .data(d, function(d) {
        return groupKey;
      });

    text.transition()
      .attr("transform", function(d) {
        return "translate(" + (WIDTH - textOffsetX) + "," + y(textOffsetY) + ")"
      })
      .text(function(d) {
        return d.location_name
      })
      .duration(750)
      .ease('easeOutQuint');

    text.enter()
      .append('text')
      .attr("transform", function(d) {
        return "translate(" + (WIDTH - textOffsetX) + "," + y(textOffsetY) + ")"
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .attr('class', function(d, i) {
        return gender;
      })
      .text(function(d) {
        return d.location_name
      });

  })
}

function updateAreaData(firstCountry, secondCountry) {
  var areaData = [];
  var genderData = [
    [firstCountry.male, secondCountry.male],
    [firstCountry.female, secondCountry.female]
  ]

  return genderData.map(function(d, i) {
    return {
      gender: i ? 'female' : 'male',
      data: parseAreaData(d)
    }
  })

  function parseAreaData(data) {
    var areaData = [];
    var y0;
    var y1;
    var meanOne;
    var meanTwo;

    for (var i = 0; i < data[0].length; i++) {
      meanOne = data[0][i].mean;
      meanTwo = data[1][i].mean;

      y0 = Math.min(meanOne, meanTwo);
      y1 = Math.max(meanOne, meanTwo);

      areaData.push({
        y0: y0,
        y1: y1,
        x: data[0][i].year
      })
    }
    return areaData;
  }
}

function parseLocation(location) {
  return location.replace(/[ ,-]/g, '');
}

function parseDate(date) {
  return new Date(date, 0, 1);
}
