'use strict';

var d3 = require('d3');
var dTip = require('d3-tip');

module.exports = exports = {};

var HEIGHT = 600;
var WIDTH = 1100;
var MARGINS = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };

var x = d3.time.scale()
          .range([0, (WIDTH - MARGINS.right - MARGINS.left)])
          .domain([new Date(1990, 0, 1), new Date(2013, 0, 1)]);

var y = d3.scale.linear()
      .range([(HEIGHT - MARGINS.bottom - MARGINS.top), 0])
      .domain([0, 0.7]);

//svg elements
var tip = dTip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<strong>Frequency:</strong> <span style='color:red'>" + d.mean + "</span>";
  })

exports.line = d3.svg.line()
      .x(function(d) {
          return x(new Date(d.year, 0, 1));
        })
      .y(function(d) {
          return y(d.mean);
        });

exports.area = d3.svg.area()
      .x(function(d) {
        return x(new Date(d.x, 0, 1));
      })
      .y0(function(d) {
        return y(d.y0);
      })
      .y1(function(d) {
        return y(d.y1);
      })
exports.init = function() {
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
      .text("Mean");

  chart.call(tip);
}

exports.x = x;
exports.y = y;
exports.tip = tip;