var iMargin = {top: 20, right: 27, bottom: 35, left: 60},
    iWidth = LEFT_CHARTS_WIDTH - iMargin.left - iMargin.right,
    iHeight = LEFT_ROW_3_HEIGHT - iMargin.top - iMargin.bottom;

var ix0 = d3.scale.ordinal()
    .rangeBands([iWidth, 0], .1);

var iy0 = d3.scale.linear()
    .range([iHeight, 0]);

var iVoronoi = d3.geom.voronoi()
  .x(function(d){ return ix0(d.AISC_Manual_Label.split('X')[0]) + ix0.rangeBand()/2; })
  .y(function(d){ return iy0(+d.Ix); })
  .clipExtent([[0, 0], [iWidth, iHeight]]);

var iXAxis = d3.svg.axis()
    .scale(ix0)
    .tickSize(-iHeight)
    .orient('bottom');

var iYAxis = d3.svg.axis()
    .scale(iy0)
    // .ticks(1)
    .orient('right');

var iSvg = d3.select('#bottom-container').append('svg')
    .attr('width', iWidth + iMargin.left + iMargin.right)
    .attr('height', iHeight + iMargin.top + iMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + iMargin.left + ',' + iMargin.top + ')');

function initializeIChart(){
  ix0.domain(W_BEAMS.map(function(d){ return d.key}));
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);

  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS, function(d) { return d.key; })
    .enter().append('g')
      .attr('class', function(d){ return 'g w-group I ' + d.key;})

  wGroup.selectAll('rect')
      .data(function(d) { return d.values; }, function(d) { return d.W; })
    .enter().append('rect')
      .attr('class', function(d){ return 'w-beam X' + d.W;})
      .attr('x', function(d){
        var section = d.AISC_Manual_Label.split('X')[0];
        return ix0(section);
      })
      .attr('y', function(d){ return iy0(+d.Ix); })
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', ix0.rangeBand())
      .attr('height', 3)
      .attr('fill-opacity', 0.4)
      .attr('fill', function(d){ return COLOR_SCALE(+d.Ix / +d.W); })

  iSvg.append('g')
      .attr('class', 'x axis I')
      .attr('transform', 'translate(0,' + iHeight + ')')
      .call(iXAxis);

  iSvg.append('g')
      .attr('class', 'y axis I')
      .call(iYAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -14)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Ix');

  // Voronoi chart for hover effects
  var voronoiGroup = iSvg.append('g')
    .attr('class', 'voronoi');

  // Generate voronoi polygons
  var voronoiData = iVoronoi([].concat.apply([], W_BEAMS.map(function(d){ return d.values})));

  voronoiGroup.selectAll('path')
      .data(voronoiData)
    .enter().append('path')
      .attr('d', function(d, i){return 'M' + d.join('L') + 'Z';})
      .datum(function(d){ return d.point; })
      .on('mouseover', iMouseover)
      .on('mouseout', iMouseout);
}

function iUpdateWeight() {
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);

  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS, function(d) { return d.key; })

  wGroup.enter().append('g')
    .attr('class', function(d){ return 'g w-group I ' + d.key;})

  wGroup
    .attr('class', function(d){ return 'g w-group I ' + d.key;})

  var wBeams = wGroup.selectAll('rect')
      .data(function(d) { return d.values; }, function(d) { return d.W; })

  wBeams.enter().append('rect')
    .attr('class', function(d){ return 'w-beam X' + d.W;})
    .attr('x', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('y', function(d){ return iy0(+d.Ix); })
    .attr('width', ix0.rangeBand())
    .attr('height', 3)
    .attr('fill', function(d){ return COLOR_SCALE(+d.Ix / +d.W); })

  // Update scales only after the new dots have been entered
  ix0.domain(W_BEAMS_FILTERED.map(function(d){ return d.key;}));
  d3.selectAll('.x.axis.I')
    .transition().duration(TRANSITION_TIME).delay(500)
    .call(iXAxis);
  d3.selectAll('.y.axis.I')
    .transition().duration(TRANSITION_TIME).delay(500)
    .call(iYAxis);

  // Transition dots into their places
  wBeams.transition().duration(500)
    .attr('fill', function(d){ return COLOR_SCALE(+d.Ix / +d.W); })
    .attr('opacity', iFilterOpacity);

  wBeams.transition().duration(TRANSITION_TIME).delay(500)
    .attr('width', ix0.rangeBand())
    .attr('x', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('y', function(d){ return iy0(+d.Ix); })
    .attr('fill', function(d){ return COLOR_SCALE(+d.Ix / +d.W); })

  wBeams.exit().remove()
  wGroup.exit().remove()


  var voronoiGroup = iSvg.selectAll('.voronoi');
  var voronoiData = iVoronoi([].concat.apply([], W_BEAMS_FILTERED.map(function(d){ return d.values})));
  var voronoiLines = voronoiGroup.selectAll('path')
      .data(voronoiData)

  voronoiLines.enter().append('path')
      .attr('d', function(d, i){return 'M' + d.join('L') + 'Z';})
      .datum(function(d){ return d.point; })
      .on('mouseover', iMouseover)
      .on('mouseout', iMouseout);

  voronoiLines.attr('d', function(d){return 'M' + d.join('L') + 'Z';})
      .datum(function(d){ return d.point; })

  voronoiLines.exit().remove();
}

function iFilterOpacity(d) {
  var calculatedFill = COLOR_SCALE(+d.Ix / +d.W);
  return validateBeam(d, {valid: 1, invalid: 0});
}

function removeHighlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  if (!ix0(d.AISC_Manual_Label.split('X')[0])) return
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var wGroup = iSvg.select('.w-group.I.' + d.AISC_Manual_Label.split('X')[0])
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(d.W))

  // Remove the text label
  wGroup.select('.value').remove();

  wBeam.transition().duration(100)
    .attr('width', ix0.rangeBand())
    .attr('height', 3)
    .attr('fill', COLOR_SCALE(+beam.Ix / +d.W))
    .attr('fill-opacity', 0.4)
    .attr('x', function(){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
}

function highlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var isValidBeam = validateBeam(beam, {valid: true, invalid: false});
  if (isValidBeam === false) return;
  var section = d.AISC_Manual_Label.split('X')[0];
  var wGroup = iSvg.select('.w-group.I.' + section)
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(beam.W))

  wBeam
    .attr('height', 3)
    .transition().duration(50)
    .attr('width', ix0(section) + ix0.rangeBand())
    .attr('x', 0)
    .attr('fill-opacity', 1)

  var format = d3.format(',');
  wGroup.append('text')
    .text(format(+beam.Ix) + ' in⁴')
    .attr('class', function(d){ return 'w-beam value X' + beam.W;})
    .attr('x', ix0(section) - 4)
    .attr('fill', COLOR_SCALE(+beam.Ix / +beam.W))
    .attr('y', function(d){ return iy0(+beam.Ix); })
    .attr('alignment-baseline', 'middle')
    .transition().duration(50)
    .attr('text-anchor', 'end')
    .attr('x', -4)
}

function iMouseover(d) {
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function iMouseout(d) {
  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution(d);
}
