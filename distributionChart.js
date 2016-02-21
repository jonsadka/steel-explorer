var dMargin = {top: 20, right: 30, bottom: 20, left: 40},
    dWidth = RIGHT_CHARTS_WIDTH - dMargin.left - dMargin.right,
    dHeight = RIGHT_ROW_2_HEIGHT - dMargin.top - dMargin.bottom - 10;

var dx0 = d3.scale.linear()
    .range([0, dWidth]);

var dy0 = d3.scale.linear()
    .range([dHeight, 0]);

var dVoronoi = d3.geom.voronoi()
  .x(function(d){ return dx0(+d.W); })
  .y(function(d){ return dy0(+d.d); })
  .clipExtent([[0, 0], [dWidth, dHeight]]);

var dXAxis = d3.svg.axis()
    .scale(dx0)
    .orient('top');

var dYAxis = d3.svg.axis()
    .scale(dy0)
    .tickValues([0, 25, 50])
    .orient('left');

var dSvg = d3.select('#bottom-row').append('svg')
    .attr('width', dWidth + dMargin.left + dMargin.right)
    .attr('height', dHeight + dMargin.top + dMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + dMargin.left + ',' + dMargin.top + ')');

function initializeDistributionChart(){
  dx0.domain([0, 800]);
  dy0.domain([50, 0]);

  var beams = Object.keys(W_BEAMS_MAP).map(function(shape){ return W_BEAMS_MAP[shape]; }).reverse();

  var wBeams = dSvg.selectAll('.w-beam.d')
      .data(beams)

  // x: 0 -> max weight
  // y: 0 -> max depth
  wBeams
    .enter().append('rect')
      .attr('class', function(d){ return 'w-beam d ' + d.AISC_Manual_Label.split('X')[0] + ' ' + d.AISC_Manual_Label;} )
      .attr('x', function(d){ return dx0(+d.W); })
      .attr('y', function(d){ return 0; })
      .attr('opacity', 0.10)
      .attr('height', 0)
      .attr('width', 1.5)
    .transition().duration(600).delay(function(d, i){ return i * 8;})
      .attr('width', 0.25)
      .attr('height', function(d){ return dy0(+d.d); })

  wBeams
    .enter().append('circle')
      .attr('class', function(d){ return 'w-beam d ' + d.AISC_Manual_Label.split('X')[0] + ' ' + d.AISC_Manual_Label;} )
      .attr('cx', function(d){ return dx0(+d.W); })
      .attr('cy', function(d){ return dy0(+d.d); })
      .attr('r', 0)
    .transition().delay(function(d, i){ return i * 8 + 600;})
      .attr('r', .75)

  dSvg.append('g')
      .attr('class', 'x axis d')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(dXAxis)
    .append('text')
      .attr('y', 12)
      .attr('x', dWidth)
      .style('text-anchor', 'end')
      .text('Weight (plf.)');

  dSvg.append('g')
      .attr('class', 'y axis d')
      .call(dYAxis)
    .append('text')
      .attr('transform', 'rotate(-90), translate(' + (-dHeight + dMargin.bottom + dMargin.top) + ',0)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Depth (in)');

  // Voronoi chart for hover effects
  var voronoiGroup = dSvg.append('g')
    .attr('class', 'voronoi');

  // Generate voronoi polygons
  var voronoiData = dVoronoi(beams);

  voronoiGroup.selectAll('path')
      .data(voronoiData)
    .enter().append('path')
      .attr('d', function(d){ return 'M' + d.join('L') + 'Z';})
      .datum(function(d){ return d.point; })
      .on('mouseover', dMouseover)
      .on('mouseout', dMouseout);

    var dFocus = dSvg.append('g')
        .attr('transform', 'translate(-100,-100)')
        .attr('class', 'focus');

    dFocus.append('text')
        .attr('y', -10);

}

function highlightBeamDistribution(d){
  console.log(d)
  dSvg.select('.focus').attr('transform', 'translate(' +  (dx0(+d.W) + 8) + ',' + (dy0(+d.d) + dMargin.top) + ')');
  dSvg.select('.focus').select('text').text(d.AISC_Manual_Label);

  dSvg.select('rect.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label))
    .attr('fill', 'crimson')
    .attr('rx', 3)
    .attr('width', 2)
    .attr('opacity', 1)

  dSvg.selectAll('circle.w-beam.d')
    .attr('opacity', 0.35)

  dSvg.selectAll('circle.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label.split('X')[0]))
    .attr('opacity', 1)
    .attr('fill', 'crimson')
    .attr('cx', function(d){ return dx0(+d.W) + 1; })
    .attr('r', 1.75)

  dSvg.selectAll('circle.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label))
    .attr('fill', 'crimson')
    .attr('cx', function(d){ return dx0(+d.W) + 1; })
    .attr('r', 4)
}

function removeBeamDistribution(d){
  dSvg.select('.focus').attr('transform', 'translate(-100,-100)');
  dSvg.select('rect.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label))
    .attr('fill', 'black')
    .attr('rx', 0)
    .attr('width', 0.25)
    .attr('opacity', 0.5)

  dSvg.selectAll('circle.w-beam.d')
    .attr('fill', 'black')
    .attr('opacity', 1)
    .attr('r', 0.75)
}

function dMouseover(d) {
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function dMouseout(d) {
  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution(d);
}
