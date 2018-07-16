var dMargin = {top: 0, right: 20, bottom: 20, left: 20},
    dWidth = RIGHT_CHARTS_WIDTH - dMargin.left - dMargin.right,
    dHeight = RIGHT_ROW_3_HEIGHT - dMargin.top - dMargin.bottom;

const NULL_DISTRIBUTION_OPACITY = 0.30;
const NULL_RADIUS = 1;
const VALID_BEAM_RADIUS = 2;
const HOVERED_BEAM_RADIUS = 4;
const NULL_BEAM_WIDTH = 1;
const HOVERED_BEAM_WIDTH = 2;

var dx0 = d3.scaleLinear()
    .range([0, dWidth]);

var dy0 = d3.scaleLinear()
    .range([dHeight, 0]);

var dVoronoi = d3.voronoi()
  .x(d => dx0(+d.W))
  .y(d => dy0(+d.d))
  .extent([[0, 0], [dWidth, dHeight]]);

let voronoiDiagram = null;
let highlightedBeam = null;

var dXAxis = d3.axisTop()
    .scale(dx0)
    .tickSize(-8)
    .tickFormat(d => d + ' plf')
    .tickPadding(-8)
    .tickValues([100, 200, 300, 400, 500, 600, 700]);

var dSvg = d3.select('#bottom-row').append('svg')
    .attr('width', dWidth + dMargin.left + dMargin.right)
    .attr('height', dHeight + dMargin.top + dMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + dMargin.left + ',' + dMargin.top + ')')
    // .on('touchmove mousemove', moved);

// function moved() {
//   findcell(d3.mouse(this));
// }

// function findcell(m) {
//   console.log(m)
//   return
//   const found = voronoiDiagram.find(m[0], m[1]);
//   if (found.AISC_Manual_Label === (highlightedBeam && highlightedBeam.AISC_Manual_Label)) {
//     return;
//   }

//   if (highlightedBeam) {
//     dMouseout(highlightedBeam);
//   }

//   if (found) {
//     dMouseover(found.data);
//   }

//   highlightedBeam = found.data;
// }

function initializeDistributionChart(){
  dx0.domain([0, 800]);
  dy0.domain([50, 0]);

  const beamsData = beamsDataForDistributionChart()
  var wBeams = dSvg.selectAll('.w-beam.d')
    .data(beamsData);

  // x: 0 -> max weight
  // y: 0 -> max depth
  wBeams
    .enter().append('rect')
      .attr('class', d => 'w-beam d ' + d.AISC_Manual_Label.split('X')[0] + ' ' + d.AISC_Manual_Label)
      .attr('x', d => dx0(+d.W))
      .attr('y', d => 0)
      .attr('opacity', NULL_DISTRIBUTION_OPACITY)
      .attr('fill', CUSTOM_GREY)
      .attr('height', 0)
    .transition().duration(600).delay((d, i) => i * 8)
      .attr('width', NULL_BEAM_WIDTH)
      .attr('height', d => dy0(+d.d))

  wBeams
    .enter().append('circle')
      .attr('class', d => 'w-beam d ' + d.AISC_Manual_Label.split('X')[0] + ' ' + d.AISC_Manual_Label)
      .attr('cx', d => dx0(+d.W))
      .attr('cy', d => dy0(+d.d))
      .attr('opacity', NULL_DISTRIBUTION_OPACITY)
      .attr('fill', CUSTOM_GREY)
      .attr('r', 0)
    .transition().delay((d, i) => i * 8 + 600)
      .attr('r', NULL_RADIUS)

  dSvg
    .append('circle')
      .attr('class', 'w-beam top-hover')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('opacity', 0)
      .attr('fill', CUSTOM_BLUE)
      .attr('r', HOVERED_BEAM_RADIUS);

  dSvg.append('g')
      .attr('class', 'x axis d')
      .attr('transform', 'translate(0,' + 2 + ')')
      .call(dXAxis)
    .selectAll('text')
      .attr('x', 6)
      .style('text-anchor', 'start');

  dSvg.append('text')
    .attr('class', 'x axis label')
    .attr('x', 2)
    .attr('y', 10)
    .text('Weight');

  // Voronoi chart for hover effects
  const voronoiGroup = dSvg.append('g')
    .attr('class', 'voronoi');

  recalculateDistributionVoronoi();

  const dFocus = dSvg.append('g')
      .attr('transform', 'translate(-100,-100)')
      .attr('class', 'focus');

  dFocus.append('text')
      .attr('y', -10);
}

function updateDistributionChart() {
  d3.selectAll('rect.w-beam.d')
    .transition().duration(500)
    .attr('opacity', distributionFilterOpacity);

  d3.selectAll('circle.w-beam.d')
    .transition().duration(500)
    .attr('opacity', distributionFilterOpacity)
    .attr('r', distributionFilterRadius)
    .attr('cx', d => {
      const xAdjustment = distributionFilterCx(d);
      return dx0(+d.W) + xAdjustment;
    });

  recalculateDistributionVoronoi()
}

function distributionFilterOpacity(d) {
  return validateBeam(d, { valid: 0.9, invalid: NULL_DISTRIBUTION_OPACITY / 2, nullState: NULL_DISTRIBUTION_OPACITY });
}

