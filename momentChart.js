const BEAM_SIZE_FONT_SIZE = 42;

const mMargin = {top: 20, right: 20, bottom: 0, left: 20},
    mWidth = RIGHT_CHARTS_WIDTH - mMargin.left - mMargin.right,
    mHeight = RIGHT_ROW_2_HEIGHT - mMargin.top - mMargin.bottom;

const mx0 = d3.scaleLinear()
    .range([0, mWidth]);

const my0 = d3.scaleLinear()
    .range([mHeight, 0]);

const mVoronoi = d3.voronoi()
    .x(d => mx0(d.length))
    .y(d => my0(d.Mn * PHI))
    .extent([
      [0, 0],
      [mWidth, mHeight]
    ]);

const mXAxis = d3.axisTop()
    .scale(mx0);

const mYAxis = d3.axisLeft()
    .scale(my0);

let mLine = d3.line()
    .x(d => mx0(d.length))
    .y(d => my0(d.Mn * PHI));

const mSvg = d3.select('#middle-row').append('svg')
    .attr('width', mWidth + mMargin.left + mMargin.right)
    .attr('height', mHeight + mMargin.top + mMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + mMargin.left + ',' + mMargin.top + ')');

function initializeMomentChart(){
  mx0.domain([0, MAX_UNBRACED - 1]);
  my0.domain([SPECIAL.Mn.boundMin * PHI, SPECIAL.Mn.boundMax * PHI]);

  // Actual line chart
  var wGroup = mSvg.selectAll('.w-group.m')
      .data(W_BEAMS)
    .enter().append('g')
      .attr('class', d => 'g w-group m ' + d.key)

  wGroup.selectAll('.w-beam')
      .data(d => d.values)
    .enter().append('path')
      .attr('class', d => 'w-beam X' + d.W)
      .attr('d', d => mLine(d.MnValues))
      .attr('stroke-width', 0)
      .attr('opacity', 1)
    .transition().delay((d, i) => i * 80)
      .attr('opacity', 0.15)
      .attr('stroke-width', 1)

  // Voronoi chart for hover effects
  var voronoiGroup = mSvg.append('g')
    .attr('class', 'voronoi');

  setTimeout(() => {
    // Format / flatten data
    const nestedData = d3.nest()
      .key(d => mx0(d.length) + ',' + my0(d.Mn * PHI))
      .rollup(v => v[0])
      .entries(d3.merge(W_BEAMS.map(d =>
        d3.merge(d.values.map(d => {
          const beam = d;
          return d.MnValues.map(d => {
            // Cache beam data
            d.AISC_Manual_Label = beam.AISC_Manual_Label;
            d.W = beam.W;
            return d;
          });
        }))
      )))
      .map(d => d.value);
    // Generate voronoi polygons

    var voronoiDiagram = mVoronoi(nestedData);

    // For debugging only
    // voronoiGroup.selectAll('circle')
    //     .data(nestedData)
    //   .enter().append('circle')
    //     .attr('cx', d => mx0(d.length))
    //     .attr('cy', d => my0(d.Mn * PHI))
    //     .attr('r', 1)
    //     .attr('stroke', 'black')

    voronoiGroup.selectAll('path')
        .data(voronoiDiagram.polygons())
      .enter().append('path')
        .attr('d', d => 'M' + d.join('L') + 'Z')
        .datum(d => d.data)
        .on('mouseover', mMouseover)
        .on('mouseout', mMouseout);

    var mFocus = mSvg.append('g')
        .attr('transform', 'translate(-100,-100)')
        .attr('class', 'focus');

    mFocus.append('circle')
        .attr('r', 3.5);

    mFocus.append('text')
        .attr('y', -10);
  }, 0)

  mSvg.append('g')
      .attr('class', 'x axis moment')
      .attr('transform', 'translate(0,' + mHeight + ')')
      .call(mXAxis)

  mSvg.append('text')
      .attr('x', mWidth)
      .attr('y', mHeight - 10)
      .attr('text-anchor', 'end')
      .text('Unbraced Length');

  mSvg.append('g')
      .attr('class', 'y axis moment')
    .call(mYAxis.tickFormat(d3.format('.1s')))
    .selectAll('text')
      .attr('dx', '1em')

  mSvg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '-1em')
      .attr('text-anchor', 'end')
      .text('Available Moment (k-ft) - φ not yet applied');
}

