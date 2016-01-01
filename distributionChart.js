var dMargin = {top: 20, right: 30, bottom: 20, left: 30},
    dWidth = LEFT_CHARTS_WIDTH - dMargin.left - dMargin.right,
    dHeight = LEFT_ROW_3_HEIGHT - dMargin.top - dMargin.bottom - 10;

var dx0 = d3.scale.linear()
    .range([0, dWidth], .1);

var dy0 = d3.scale.linear()
    .range([dHeight, 0]);

var dXAxis = d3.svg.axis()
    .scale(dx0)
    .orient('bottom');

var dYAxis = d3.svg.axis()
    .scale(dy0)
    .orient('left');

var dSvg = d3.select('#bottom-container').append('svg')
    .attr('width', dWidth + dMargin.left + dMargin.right)
    .attr('height', dHeight + dMargin.top + dMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + dMargin.left + ',' + dMargin.top + ')');

function initializeDistributionChart(){
  dx0.domain([0, 750]);
  dy0.domain([0, 50]);

  var beams = Object.keys(W_BEAMS_MAP).map(function(shape){ return W_BEAMS_MAP[shape]; });

  var wBeams = dSvg.selectAll('.w-beam.d')
      .data(beams)

  // x: 0 -> max weight
  // y: 0 -> max depth
  wBeams
    .enter().append('rect')
      .attr('class', function(d){ return 'w-beam d ' + d.AISC_Manual_Label;} )
      .attr('x', function(d){ return dx0(+d.W); })
      .attr('y', function(d){ return dy0(0) - dy0(+d.d); })
      .attr('width', 0.25)
      .attr('height', function(d){ return dy0(+d.d); })

  dSvg.append('g')
      .attr('class', 'x axis I')
      .attr('transform', 'translate(0,' + dHeight + ')')
      .call(dXAxis)
    .append('text')
      .attr('x', dWidth)
      .style('text-anchor', 'end')
      .text('Weight (plf.)');

  dSvg.append('g')
      .attr('class', 'y axis I')
      .call(dYAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Depth (in)');

}
