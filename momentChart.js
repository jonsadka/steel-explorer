var mMargin = {top: 20, right: 20, bottom: 30, left: 40},
    mWidth = CHARTS_WIDTH - mMargin.left - mMargin.right,
    mHeight = ROW_1_HEIGHT - mMargin.top - mMargin.bottom - 10;

var mx0 = d3.scale.linear()
    .range([0, mWidth], .1);

var my0 = d3.scale.linear()
    .range([mHeight, 0]);

var mXAxis = d3.svg.axis()
    .scale(mx0)
    .orient('bottom');

var mYAxis = d3.svg.axis()
    .scale(my0)
    .orient('left');

var mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn * PHI);});

var mSvg = d3.select('#top-row').append('svg')
    .attr('width', mWidth + mMargin.left + mMargin.right)
    .attr('height', mHeight + mMargin.top + mMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + mMargin.left + ',' + mMargin.top + ')');

function initializeMomentChart(){
  mx0.domain([0, MAX_UNBRACED]);
  my0.domain([SPECIAL.yBoundMin * PHI, SPECIAL.yBoundMax * PHI]);

  var wGroup = mSvg.selectAll('.w-group')
      .data(W_BEAMS)
    .enter().append('g')
      .attr('class', function(d){ return 'g w-group ' + d.key;})

  wGroup.selectAll('.w-beam')
      .data(function(d) { return d.values; })
    .enter().append('path')
      .attr('class', function(d){ return 'w-beam X' + d.W;})
      .attr('d', function(d){ return mLine(d.MnValues); })
      .attr('opacity', 0.15);

  mSvg.append('rect')
      .attr('class', 'covers')
      .attr('transform', 'translate(' + -mMargin.left + ',' + 0 + ')')
      .attr({
        x: 0,
        y: 0,
        height: mHeight + mMargin.bottom,
        width: mMargin.left,
        fill: 'white'
      })

  mSvg.append('rect')
      .attr('class', 'covers')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      .attr({
        x: -mMargin.left,
        y: -mMargin.top,
        height: mMargin.top,
        width: mMargin.left + mWidth + mMargin.right,
        fill: 'white'
      })

  mSvg.append('rect')
      .attr('class', 'covers')
      .attr('transform', 'translate(' + mWidth + ',' + 0 + ')')
      .attr({
        x: 0,
        y: 0,
        height: mHeight + mMargin.bottom,
        width: mMargin.right,
        fill: 'white'
      })

  mSvg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + mHeight + ')')
      .call(mXAxis)
    .append('text')
      .attr('x', mWidth)
      .style('text-anchor', 'end')
      .text('Unbraced Length');

  mSvg.append('g')
      .attr('class', 'y axis')
      .call(mYAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Available Moment (k-ft) - Phi not yet applied');
}

function mUpdateLength() {
  mx0.domain([START_LENGTH, endLength]);
  my0.domain([SPECIAL.yBoundMin * PHI, SPECIAL.yBoundMax * PHI]);

  d3.selectAll('.x.axis')
    .transition().duration(2000)
    .call(mXAxis);

  d3.selectAll('.y.axis')
    .transition().duration(2000)
    .call(mYAxis);

  mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn * PHI);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path.w-beam')
      .data(function(d) { return d.values; })
      .transition().duration(2000)
      .attr('d', function(d){ return mLine(d.MnValues); });
}

function mUpdateWeight() {
  my0.domain([SPECIAL.yBoundMin * PHI, SPECIAL.yBoundMax * PHI]);

  d3.selectAll('.y.axis')
    .transition().duration(2000).delay(1000)
    .call(mYAxis);

  mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn * PHI);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(1000)
      .attr('opacity', filterOpacity)
      .attr('stroke', filterStroke)
      .attr('stroke-width', filterStrokeWidth);

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(2000).delay(1000)
      .attr('d', function(d){ return mLine(d.MnValues); });
}

function filterOpacity(d){
  return validateBeam(d, {valid: 0.5, invalid: 0.09, nullState: 0.09});
}

function filterStroke(d){
  return validateBeam(d, {valid: '#00A1DC'});
}

function filterStrokeWidth(d){
  return validateBeam(d, {valid: 1.25});
}