function distributionFilterRadius(d) {
  return validateBeam(d, { valid: VALID_BEAM_RADIUS, invalid: NULL_RADIUS, nullState: NULL_RADIUS });
}

function distributionFilterCx(d) {
  return validateBeam(d, { valid: 1, invalid: 0, nullState: 0 });
}

function highlightBeamDistribution(d, {allInDepth} = {}){
  beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  const bottomY = dy0(+beam.d);

  dSvg.select('.focus').attr('transform', 'translate(' +  (dx0(+beam.W) + 8) + ',' + (bottomY + dMargin.top) + ')');
  dSvg.select('.focus').select('text')
    .attr('y', -bottomY / 2 + HOVERED_BEAM_RADIUS)
    .text(beam.d + 'in');
  const escapedAISC = escapeCharacter(d.AISC_Manual_Label);

  if (allInDepth && !W_BEAMS_FILTERED.length){
    dSvg.selectAll('circle.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label.split('X')[0]))
      .attr('opacity', 1)
      .attr('cx', d => dx0(+d.W) + 1)
      .attr('r', VALID_BEAM_RADIUS)
      .attr('fill', CUSTOM_BLUE);
  }

  dSvg.select('rect.w-beam.d.' + escapedAISC)
    // .attr('x', 3)
    .attr('width', HOVERED_BEAM_WIDTH)
    .attr('opacity', 1)
    .attr('fill', CUSTOM_BLUE);
  dSvg.select('circle.w-beam.d.' + escapedAISC)
    .attr('cx', d => dx0(+d.W) + 1)
    .attr('r', HOVERED_BEAM_RADIUS)
    .attr('opacity', 1)
    .attr('fill', CUSTOM_BLUE);

//   dSvg.selectAll('circle.w-beam.d')
//     .attr('opacity', NULL_DISTRIBUTION_OPACITY)


//   dSvg.selectAll('circle.w-beam.d.' + escapedAISC)
//     .attr('cx', d => dx0(+d.W) + 1)
//     .attr('r', HOVERED_BEAM_RADIUS)
//     .attr('opacity', 1)

  dSvg.selectAll('.top-hover')
    .attr('cx', dx0(+d.W) + 1)
    .attr('opacity', 1);
}

function removeBeamDistribution(){
  dSvg.select('.focus').attr('transform', 'translate(-100,-100)');

  d3.selectAll('rect.w-beam.d')
    .attr('fill', CUSTOM_GREY)
    .attr('width', NULL_BEAM_WIDTH)
    .attr('opacity', distributionFilterOpacity)

  d3.selectAll('circle.w-beam.d')
    .attr('fill', CUSTOM_GREY)
    .attr('opacity', distributionFilterOpacity)
    .attr('r', distributionFilterRadius)

  dSvg.selectAll('.top-hover')
    .attr('opacity', 0);
}

function dMouseover(d) {
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d, {allInDepth: true});
}

function dMouseout(d) {
  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution();
}

function resizeDistributionChart() {
  dWidth = RIGHT_CHARTS_WIDTH - dMargin.left - dMargin.right;
  dHeight = RIGHT_ROW_3_HEIGHT - dMargin.top - dMargin.bottom;

  // Update scales
  dx0.range([0, dWidth]);
  dy0.range([dHeight, 0]);
  d3.select('#bottom-row svg')
  .attr('width', dWidth + dMargin.left + dMargin.right)
  .attr('height', dHeight + dMargin.top + dMargin.bottom);

  dXAxis.scale(dx0);

  d3.select('.x.axis.d')
  .call(dXAxis);

  dSvg.selectAll('rect.w-beam.d')
  .attr('x', d => dx0(+d.W))
  .attr('height', d => dy0(+d.d));

  dSvg.selectAll('circle.w-beam.d')
  .attr('cx', d => dx0(+d.W))
  .attr('cy', d => dy0(+d.d));
}

function beamsDataForDistributionChart() {
  return W_BEAMS_FILTERED.length ?
    W_BEAMS_FILTERED.reduce((acc, beamGroup) => {
      beamGroup.values.forEach(beam => {
        acc.push(beam);
      });
      return acc;
    }, []) :
    Object.values(W_BEAMS_MAP).reverse();
}

function recalculateDistributionVoronoi() {
  if (noResults()) {
    return;
  }

  dVoronoi.extent([[0, 0], [dWidth, dHeight]]);

  // Generate voronoi polygons
  const beamsData = beamsDataForDistributionChart()
  voronoiDiagram = dVoronoi(beamsData);

  const voronoiGroup = d3.select('#bottom-row')
    .selectAll('.voronoi')
    .selectAll('path')
    .data(voronoiDiagram.polygons());

  voronoiGroup.exit()
    .style('opacity', 0)
    .remove();

  voronoiGroup
    .attr('d', d => 'M' + (d.join('L') || '0,0') + 'Z');

  voronoiGroup.enter().append('path')
    .attr('d', d => 'M' + d.join('L') + 'Z')
      .on('mouseover', d => dMouseover(d.data))
      .on('mouseout', d => dMouseout(d.data));
}
