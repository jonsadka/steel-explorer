var pMargin = {top: 20, right: 12, bottom: 20, left: 22},
    pWidth = RIGHT_COL_1_WIDTH - pMargin.left - pMargin.right,
    pHeight = RIGHT_ROW_2_HEIGHT - pMargin.top - pMargin.bottom - 10;

var px0 = d3.scale.linear()
    .range([0, pWidth], .1);

var py0 = d3.scale.linear()
    .range([0, pHeight]);

// for half axis
var px1 = d3.scale.linear()
    .range([0, pWidth/2]);
var px2 = d3.scale.linear()
    .range([0, pWidth/2]);
var pX1Axis = d3.svg.axis()
    .scale(px1)
    .ticks(4)
    .orient('bottom');
var pX2Axis = d3.svg.axis()
    .scale(px2)
    .ticks(4)
    .orient('bottom');
var py1 = d3.scale.linear()
    .range([0, pHeight/2]);
var py2 = d3.scale.linear()
    .range([0, pHeight/2]);
var pY1Axis = d3.svg.axis()
    .scale(py1)
    .ticks(4)
    .orient('left');
var pY2Axis = d3.svg.axis()
    .scale(py2)
    .ticks(4)
    .orient('left');

var pSvg = d3.select('#bottom-left').append('svg')
    .attr('width', pWidth + pMargin.left + pMargin.right)
    .attr('height', pHeight + pMargin.top + pMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + pMargin.left + ',' + pMargin.top + ')');

function initializeProfileChart(){
  var maxDimension = Math.max(SPECIAL.bf.boundMax, SPECIAL.d.boundMax);
  px0.domain([0, maxDimension]);
  px1.domain([maxDimension/2, 0]);
  px2.domain([0, maxDimension/2]);
  py0.domain([maxDimension, 0]);
  py1.domain([0, maxDimension/2]);
  py2.domain([maxDimension/2, 0]);

  var wGroup = pSvg.selectAll('.w-group')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})

  wGroup.enter().append('text')
      .attr('class', function(d){ return 'g w-group text ' + d.key;})
      .text(function(d){ return d.key; })
      .attr('x', function(d){ return (pWidth + px0(+d.bf.Max)) / 2; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
      .attr('fill', 'black')

  wGroup.enter().append('rect')
      .attr('class', function(d){ return 'g w-group profile ' + d.key;})
      .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
      .attr('width', function(d){ return px0(+d.bf.Max); })
      .attr('height', function(d){ return py0(SPECIAL.d.boundMax - +d.d.Max); })
      .attr('stroke', 'RGBA(100, 100, 100, 0.2)')
      .attr('fill', 'RGBA(100, 100, 100, 0)')

  pSvg.append('g')
      .attr('class', 'x axis p left')
      .attr('transform', 'translate(0,' + pHeight / 2 + ')')
      .call(pX1Axis)
  pSvg.append('g')
      .attr('class', 'x axis p right')
      .attr('transform', 'translate(' + pWidth / 2 + ',' + pHeight / 2 + ')')
      .call(pX2Axis)
    .append('text')
      .attr('x', pWidth / 2)
      .style('text-anchor', 'end')
      .text('Width (in.)');

  pSvg.append('g')
      .attr('class', 'y axis p top')
      .attr('transform', 'translate(' + pWidth / 2 + ',' + 0 + ')')
      .call(pY2Axis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Height (in.)');
  pSvg.append('g')
      .attr('class', 'y axis p bottom')
      .attr('transform', 'translate(' + pWidth / 2 + ',' + pHeight / 2 + ')')
      .call(pY1Axis)
}

function pUpdateWeight(){
  var wBeamGroup = pSvg.selectAll('.w-group.profile')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})

  var wTextGroup = pSvg.selectAll('.w-group.text')
      .data(SPECIAL.groupDimensions, function(d){ return d.key})

  wBeamGroup.enter().append('rect')
    .attr('class', function(d){ return 'g w-group profile ' + d.key;})
    .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
    .attr('width', function(d){ return px0(+d.bf.Max); })
    .attr('height', function(d){ return Math.max(0, py0(SPECIAL.d.boundMax - +d.d.Max)); })
    .attr('stroke', 'RGBA(100, 100, 100, 0.2)')
    .attr('fill', 'RGBA(100, 100, 100, 0)')

  wTextGroup.enter().append('text')
      .attr('class', function(d){ return 'g w-group text ' + d.key;})
      .text(function(d){ return d.key; })
      .attr('x', function(d){ return (pWidth + px0(+d.bf.Max)) / 2; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
      .attr('fill', 'black')

  // Update scales only after the new rectangles have been entered
  var maxDimension = Math.max(SPECIAL.bf.boundMax, SPECIAL.d.boundMax);
  px0.domain([0, maxDimension]);
  px1.domain([maxDimension/2, 0]);
  px2.domain([0, maxDimension/2]);
  py0.domain([maxDimension, 0]);
  py1.domain([0, maxDimension/2]);
  py2.domain([maxDimension/2, 0]);
  d3.selectAll('.x.axis.p.left')
    .transition().duration(1600).delay(500)
    .call(pX1Axis);
  d3.selectAll('.x.axis.p.right')
    .transition().duration(1600).delay(500)
    .call(pX2Axis);
  d3.selectAll('.y.axis.p.top')
    .transition().duration(1600).delay(500)
    .call(pY2Axis);
  d3.selectAll('.y.axis.p.bottom')
    .transition().duration(1600).delay(500)
    .call(pY1Axis);

  wTextGroup.transition().duration(1600).delay(500)
    .attr('x', function(d){ return (pWidth + px0(+d.bf.Max)) / 2; })
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })

  // Transition rectangles into their places
  wBeamGroup.transition().duration(500)
    .attr('class', function(d){ return 'g w-group profile ' + d.key;})

  wBeamGroup.transition().duration(1600).delay(500)
    .attr('x', function(d){ return (pWidth - px0(+d.bf.Max)) / 2; })
    .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - +d.d.Max)) / 2; })
    .attr('width', function(d){ return px0(+d.bf.Max); })
    .attr('height', function(d){ return py0(SPECIAL.d.boundMax - +d.d.Max); })

  wBeamGroup.exit().remove();
  wTextGroup.exit().remove();
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
    {offsetX: 0, offsetY: 0, width: tw, height: d, stroke: 'none', fill: 'steelblue'},
    {offsetX: 0, offsetY: (d - tf), width: bf, height: tf, stroke: 'none', fill: 'steelblue'},
    {offsetX: 0, offsetY: -(d - tf), width: bf, height: tf, stroke: 'none', fill: 'steelblue'},
  ];
  pSvg.selectAll('.w-group.selected-beam')
      .data(rectangles)
    .enter().append('rect')
      .attr('class', function(d){ return 'w-group selected-beam ' + escapeCharacter(beam.AISC_Manual_Label); })
      .attr('x', function(d){ return (pWidth - px0(d.width - d.offsetX)) / 2; })
      .attr('y', function(d){ return (pHeight - py0(SPECIAL.d.boundMax - d.height - d.offsetY)) / 2; })
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
