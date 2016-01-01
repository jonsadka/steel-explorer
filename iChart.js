var iMargin = {top: 20, right: 20, bottom: 30, left: 50},
    iWidth = RIGHT_COL_1_WIDTH - iMargin.left - iMargin.right,
    iHeight = RIGHT_ROW_2_HEIGHT - iMargin.top - iMargin.bottom - 10;

var ix0 = d3.scale.ordinal()
    .rangePoints([iWidth, 0], .1);

var iy0 = d3.scale.linear()
    .range([iHeight, 0]);

// Radi size
// Shouldn't use radius, should color it where green is lower weight
var iy1 = d3.scale.linear()
    .range([7, 7])
    // .range([4, 12])
    .clamp(true);
var colorScale = d3.scale.quantize()
  .range(colorbrewer.PuOr[5].reverse())

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
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);
  iy1.domain([SPECIAL.W.Min, SPECIAL.W.Max]);
  colorScale.domain([SPECIAL.W.Min, SPECIAL.W.Min + (SPECIAL.W.Max- SPECIAL.W.Min)/2, SPECIAL.W.Max]);

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
      .attr('r', function(d){ return iy1(+d.W); })
      .attr('stroke', function(d){ return colorScale(+d.W); })

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
  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS, function(d) { return d.key; })

  wGroup.enter().append('g')
      .attr('class', function(d){ return 'g w-group I ' + d.key;})

  wGroup
    .attr('class', function(d){ return 'g w-group I ' + d.key;})

  var wBeams = wGroup.selectAll('circle')
      .data(function(d) { return d.values; }, function(d) { return d.W; })

  wBeams.enter().append('circle')
    .attr('class', function(d){ return 'w-beam X' + d.W;})
    .attr('cx', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('cy', function(d){ return iy0(+d.Ix); })
    .attr('r', function(d){ return iy1(+d.W); })
    .attr('stroke', function(d){ return colorScale(+d.W); })

  // Update scales only after the new dots have been entered
  ix0.domain(W_BEAMS_FILTERED.map(function(d){ return d.key;}));
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);
  d3.selectAll('.x.axis.I')
    .transition().duration(1600).delay(500)
    .call(iXAxis);
  d3.selectAll('.y.axis.I')
    .transition().duration(1600).delay(500)
    .call(iYAxis);


  // Transition dots into their places
  iy1.domain([SPECIAL.W.Min, SPECIAL.W.Max]);
  colorScale.domain([SPECIAL.W.Min, SPECIAL.W.Min + (SPECIAL.W.Max- SPECIAL.W.Min)/2, SPECIAL.W.Max]);
  wBeams.transition().duration(500)
    .attr('opacity', filterOpacity)
    .attr('stroke', filterStroke)
    .attr('stroke-width', filterStrokeWidth);

  wBeams.transition().duration(1600).delay(500)
    .attr('cx', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('cy', function(d){ return iy0(+d.Ix); })
    .attr('r', function(d){ return iy1(+d.W); })
    .attr('stroke', function(d){ return colorScale(+d.W); })

  wBeams.exit().remove()
  wGroup.exit().remove()
}
