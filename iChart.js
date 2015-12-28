var iMargin = {top: 20, right: 20, bottom: 30, left: 50},
    iWidth = COL_1_WIDTH - iMargin.left - iMargin.right,
    iHeight = ROW_2_HEIGHT - iMargin.top - iMargin.bottom - 10;

var ix0 = d3.scale.ordinal()
    .rangePoints([iWidth, 0], .1);

var iy0 = d3.scale.linear()
    .range([iHeight, 0]);

var iXAxis = d3.svg.axis()
    .scale(ix0)
    .orient('bottom');

var iYAxis = d3.svg.axis()
    .scale(iy0)
    .orient('left');

var iSvg = d3.select('#bottom-left').append('svg')
    .attr('width', iWidth + iMargin.left + iMargin.right)
    .attr('height', iHeight + iMargin.top + iMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + iMargin.left + ',' + iMargin.top + ')');

function initializeIChart(){
  ix0.domain(W_BEAMS.map(function(d){ return d.key}));
  iy0.domain([SPECIAL.iBoundMin, SPECIAL.iBoundMax]);

  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS)
    .enter().append('g')
      .attr('class', function(d){ return 'g w-group I ' + d.key;})

  wGroup.selectAll('circle')
      .data(function(d) { return d.values; })
    .enter().append('circle')
      .attr('class', function(d){ return 'w-beam X' + d.W;})
      .attr('cx', function(d){
        var section = d.AISC_Manual_Label.split('X')[0];
        return ix0(section);
      })
      .attr('cy', function(d){ return iy0(+d.Ix); })
      .attr('r', 5);

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

function iUpdateI(){
}

function iUpdateWeight() {
  W_BEAMS_FILTERED = W_BEAMS.map(function(group){
    var groupValues = [];
    for (var i = 0; i < group.values.length; i++){
      var beam = group.values[i];
      if (validateBeam(beam, {valid: true, invalid: false, nullState: true})) groupValues.push(beam);
    }
    return {key: group.key, values: groupValues};
  })
  .filter(function(group){
    return group.values.length
  })

  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS_FILTERED, function(d) { return d.key; })

  wGroup.enter().append('g')
      .attr('class', function(d){ return 'g w-group I ' + d.key;})

  wGroup
    .attr('class', function(d){ return 'g w-group I ' + d.key;})

  var wBeams = wGroup.selectAll('circle')
      .data(function(d) { return d.values; })

  wBeams.enter().append('circle')
    .attr('class', function(d){ return 'w-beam X' + d.W;})
    .attr('cx', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('cy', function(d){ return iy0(+d.Ix); })
    .attr('r', 5);

  // Update scales only after the new dots have been entered
  ix0.domain(W_BEAMS_FILTERED.map(function(d){ return d.key;}));
  iy0.domain([SPECIAL.iBoundMin, SPECIAL.iBoundMax]);
  d3.selectAll('.x.axis.I')
    .transition().duration(2000).delay(1000)
    .call(iXAxis);
  d3.selectAll('.y.axis.I')
    .transition().duration(2000).delay(1000)
    .call(iYAxis);

  // Transition dots into their places
  wBeams.transition().duration(1000)
    .attr('opacity', filterOpacity)
    .attr('stroke', filterStroke)
    .attr('stroke-width', filterStrokeWidth);

  wBeams.transition().duration(2000).delay(1000)
    .attr('cx', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('cy', function(d){ return iy0(+d.Ix); })

  wBeams.exit().remove()
  wGroup.exit().remove()
}
