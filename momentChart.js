const NULL_OPACITY = 0.15;

let mMargin = {top: 20, right: 20, bottom: 0, left: 20},
    mWidth = RIGHT_CHARTS_WIDTH - mMargin.left - mMargin.right,
    mHeight = RIGHT_ROW_2_HEIGHT - mMargin.top - mMargin.bottom;

const mChartTitleValue = document.querySelector('#middle-row .primary');
const selectedBeamName = document.getElementById('selected-beam-name');

const mTitleFormat = d3.format(',');

let mx0 = d3.scaleLinear()
    .range([0, mWidth]);

let my0 = d3.scaleLinear()
    .range([mHeight, 0]);

let mVoronoi = d3.voronoi()
    .x(d => mx0(d.length))
    .y(d => my0(d.Mn * PHI))
    .extent([
      [0, 0],
      [mWidth, mHeight]
    ]);

let mXAxis = d3.axisTop()
    .scale(mx0)
    .tickValues([5, 10, 15, 20, 25, 30, 35]);

let mYAxis = d3.axisLeft()
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
  const wGroup = mSvg.selectAll('.w-group.m')
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
      .attr('opacity', NULL_OPACITY)
      .attr('stroke-width', 1)

  // Voronoi chart for hover effects
  const voronoiGroup = mSvg.append('g')
    .attr('class', 'voronoi');

  setTimeout(() => {
    recalculateMomentVoronoi();

    const mFocus = mSvg.append('g')
        .attr('transform', 'translate(-100,-100)')
        .attr('class', 'focus');

    mFocus.append('circle')
        .attr('r', 3.5);

    mFocus.append('text')
        .attr('y', -10);
  }, 0);

  mSvg.append('g')
      .attr('class', 'x axis moment')
      .attr('transform', 'translate(0,' + (mHeight + 4) + ')')
    .call(mXAxis);

  mSvg.append('text')
      .attr('class', 'x axis label')
      .attr('x', 2)
      .attr('y', mHeight - 5)
      .text('Unbraced');

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
      .text('Moment [φ not yet applied]');
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

  const wGroup = mSvg.selectAll('.w-group')
      .data(W_BEAMS)

  wGroup.selectAll('path')
      .data(d => d.values)
      .transition().duration(500)
      .attr('opacity', mFilterOpacity)
      // .attr('stroke', mFilterStroke)
      // .attr('stroke-width', mFilterStrokeWidth);

  wGroup.selectAll('path')
      .data(d => d.values)
      .transition().duration(TRANSITION_TIME).delay(500)
      .attr('d', d => mLine(d.MnValues));

  // Wait until the transition is done to recalculate and update the voronoi
  setTimeout(recalculateMomentVoronoi, TRANSITION_TIME + 550);
}

function createNestedData(beamData) {
  return d3.nest()
    .key(d => mx0(d.length) + ',' + my0(d.Mn * PHI))
    .rollup(v => v[0])
    .entries(d3.merge(beamData.map(d =>
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
}

function mFilterOpacity(d){
  return validateBeam(d, {valid: 0.8, invalid: 0.07, nullState: NULL_OPACITY});
}

function mFilterStroke(d){
  return validateBeam(d, {valid: CUSTOM_BLUE});
}

function mFilterStrokeWidth(d){
  return validateBeam(d, {valid: 2, invalid: 1});
}

function mMouseover(d) {
  // wBeam.parentNode.appendChild(wBeam);
  mSvg.select('.focus').attr('transform', 'translate(' + mx0(d.length) + ',' + my0(d.Mn * PHI) + ')');
  mSvg.select('.focus').select('text').text(d.length + ' ft., ' + '__' + ' k-ft.');
  const moment = Math.floor(Math.round(d.Mn * PHI * 10) / 10);
  mChartTitleValue.innerHTML = `${mTitleFormat(moment)}<span class="unit">k-ft</span> <span class="accent">at</span> ${d.length}<span class="unit">ft</span>`
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function showBeamDetails(d){
  const wGroup = mSvg.select('.' + d.AISC_Manual_Label.split('X')[0]);
  const wBeam = wGroup.select('.X' + escapeCharacter(d.W));
  wGroup.classed('group--hover', true);
  wBeam.classed('beam--hover', true);

  selectedBeamName.innerHTML = d.AISC_Manual_Label;
}

function removeBeamDetails(d){
  selectedBeamName.innerHTML = '';
  const wGroup = mSvg.select('.' + d.AISC_Manual_Label.split('X')[0]);
  const wBeam = wGroup.select('.X' + escapeCharacter(d.W));
  wGroup.classed('group--hover', false);
  wBeam.classed('beam--hover', false);
}

function mMouseout(d) {
  mSvg.select('.focus').attr('transform', 'translate(-100,-100)');

  mChartTitleValue.innerHTML = '_ <span class="unit">k-ft</span> <span class="accent">at</span> _ <span class="unit">ft</span>';

  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution(d);
}

function resizeMomentChart() {
  mWidth = RIGHT_CHARTS_WIDTH - mMargin.left - mMargin.right;
  mHeight = RIGHT_ROW_2_HEIGHT - mMargin.top - mMargin.bottom;

  // Update Scales
  mx0.range([0, mWidth]);
  my0.range([mHeight, 0]);

  mXAxis.scale(mx0);
  mYAxis.scale(my0);
  mLine
    .x(d => mx0(d.length))
    .y(d => my0(d.Mn * PHI));

  d3.select('#middle-row svg')
    .attr('width', mWidth + mMargin.left + mMargin.right)
    .attr('height', mHeight + mMargin.top + mMargin.bottom);

  d3.select('.x.axis.moment')
    .call(mXAxis);

  // d3.selectAll('.y.axis.moment')
  //   .call(mYAxis.tickFormat(d3.format('.1s')))

  const wGroup = mSvg.selectAll('.w-group')
  wGroup.selectAll('path')
      .data(d => d.values)
      .attr('d', d => mLine(d.MnValues));
}

function recalculateMomentVoronoi() {
  if (noResults()) {
    return;
  }

  mVoronoi
    .x(d => mx0(d.length))
    .y(d => my0(d.Mn * PHI))
    .extent([[0, 0], [mWidth, mHeight]]);

  const beamData = W_BEAMS_FILTERED.length ? W_BEAMS_FILTERED : W_BEAMS;
  // Format / flatten data
  const nestedData = createNestedData(beamData);
  // Generate voronoi polygons
  const voronoiDiagram = mVoronoi(nestedData);

  const voronoiGroup = d3.select('#middle-row')
    .selectAll('.voronoi')
    .selectAll('path')
      .data(voronoiDiagram.polygons());

  // // For debugging only
  // voronoiGroup.selectAll('circle')
  //     .data(nestedData)
  //   .enter().append('circle')
  //     .attr('cx', d => mx0(d.length))
  //     .attr('cy', d => my0(d.Mn * PHI))
  //     .attr('r', 1)
  //     .attr('stroke', 'black');

  voronoiGroup.exit()
    .style('opacity', 0)
    .remove();

  voronoiGroup
    .attr('d', d => 'M' + (d.join('L') || '0,0') + 'Z');

  voronoiGroup.enter().append('path')
    .attr('d', d => 'M' + d.join('L') + 'Z')
    .on('mouseover', d => mMouseover(d.data))
    .on('mouseout', d => mMouseout(d.data));
}
