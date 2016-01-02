var pMargin = {top: 20, right: 12, bottom: 20, left: 22},
    pWidth = RIGHT_COL_1_WIDTH - pMargin.left - pMargin.right,
    pHeight = RIGHT_ROW_2_HEIGHT - pMargin.top - pMargin.bottom - 10;

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

var pSvg = d3.select('#bottom-left').append('svg')
    .attr('width', pWidth + pMargin.left + pMargin.right)
    .attr('height', pHeight + pMargin.top + pMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + pMargin.left + ',' + pMargin.top + ')');

function initializeProfileChart(){
  var maxDimension = Math.max(SPECIAL.bf.boundMax, SPECIAL.d.boundMax);
  px0.domain([0, maxDimension]);
  py0.domain([maxDimension, 0]);

  pSvg.selectAll('.w-group.profile')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})
    .enter().append('text')
      .text(function(d){ return d.key; })
      .attr('x', function(d){ return (pWidth + px0(+d.bf.Max)) / 2 - 18; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
      .attr('fill', 'black')

  var wGroup = pSvg.selectAll('.w-group.profile')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})

  wGroup.enter().append('rect')
      .attr('class', function(d){ return 'g w-group profile ' + d.key;})
      .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
      .attr('width', function(d){ return px0(+d.bf.Max); })
      .attr('height', function(d){ return py0(SPECIAL.d.boundMax - +d.d.Max); })
      .attr('stroke', 'RGBA(100, 100, 100, 0.3)')
      .attr('fill', 'RGBA(100, 100, 100, 0)')

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
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
    .attr('width', function(d){ return px0(+d.bf.Max); })
    .attr('height', function(d){ return Math.max(0, py0(SPECIAL.d.boundMax - +d.d.Max)); })
    .attr('stroke', 'RGBA(100, 100, 100, 0.3)')
    .attr('fill', 'RGBA(100, 100, 100, 0)')

  // Update scales only after the new rectangles have been entered
  var maxDimension = Math.max(SPECIAL.bf.boundMax, SPECIAL.d.boundMax);
  px0.domain([0, maxDimension]);
  py0.domain([maxDimension, 0]);
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
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
    .attr('width', function(d){ return px0(+d.bf.Max); })
    .attr('height', function(d){ return py0(SPECIAL.d.boundMax - +d.d.Max); })

  wGroup.exit().remove();
}

function removeBeamProfile(d){
  pSvg.selectAll('.w-group.selected-beam').remove();
}

function showBeamProfile(d){
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var tf = +beam.tf;
  var tw = +beam.tw;
  var bf = +beam.bf;
  var d = +beam.d;
  var rectangles = [
    {width: bf, height: d},
    {offsetX: (bf - tw) / 4 + tw / 2, width: (bf - tw) / 2, height: d - 2 * tf},
    {offsetX: -(bf - tw) / 4 - tw / 2, width: (bf - tw) / 2, height: d - 2 * tf},
    {offsetX: (bf - tw) / 2 + tw / 2, width: .25, height: d - 2 * tf - .05, stroke: 'none', fill: 'white'},
    {offsetX: -(bf - tw) / 2 - tw / 2, width: .25, height: d - 2 * tf - .05, stroke: 'none', fill: 'white'}
  ];
  pSvg.selectAll('.w-group.selected-beam')
      .data(rectangles)
    .enter().append('rect')
      .attr('class', function(d){ return 'w-group selected-beam ' + escapeCharacter(beam.AISC_Manual_Label); })
      .attr('x', function(d){
        if (d.offsetX) return (pWidth - px0(d.width)) / 2 + px0(d.offsetX);
        return (pWidth - px0(d.width)) / 2;
      })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - d.height)) / 2; })
      .attr('width', function(d){ return px0(d.width); })
      .attr('height', function(d){ return py0(SPECIAL.d.boundMax - d.height); })
      .attr('fill', function(d){
        if (d.fill) return d.fill;
        return 'none';
      })
      .attr('stroke', function(d){
        if (d.stroke) return d.stroke;
        return 'steelblue';
      })
      .attr('stroke-width', 1)
}
