var iMargin = {top: 20, right: 22, bottom: 30, left: 42},
    iWidth = RIGHT_COL_2_WIDTH - iMargin.left - iMargin.right,
    iHeight = RIGHT_ROW_2_HEIGHT - iMargin.top - iMargin.bottom - 10;

var ix0 = d3.scale.ordinal()
    .rangeBands([iWidth, 0], .1);

var iy0 = d3.scale.linear()
    .range([iHeight, 0]);

// Color in Ix per W
console.log(colorbrewer)
var colorScale = d3.scale.quantize()
  .range(colorbrewer.RdYlGn[5].reverse())

var iXAxis = d3.svg.axis()
    .scale(ix0)
    .orient('bottom');

var iYAxis = d3.svg.axis()
    .scale(iy0)
    .orient('left');

var iSvg = d3.select('#bottom-right').append('svg')
    .attr('width', iWidth + iMargin.left + iMargin.right)
    .attr('height', iHeight + iMargin.top + iMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + iMargin.left + ',' + iMargin.top + ')');

function initializeIChart(){
  ix0.domain(W_BEAMS.map(function(d){ return d.key}));
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);
  colorScale.domain([SPECIAL.IxPerW.Min, SPECIAL.IxPerW.Min + (SPECIAL.IxPerW.Max- SPECIAL.IxPerW.Min)/2, SPECIAL.IxPerW.Max]);

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
      .attr('width', ix0.rangeBand())
      .attr('height', 3)
      .attr('stroke', function(d){ return colorScale(+d.Ix / +d.W); })

  iSvg.append('g')
      .attr('class', 'x axis I')
      .attr('transform', 'translate(0,' + iHeight + ')')
      .call(iXAxis);

  iSvg.append('g')
      .attr('class', 'y axis I')
      .call(iYAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Ix (in^4)');
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
    .attr('stroke', function(d){ return colorScale(+d.Ix / +d.W); })

  // Update scales only after the new dots have been entered
  ix0.domain(W_BEAMS_FILTERED.map(function(d){ return d.key;}));
  d3.selectAll('.x.axis.I')
    .transition().duration(1600).delay(500)
    .call(iXAxis);
  d3.selectAll('.y.axis.I')
    .transition().duration(1600).delay(500)
    .call(iYAxis);

  // Transition dots into their places
  colorScale.domain([SPECIAL.IxPerW.Min, SPECIAL.IxPerW.Min + (SPECIAL.IxPerW.Max- SPECIAL.IxPerW.Min)/2, SPECIAL.IxPerW.Max]);
  wBeams.transition().duration(500)
    .attr('stroke', function(d){ return colorScale(+d.Ix / +d.W); })
    .attr('stroke-width', iFilterStrokeWidth);

  wBeams.transition().duration(1600).delay(500)
    .attr('width', ix0.rangeBand())
    .attr('x', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('y', function(d){ return iy0(+d.Ix); })
    .attr('stroke', function(d){ return colorScale(+d.Ix / +d.W); })

  wBeams.exit().remove()
  wGroup.exit().remove()
}

function iFilterStrokeWidth(d) {
  return validateBeam(d, {valid: 1.25, invalid: 0});
}

function removeHighlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  if (!ix0(d.AISC_Manual_Label.split('X')[0])) return
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var wGroup = iSvg.select('.w-group.I.' + d.AISC_Manual_Label.split('X')[0])
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(d.W))
    .transition().duration(100)
    .attr('width', ix0.rangeBand())
    .attr('height', 3)
    .attr('fill', 'none')
    .attr('stroke', colorScale(+beam.Ix / +d.W))
    .attr('x', function(){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
}

function highlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  if (!ix0(d.AISC_Manual_Label.split('X')[0])) return
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var wGroup = iSvg.select('.w-group.I.' + d.AISC_Manual_Label.split('X')[0])
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(d.W))
    .attr('fill', 'crimson')
    .attr('stroke', 'crimson')
    .transition().duration(100)
    .attr('height', 1)
    .attr('width', ix0(d.AISC_Manual_Label.split('X')[0]) + ix0.rangeBand())
    .attr('x', 0)
}
