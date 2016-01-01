var pMargin = {top: 20, right: 20, bottom: 30, left: 50},
    pWidth = LEFT_CHARTS_WIDTH - pMargin.left - pMargin.right,
    pHeight = LEFT_ROW_2_HEIGHT - pMargin.top - pMargin.bottom - 10;

var px0 = d3.scale.linear()
    .range([0, pWidth], .1);

var py0 = d3.scale.linear()
    .range([0, pHeight]);

var pXAxis = d3.svg.axis()
    .scale(px0)
    .orient('bottom');

var pYAxis = d3.svg.axis()
    .scale(py0)
    .orient('left');

var pSvg = d3.select('#bottom-container').append('svg')
    .attr('width', pWidth + pMargin.left + pMargin.right)
    .attr('height', pHeight + pMargin.top + pMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + pMargin.left + ',' + pMargin.top + ')');

function initializeProfileChart(){
  px0.domain([0, SPECIAL.bf.Max]);
  py0.domain([SPECIAL.d.Max, 0]);

  var wGroup = pSvg.selectAll('.w-group.profile')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})
    .enter().append('rect')
      .attr('class', function(d){ return 'g w-group profile ' + d.key;})
      .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.Max - +d.d.Max)) / 2; })
      .attr('width', function(d){ return px0(+d.bf.Max); })
      .attr('height', function(d){ return py0(SPECIAL.d.Max - +d.d.Max); })
      .attr('stroke', 'steelblue')
      .attr('fill', 'RGBA(100, 100, 100, 0.01)')

  pSvg.append('g')
      .attr('class', 'x axis p')
      .attr('transform', 'translate(0,' + pHeight + ')')
      .call(pXAxis)
    .append('text')
      .attr('x', pWidth)
      .style('text-anchor', 'end')
      .text('Width (in.)');

  pSvg.append('g')
      .attr('class', 'y axis p')
      .call(pYAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Height (in.)');
}

function pUpdateWeight(){
  var wGroup = pSvg.selectAll('.w-group.profile')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})

  wGroup.enter().append('rect')
    .attr('class', function(d){ return 'g w-group profile ' + d.key;})
    .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.Max - +d.d.Max)) / 2; })
    .attr('width', function(d){ return px0(+d.bf.Max); })
    .attr('height', function(d){ return Math.max(0, py0(SPECIAL.d.Max - +d.d.Max)); })
    .attr('stroke', 'steelblue')
    .attr('fill', 'RGBA(100, 100, 100, 0.01)')

  // Update scales only after the new rectangles have been entered
  px0.domain([0, SPECIAL.bf.Max]);
  py0.domain([SPECIAL.d.Max, 0]);
  d3.selectAll('.x.axis.p')
    .transition().duration(1600).delay(500)
    .call(pXAxis);
  d3.selectAll('.y.axis.p')
    .transition().duration(1600).delay(500)
    .call(pYAxis);

  // Transition rectangles into their places
  wGroup.transition().duration(500)
    .attr('class', function(d){ return 'g w-group profile ' + d.key;})

  wGroup.transition().duration(1600).delay(500)
    .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.Max - +d.d.Max)) / 2; })
    .attr('width', function(d){ return px0(+d.bf.Max); })
    .attr('height', function(d){ return py0(SPECIAL.d.Max - +d.d.Max); })

  wGroup.exit().remove();
}
