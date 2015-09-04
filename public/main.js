
function sortByLocationNameThenAgeGroup(dataset, ageGroup, metric) {
  var sorted = {};
  var yearsSeen = {
    male: {},
    female: {}
  };
  ageGroup = ageGroup || 'age_group'

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
    }
  };
  return sorted;
}

var height = 350;
var width = 500;


var COUNTRY = "United States";
var YEAR_STANDARD = 1989;

var drawLine = d3.svg.line()
    .x(function(d) { 
      return (d.year - YEAR_STANDARD) * 20; })
    .y(function(d) { return d.mean * 1000; });

var chart = d3.select('#display')

d3.csv('./data.csv', function(data) {

  data = sortByLocationNameThenAgeGroup(data, "20+ yrs, age-standardized", 'obese');
  console.log(data);
  // chart.selectAll('path').enter().data(data);
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
    male.transition()
      .attr('d', drawLine(data[COUNTRY].male))
      .duration(750)
      .ease('easeOutQuint')

    female.transition()
      .attr('d', drawLine(data[COUNTRY].female))
      .duration(750)
      .ease('easeOutQuint')

  //   chart.selectAll('.dot')
  //   .data(data[COUNTRY].male)
  //   .enter().append('path')
  //   .attr('class', function(d) {
  //     return d.sex
  //   })
  //   .attr('d', drawLine(data[COUNTRY].male))
  //   .attr('stroke-width', 2)
  //   .attr('stroke', 'blue')
  //   .attr('fill', 'none')
  }


  setTimeout(function() {
    update(data, 'Afghanistan')
  }, 2000)

  
})