function mUpdateWeight() {
  my0.domain([SPECIAL.Mn.boundMin * PHI, SPECIAL.Mn.boundMax * PHI]);

  d3.selectAll('.y.axis.moment')
  .transition().duration(TRANSITION_TIME).delay(500)
    .call(mYAxis.tickFormat(d3.format('.1s')))
    .selectAll('text')
      .attr('dx', '1em')

  mLine = d3.line()
    .x(d => mx0(d.length))
    .y(d => my0(d.Mn * PHI));

  var wGroup = mSvg.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(d => d.values)
      .transition().duration(500)
      .attr('opacity', mFilterOpacity)
      .attr('stroke', mFilterStroke)
      .attr('stroke-width', mFilterStrokeWidth);

  wGroup.selectAll('path')
      .data(d => d.values)
      .transition().duration(TRANSITION_TIME).delay(500)
      .attr('d', d => mLine(d.MnValues));

  // Wait until the transition is done to recalculate and update the voronoi
  setTimeout(() => {
    // Format / flatten data
    const nestedData = d3.nest()
      .key(d => mx0(d.length) + ',' + my0(d.Mn * PHI))
      .rollup(v => v[0])
      .entries(d3.merge(W_BEAMS.map(d =>
        d3.merge(d.values.map(d => {
          const beam = d;
          return d.MnValues.map(d => {
            // Cache beam data
            d.AISC_Manual_Label = beam.AISC_Manual_Label;
            d.W = beam.W;
            return d;
          });
        }))
      )))
      .map(d => d.value);
    // Generate voronoi polygons
    var voronoiDiagram = mVoronoi(nestedData);

    const voronoiData = voronoiDiagram.polygons();
    var voronoiGroup = mSvg.selectAll('.voronoi');
    voronoiGroup.selectAll('path')
    //   .data(voronoiDiagram.polygons())
    //   .attr('d', d => {console.log(d); return 'M' + (d.join('L') || '0,0') + 'Z'})
    //   .datum(d => d.data)
  }, TRANSITION_TIME + 500);
}

function mFilterOpacity(d){
  return validateBeam(d, {valid: 0.8, invalid: 0.09, nullState: 0.09});
}

function mFilterStroke(d){
  return validateBeam(d, {valid: '#60677D'});
}

function mFilterStrokeWidth(d){
  return validateBeam(d, {valid: 1.25, invalid: 0.5});
}

function mMouseover(d) {
  // wBeam.parentNode.appendChild(wBeam);
  mSvg.select('.focus').attr('transform', 'translate(' + mx0(d.length) + ',' + my0(d.Mn * PHI) + ')');
  mSvg.select('.focus').select('text').text(d.length + ' ft., ' + Math.round(d.Mn * PHI * 10) / 10 + ' k-ft.');
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function showBeamDetails(d){
  var wGroup = mSvg.select('.' + d.AISC_Manual_Label.split('X')[0]);
  var wBeam = wGroup.select('.X' + escapeCharacter(d.W));
  wGroup.classed('group--hover', true);
  wBeam.classed('beam--hover', true);
  mSvg.append('text')
    .text(d.AISC_Manual_Label)
    .attr('class', 'beam-text ' + d.AISC_Manual_Label)
    .attr('x', mWidth - mMargin.left)
    .attr('y', mMargin.top * 2)
    .style('font-size', BEAM_SIZE_FONT_SIZE)
    .attr('opacity', 0.3)
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'end')
}

function removeBeamDetails(d){
  mSvg.select('.beam-text.' + escapeCharacter(d.AISC_Manual_Label)).remove();
  var wGroup = mSvg.select('.' + d.AISC_Manual_Label.split('X')[0]);
  var wBeam = wGroup.select('.X' + escapeCharacter(d.W));
  wGroup.classed('group--hover', false);
  wBeam.classed('beam--hover', false);
}

function mMouseout(d) {
  mSvg.select('.focus').attr('transform', 'translate(-100,-100)');
  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution(d);
}
