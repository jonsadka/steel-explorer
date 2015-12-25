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
    .y(function(d){ return my0(d.Mn);});

var mSvg = d3.select('#top-row').append('svg')
    .attr('width', mWidth + mMargin.left + mMargin.right)
    .attr('height', mHeight + mMargin.top + mMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + mMargin.left + ',' + mMargin.top + ')');

function initializeMomentChart(){
  var special = calculateSpecialProperties(W_BEAMS, {});
  mx0.domain([0, MAX_UNBRACED]);
  my0.domain([0, special.yBound]);

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
}

function updateLength() {
  userLength = +document.getElementById('length-input').value;
  if (START_LENGTH === (userLength - 10)) return;
  START_LENGTH = Math.max(0, userLength - 10);
  endLength = (userLength === 0) ? MAX_UNBRACED : Math.min(MAX_UNBRACED, userLength + 10);

  mx0.domain([START_LENGTH, endLength]);
  var special = calculateSpecialProperties(W_BEAMS, {});
  my0.domain([0, special.yBound]);

  d3.selectAll('.x.axis')
    .transition().duration(2000)
    .call(mXAxis);

  d3.selectAll('.y.axis')
    .transition().duration(2000)
    .call(mYAxis);

  mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path.w-beam')
      .data(function(d) { return d.values; })
      .transition().duration(2000)
      .attr('d', function(d){ return mLine(d.MnValues); });
}

function updateWeight() {
  if (USER_WEIGHT === +document.getElementById('weight-input').value) return;
  USER_WEIGHT = +document.getElementById('weight-input').value;
  var special = calculateSpecialProperties(W_BEAMS, {});
  my0.domain([0, special.yBound]);

  d3.selectAll('.y.axis')
    .transition().duration(2000).delay(1000)
    .call(mYAxis);

  mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(1000)
      .attr('opacity', filterBeams)
      .attr('stroke', function(d){
        if (USER_WEIGHT && +d.W <= USER_WEIGHT) return '#00A1DC';
      })

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(2000).delay(1000)
      .attr('d', function(d){ return mLine(d.MnValues); })
      .attr('stroke-width', function(d){
        if (USER_WEIGHT && +d.W <= USER_WEIGHT) return 1.25;
      });
}

function calculateSpecialProperties(beams, options){
  var startLength = START_LENGTH || 0;
  var maxWeight = !!USER_WEIGHT ? Math.max(9, USER_WEIGHT) : Infinity;
  var special = beams.slice().reduce(function(pv, cv){
    var groupMax = cv.values.reduce(function(pv, cv){
      if (+cv.W > maxWeight){
        return pv;
      } else {
        return Math.max(pv, cv.MnFunction(startLength));
      }
    }, 0);

    pv.yMax = Math.max(pv.yMax, groupMax);
    return pv;
  }, {yMax: 0});
  var roundingBuffer = special.yMax * 0.01;
  special.yBound = Math.ceil(special.yMax / 12 / roundingBuffer) * roundingBuffer;
  return special;
}
