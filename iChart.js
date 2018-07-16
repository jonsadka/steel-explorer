var iMargin = {top: 20, right: 20, bottom: 30, left: 30},
    iWidth = LEFT_CHARTS_WIDTH - iMargin.left - iMargin.right,
    iHeight = LEFT_ROW_3_HEIGHT - iMargin.top - iMargin.bottom;

const iChartTitleValue = document.querySelector('#bottom-container .primary');

var ix0 = d3.scaleBand()
  .range([iWidth, 0])
  .paddingInner(0.05);

var iy0 = d3.scaleLinear()
    .range([iHeight, 0]);

var iVoronoi = d3.voronoi()
  .x(d => ix0(d.AISC_Manual_Label.split('X')[0]) + ix0.bandwidth()/2)
  .y(d => iy0(+d.Ix))
  .extent([[0, 0], [iWidth, iHeight]]);

// Color in Ix per W
const colorScale = d3.scaleQuantize()
  .range(['#d3d3d3', '#d0c0be', '#ccadaa', '#c89996', '#c28783', '#bb7471', '#b4615e']);

const iXAxis = d3.axisBottom()
    .scale(ix0)
    .tickSize(-iHeight);

const iYAxis = d3.axisRight()
    .scale(iy0)
    .ticks(4);

const iSvg = d3.select('#bottom-container').append('svg')
    .attr('width', iWidth + iMargin.left + iMargin.right)
    .attr('height', iHeight + iMargin.top + iMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + iMargin.left + ',' + iMargin.top + ')');

function initializeIChart(){
  ix0.domain(W_BEAMS.map(d => d.key));
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);
  colorScale.domain([SPECIAL.IxPerW.Min, SPECIAL.IxPerW.Min + (SPECIAL.IxPerW.Max- SPECIAL.IxPerW.Min)/2, SPECIAL.IxPerW.Max]);

  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS, d => d.key)
    .enter().append('g')
      .attr('class', d => `g w-group I ${d.key}`)

  wGroup.selectAll('rect')
      .data(d => d.values)
    .enter().append('rect')
      .attr('class', d => 'w-beam X' + d.W)
      .attr('x', d => {
        const section = d.AISC_Manual_Label.split('X')[0];
        return ix0(section);
      })
      .attr('y', d => iy0(+d.Ix))
      .attr('width', ix0.bandwidth())
      .attr('height', 2)
      .attr('fill', d => colorScale(+d.Ix / +d.W))

  iSvg.append('g')
      .attr('class', 'x axis I')
      .attr('transform', 'translate(0,' + (iHeight + 5) + ')')
      .call(iXAxis);

  iSvg.append('g')
      .attr('class', 'y axis I')
      .call(iYAxis)
    .selectAll('text')
      .attr('dx', '-1em');

  // Voronoi chart for hover effects
  const voronoiGroup = iSvg.append('g')
    .attr('class', 'voronoi');

  recalculateIVoronoi();
}

function iUpdateWeight() {
  iy0
    .range([iHeight, 0])
    .domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);

  const wGroup = d3.selectAll('.w-group.I')

  const wBeams = wGroup.selectAll('rect')
      .data(d => d.values)

  // Update scales only after the new bars have been entered
  ix0.domain(W_BEAMS_FILTERED.map(d => d.key));
  d3.selectAll('.x.axis.I')
    .transition().duration(TRANSITION_TIME).delay(500)
    .call(iXAxis);
  d3.selectAll('.y.axis.I')
    .transition().duration(TRANSITION_TIME).delay(500)
    .call(iYAxis)
    .selectAll('text')
    .attr('dx', '-1em')

  // Transition bars into their places
  colorScale.domain([
    SPECIAL.IxPerW.Min,
    SPECIAL.IxPerW.Min + (SPECIAL.IxPerW.Max- SPECIAL.IxPerW.Min)/2, SPECIAL.IxPerW.Max
  ]);
  wBeams.transition().duration(500)
    .attr('fill', d => colorScale(+d.Ix / +d.W))
    .attr('opacity', iFilterOpacity);

  wBeams.transition().duration(TRANSITION_TIME).delay(500)
    .attr('width', ix0.bandwidth())
    .attr('x', d => {
      const section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('y', d => iy0(+d.Ix) || 0)
    .attr('fill', d => colorScale(+d.Ix / +d.W));

  // Wait until the transition is done to recalculate and update the voronoi
  setTimeout(recalculateIVoronoi, TRANSITION_TIME + 550);
}

function iFilterOpacity(d) {
  return validateBeam(d, {valid: 1, invalid: 0});
}

function removeHighlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  if (typeof ix0(d.AISC_Manual_Label.split('X')[0]) !== 'number') return
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var wGroup = iSvg.select('.w-group.I.' + d.AISC_Manual_Label.split('X')[0])
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(d.W))

  // Remove the horizontal cursor
  wGroup.select('.horizontal-cursor').remove();

  wBeam
    .attr('height', 2)
    .attr('fill', colorScale(+beam.Ix / +d.W));

  iChartTitleValue.innerHTML = '_ <span class="unit">in<sup>4</sup><span>';
}

function highlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var isValidBeam = validateBeam(beam, {valid: true, invalid: false});
  if (isValidBeam === false) return;
  var section = d.AISC_Manual_Label.split('X')[0];
  var wGroup = iSvg.select('.w-group.I.' + section)
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(beam.W))

  wBeam.attr('fill', CUSTOM_BLUE)
    .attr('height', 3)

  var format = d3.format(',');
  wGroup.append('rect')
    .attr('class', d => 'w-beam horizontal-cursor X' + beam.W)
    .attr('fill', CUSTOM_BLUE)
    .attr('y', d => iy0(+beam.Ix) + 1)
    .attr('height', 1)
    .attr('width', iWidth)
    .attr('x', 0)

  iChartTitleValue.innerHTML = format(+beam.Ix) + '<span class="unit">in<sup>4</sup><span>';
}

function iMouseover(d) {
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function iMouseout(d) {
  removeBeamProfile();
  removeBeamDetails(d);
  removeHighlightBeamI(d);
  removeBeamDistribution(d);
}

function resizeIChart() {
  iHeight = LEFT_ROW_3_HEIGHT - iMargin.top - iMargin.bottom;

  ix0.range([iWidth, 0]);
  iy0
    .range([iHeight, 0])
    .domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);
  iYAxis.scale(iy0);

  d3.select('#bottom-container svg')
    .attr('height', iHeight + iMargin.top + iMargin.bottom);

  d3.select('.y.axis.I')
    .call(iYAxis);

  d3.selectAll('.x.axis.I')
    .attr('transform', 'translate(0,' + (iHeight + 5) + ')');

  d3.selectAll('.w-group.I').selectAll('rect')
    .data(d => d.values)
    .attr('y', d => iy0(+d.Ix))
    .attr('opacity', iFilterOpacity);
}

function recalculateIVoronoi() {
  if (noResults()) {
    return;
  }

  iVoronoi
    .x(d => ix0(d.AISC_Manual_Label.split('X')[0]) + ix0.bandwidth()/2)
    .y(d => iy0(+d.Ix))
    .extent([[0, 0], [iWidth, iHeight]]);

  // Generate voronoi polygons
  const voronoiDiagram = iVoronoi([].concat.apply([], W_BEAMS_FILTERED.length ?
    W_BEAMS_FILTERED.map(d => d.values) :
    W_BEAMS.map(d => d.values)
  ));

  const voronoiGroup = d3.select('#bottom-container')
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
      .on('mouseover', d => iMouseover(d.data))
      .on('mouseout', d => iMouseout(d.data));
}
