var mMargin = {top: 20, right: 20, bottom: 30, left: 40},
    mWidth = CHARTS_WIDTH - mMargin.left - mMargin.right,
    mHeight = ROW_1_HEIGHT - mMargin.top - mMargin.bottom - 10;

var mx0 = d3.scale.linear()
    .range([0, mWidth], .1);

var my0 = d3.scale.linear()
    .range([mHeight, 0]);

var mVoronoi = d3.geom.voronoi()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn * PHI);})
    .clipExtent([[-mMargin.left, -mMargin.top], [mWidth + mMargin.right, mHeight + mMargin.bottom]]);

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

  // Actual line chart
  var wGroup = mSvg.selectAll('.w-group.m')
      .data(W_BEAMS)
    .enter().append('g')
      .attr('class', function(d){ return 'g w-group m ' + d.key;})

  wGroup.selectAll('.w-beam')
      .data(function(d) { return d.values; })
    .enter().append('path')
      .attr('class', function(d){ return 'w-beam X' + d.W;})
      .attr('d', function(d){ return mLine(d.MnValues); })
      .attr('opacity', 0.15);

  // Voronoi chart for hover effects
  var voronoiGroup = mSvg.append('g')
    .attr('class', 'voronoi');

  setTimeout(function(){
    // Format / flatten data
    var nestedData = d3.nest()
      .key(function(d) { return mx0(d.length) + ',' + my0(d.Mn * PHI); })
      .rollup(function(v) { return v[0]; })
      .entries(d3.merge(W_BEAMS.map(function(d){
        return d3.merge(d.values.map(function(d){
          var beam = d;
          return d.MnValues.map(function(d){
            // Cache beam data
            d.AISC_Manual_Label = beam.AISC_Manual_Label;
            d.W = beam.W;
            return d;
          });
        }))
      })))
      .map(function(d) { return d.values; });
    // Generate voronoi polygons
    var voronoiData = mVoronoi(nestedData);

    // For debugging only
    // voronoiGroup.selectAll('circle')
    //     .data(nestedData)
    //   .enter().append('circle')
    //     .attr('cx', function(d){ return mx0(d.length); })
    //     .attr('cy', function(d){ return my0(d.Mn * PHI); })
    //     .attr('r', 2)

    voronoiGroup.selectAll('path')
        .data(voronoiData)
      .enter().append('path')
        .attr('d', function(d){ return 'M' + d.join('L') + 'Z';})
        .datum(function(d){ return d.point; })
        .on('mouseover', mMouseover)
        .on('mouseout', mMouseout);

    var focus = mSvg.append('g')
        .attr('transform', 'translate(-100,-100)')
        .attr('class', 'focus');

    focus.append('circle')
        .attr('r', 3.5);

    focus.append('text')
        .attr('y', -10);
  }, 0)

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
      .attr('class', 'x axis moment')
      .attr('transform', 'translate(0,' + mHeight + ')')
      .call(mXAxis)
    .append('text')
      .attr('x', mWidth)
      .style('text-anchor', 'end')
      .text('Unbraced Length');

  mSvg.append('g')
      .attr('class', 'y axis moment')
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

  d3.selectAll('.x.axis.moment')
    .transition().duration(1600)
    .call(mXAxis);

  d3.selectAll('.y.axis.moment')
    .transition().duration(1600)
    .call(mYAxis);

  mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length); })
    .y(function(d){ return my0(d.Mn * PHI); });

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path.w-beam')
      .data(function(d) { return d.values; })
      .transition().duration(1600)
      .attr('d', function(d){ return mLine(d.MnValues); });

  // Wait until the transition is done to recalculate and update the voronoi
  setTimeout(function(){
    var nestedData = d3.nest()
      .key(function(d) { return mx0(d.length) + ',' + my0(d.Mn * PHI); })
      .rollup(function(v) { return v[0]; })
      .entries(d3.merge(W_BEAMS.map(function(d){
        return d3.merge(d.values.map(function(d){
          var beam = d;
          return d.MnValues.map(function(d){
            // Cache beam data
            d.AISC_Manual_Label = beam.AISC_Manual_Label;
            d.W = beam.W;
            return d;
          });
        }))
      })))
      .map(function(d) { return d.values; });
    var voronoiData = mVoronoi(nestedData);

    var voronoiGroup = d3.selectAll('.voronoi');
    voronoiGroup.selectAll('path')
      .data(voronoiData)
      .attr('d', function(d){
        var subPath = d.join('L') || '0,0';
        return 'M' + subPath + 'Z';
      })
      .datum(function(d){ return d.point; });
  }, 1600);
}

function mUpdateWeight() {
  my0.domain([SPECIAL.yBoundMin * PHI, SPECIAL.yBoundMax * PHI]);

  d3.selectAll('.y.axis.moment')
    .transition().duration(1600).delay(500)
    .call(mYAxis);

  mLine = d3.svg.line()
    .x(function(d){ return mx0(d.length);})
    .y(function(d){ return my0(d.Mn * PHI);});

  var wGroup = d3.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(500)
      .attr('opacity', filterOpacity)
      .attr('stroke', filterStroke)
      .attr('stroke-width', filterStrokeWidth);

  wGroup.selectAll('path')
      .data(function(d) { return d.values; })
      .transition().duration(1600).delay(500)
      .attr('d', function(d){ return mLine(d.MnValues); });

  // Wait until the transition is done to recalculate and update the voronoi
  setTimeout(function(){
    var nestedData = d3.nest()
      .key(function(d) { return mx0(d.length) + ',' + my0(d.Mn * PHI); })
      .rollup(function(v) { return v[0]; })
      .entries(d3.merge(W_BEAMS.map(function(d){
        return d3.merge(d.values.map(function(d){
          var beam = d;
          return d.MnValues.map(function(d){
            // Cache beam data
            d.AISC_Manual_Label = beam.AISC_Manual_Label;
            d.W = beam.W;
            return d;
          });
        }))
      })))
      .map(function(d) { return d.values; });
    var voronoiData = mVoronoi(nestedData);

    var voronoiGroup = d3.selectAll('.voronoi');
    voronoiGroup.selectAll('path')
      .data(voronoiData)
      .attr('d', function(d){
        var subPath = d.join('L') || '0,0';
        return 'M' + subPath + 'Z';
      })
      .datum(function(d){ return d.point; });
  }, 1600 + 500);
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

function mMouseover(d) {
  var wGroup = mSvg.select('.' + d.AISC_Manual_Label.split('X')[0]);
  var wBeam = wGroup.select('.X' + escapeCharacter(d.W));
  wGroup.classed('group--hover', true);
  wBeam.classed('beam--hover', true);
  // wBeam.parentNode.appendChild(wBeam);
  mSvg.select('.focus').attr('transform', 'translate(' + mx0(d.length) + ',' + my0(d.Mn * PHI) + ')');
  mSvg.select('.focus').select('text').text(d.AISC_Manual_Label);
}

function mMouseout(d) {
  var wGroup = mSvg.select('.' + d.AISC_Manual_Label.split('X')[0]);
  var wBeam = wGroup.select('.X' + escapeCharacter(d.W));
  wGroup.classed('group--hover', false);
  wBeam.classed('beam--hover', false);
  mSvg.select('.focus').attr('transform', 'translate(-100,-100)');
}
