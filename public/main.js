
function sortByLocationNameThenAgeGroup(dataset, ageGroup, metric) {
  var sorted = {};
  var countriesSeen = {};

  ageGroup = ageGroup || 'age_group'
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

var height = 350;
var width = 500;


var COUNTRY = "United States";
var MALE = true;
var FEMALE = true;
var YEAR_STANDARD = 1989;

var drawLine = d3.svg.line()
    .x(function(d) { 
      return (d.year - YEAR_STANDARD) * 20; })
    .y(function(d) { return d.mean * 1000; });

var chart = d3.select('#display')

var menu = d3.select('#countries');
var maleCheck = d3.select('#male-check');
var femaleCheck = d3.select('#female-check');

d3.csv('./data.csv', function(data) {

  data = sortByLocationNameThenAgeGroup(data, "20+ yrs, age-standardized", 'obese');
  console.log(data);
  console.log(menu.selectAll('option'))


  menu.selectAll('option')
    .data(data.countryNames)
    .enter()
    .append('option')
    .attr('value', function(d) { return d })
    .text(function(d) {return d})

    console.log(d3.select('#menu').node())


  var female = chart.append('path')
    .attr('class', 'female')
    .attr('d', drawLine(data[COUNTRY].female))
    .attr('stroke-width', 2)
    .attr('stroke', 'red')
    .attr('fill', 'none')

  var male = chart.append('path')
    .attr('class', 'male')
    .attr('d', drawLine(data[COUNTRY].male))
    .attr('stroke-width', 2)
    .attr('stroke', 'blue')
    .attr('fill', 'none')



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
