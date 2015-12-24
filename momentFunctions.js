var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = document.getElementById('right-column').offsetWidth - margin.left - margin.right,
    height = ROW_1_HEIGHT - margin.top - margin.bottom - 10;

var x0 = d3.scale.linear()
    .range([0, width], .1);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x0)
    .orient('bottom');

var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

var line = d3.svg.line()
    .x(function(d){ return x0(d.length);})
    .y(function(d){ return y(d.Mn);});

var svg = d3.select('#row-1').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

function initializeMomentChart(){
  var special = calculateSpecialProperties(W_BEAMS, {});
  x0.domain([0, MAX_UNBRACED]);
  y.domain([0, special.yBound]);

  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)
    .append('text')
      .attr('x', width)
      .style('text-anchor', 'end')
      .text('Unbraced Length');

  svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Available Moment (k-ft) - Phi not yet applied');

  var wGroup = svg.selectAll('.w-group')
      .data(W_BEAMS)
    .enter().append('g')
      .attr('class', function(d){ return 'g w-group ' + d.key;})

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
    .enter().append('path')
      .attr('d', function(d){ return line(d.MnValues); })
      .attr('opacity', 0.15);
}

function updateLength() {
  userLength = +document.getElementById('length-input').value;
  if (START_LENGTH === (userLength - 10)) return;
  START_LENGTH = Math.max(0, userLength - 10);
  endLength = (userLength === 0) ? MAX_UNBRACED : Math.min(MAX_UNBRACED, userLength + 10);

  x0.domain([START_LENGTH, endLength]);
  var special = calculateSpecialProperties(W_BEAMS, {});
  y.domain([0, special.yBound]);

  d3.selectAll('.x.axis')
    .transition().duration(2000)
    .call(xAxis);

  d3.selectAll('.y.axis')
    .transition().duration(2000)
    .call(yAxis);

  line = d3.svg.line()
    .x(function(d){ return x0(d.length);})
    .y(function(d){ return y(d.Mn);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(2000)
      .attr('d', function(d){ return line(d.MnValues); });
}

function updateWeight() {
  if (USER_WEIGHT === +document.getElementById('weight-input').value) return;
  USER_WEIGHT = +document.getElementById('weight-input').value;
  var special = calculateSpecialProperties(W_BEAMS, {});
  y.domain([0, special.yBound]);

  d3.selectAll('.y.axis')
    .transition().duration(2000).delay(1000)
    .call(yAxis);

  line = d3.svg.line()
    .x(function(d){ return x0(d.length);})
    .y(function(d){ return y(d.Mn);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(1000)
      .attr('opacity', filterBeams)
      .attr('stroke', function(d){
        if (USER_WEIGHT && +d.W <= USER_WEIGHT) return '#00A1DC';
      })

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(2000).delay(1000)
      .attr('d', function(d){ return line(d.MnValues); })
      .attr('stroke-width', function(d){
        if (USER_WEIGHT && +d.W <= USER_WEIGHT) return 1.25;
      });
}

function calculateSpecialProperties(beams, options){
  var startLength = START_LENGTH || 0;
  var maxWeight = !!USER_WEIGHT ? Math.max(9, USER_WEIGHT) : Infinity;
  var special = beams.slice().reduce(function(pv, cv){
    var groupMax = cv.values.reduce(function(pv, cv){
      if (+cv.W > maxWeight){
        return pv;
      } else {
        return Math.max(pv, cv.MnFunction(startLength));
      }
    }, 0);

    pv.yMax = Math.max(pv.yMax, groupMax);
    return pv;
  }, {yMax: 0});
  var roundingBuffer = special.yMax * 0.01;
  special.yBound = Math.ceil(special.yMax / 12 / roundingBuffer) * roundingBuffer;
  return special;
}
