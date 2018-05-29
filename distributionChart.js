var dMargin = {top: 0, right: 50, bottom: 20, left: 20},
    dWidth = RIGHT_CHARTS_WIDTH - dMargin.left - dMargin.right,
    dHeight = RIGHT_ROW_3_HEIGHT - dMargin.top - dMargin.bottom - 10;

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
    .tickSize(-dHeight)
    .tickFormat(d => d + ' plf')
    .tickPadding(-8)
    .tickValues([100, 200, 300, 400, 500, 600, 700]);

var dSvg = d3.select('#bottom-row').append('svg')
    .attr('width', dWidth + dMargin.left + dMargin.right)
    .attr('height', dHeight + dMargin.top + dMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + dMargin.left + ',' + dMargin.top + ')')
    // .on('touchmove mousemove', moved);

function moved() {
  findcell(d3.mouse(this));
}

function findcell(m) {
  console.log(m)
  return
  const found = voronoiDiagram.find(m[0], m[1]);
  if (found.AISC_Manual_Label === (highlightedBeam && highlightedBeam.AISC_Manual_Label)) {
    return;
  }

  if (highlightedBeam) {
    dMouseout(highlightedBeam);
  }

  if (found) {
    dMouseover(found.data);
  }

  highlightedBeam = found.data;
}

function initializeDistributionChart(){
  dx0.domain([0, 800]);
  dy0.domain([50, 0]);

  var beams = Object.values(W_BEAMS_MAP).reverse();

  var wBeams = dSvg.selectAll('.w-beam.d')
      .data(beams)

  // x: 0 -> max weight
  // y: 0 -> max depth
  wBeams
    .enter().append('rect')
      .attr('class', d => 'w-beam d ' + d.AISC_Manual_Label.split('X')[0] + ' ' + d.AISC_Manual_Label)
      .attr('x', d => dx0(+d.W))
      .attr('y', d => 0)
      .attr('opacity', 0.10)
      .attr('height', 0)
      .attr('width', 1.5)
    .transition().duration(600).delay((d, i) => i * 8)
      .attr('width', 0.25)
      .attr('height', d => dy0(+d.d))

  wBeams
    .enter().append('circle')
      .attr('class', d => 'w-beam d ' + d.AISC_Manual_Label.split('X')[0] + ' ' + d.AISC_Manual_Label)
      .attr('cx', d => dx0(+d.W))
      .attr('cy', d => dy0(+d.d))
      .attr('r', 0)
    .transition().delay((d, i) => i * 8 + 600)
      .attr('r', .75)

  dSvg.append('g')
      .attr('class', 'x axis d')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(dXAxis)
    .selectAll('text')
      .attr('x', 6)
      .style('text-anchor', 'start');

  // Voronoi chart for hover effects
  const voronoiGroup = dSvg.append('g')
    .attr('class', 'voronoi');

  // Generate voronoi polygons
  voronoiDiagram = dVoronoi(beams);

  voronoiGroup.selectAll('path')
    .data(voronoiDiagram.polygons())
    .enter().append('path')
      .attr('d', d => 'M' + d.join('L') + 'Z')
      .datum(d => d.data)
      .on('mouseover', dMouseover)
      .on('mouseout', dMouseout);

    const dFocus = dSvg.append('g')
        .attr('transform', 'translate(-100,-100)')
        .attr('class', 'focus');

    dFocus.append('text')
        .attr('y', -10);
}

function highlightBeamDistribution(d){
  beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  dSvg.select('.focus').attr('transform', 'translate(' +  (dx0(+beam.W) + 8) + ',' + (dy0(+beam.d) + dMargin.top) + ')');
  dSvg.select('.focus').select('text').text(beam.d + 'in');

  dSvg.select('rect.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label))
    .attr('fill', CUSTOM_BLUE)
    .attr('rx', 3)
    .attr('width', 2)
    .attr('opacity', 1)

  dSvg.selectAll('circle.w-beam.d')
    .attr('opacity', 0.35)

  dSvg.selectAll('circle.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label.split('X')[0]))
    .attr('opacity', 1)
    .attr('fill', CUSTOM_BLUE)
    .attr('cx', d => dx0(+d.W) + 1)
    .attr('r', 1.75)

  dSvg.selectAll('circle.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label))
    .attr('fill', CUSTOM_BLUE)
    .attr('cx', d => dx0(+d.W) + 1)
    .attr('r', 4)
}

function removeBeamDistribution(d){
  dSvg.select('.focus').attr('transform', 'translate(-100,-100)');
  dSvg.select('rect.w-beam.d.' + escapeCharacter(d.AISC_Manual_Label))
    .attr('fill', 'black')
    .attr('rx', 0)
    .attr('width', 0.25)
    .attr('opacity', 0.5)

  dSvg.selectAll('circle.w-beam.d')
    .attr('fill', 'black')
    .attr('opacity', 1)
    .attr('r', 0.75)
}

function dMouseover(d) {
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function dMouseout(d) {
  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution(d);
}
