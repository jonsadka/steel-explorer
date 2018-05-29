var iMargin = {top: 20, right: 27, bottom: 30, left: 52},
    iWidth = LEFT_CHARTS_WIDTH - iMargin.left - iMargin.right,
    iHeight = LEFT_ROW_3_HEIGHT - iMargin.top - iMargin.bottom - 10;

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
// console.log(colorbrewer)
const colorScale = d3.scaleQuantize()
  .range(['#3ca0a0','#4aa6a7','#59abae','#66b1b4','#75b6bc','#85bbc2','#9abfc5','#b4c2c5','#c0c7c8','#cacccd','#d3d3d3'])

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
      .data(d => d.values, d => d.W)
    .enter().append('rect')
      .attr('class', d => 'w-beam X' + d.W)
      .attr('x', d => {
        const section = d.AISC_Manual_Label.split('X')[0];
        return ix0(section);
      })
      .attr('y', d => iy0(+d.Ix))
      .attr('width', ix0.bandwidth())
      .attr('height', 3)
      .attr('fill', d => colorScale(+d.Ix / +d.W))

  iSvg.append('g')
      .attr('class', 'x axis I')
      .attr('transform', 'translate(0,' + (iHeight + 5) + ')')
      .call(iXAxis);

  iSvg.append('g')
      .attr('class', 'y axis I')
      .call(iYAxis.tickFormat(d3.format('.1s')))
    .selectAll('text')
      .attr('dx', '-1em');

  // Voronoi chart for hover effects
  var voronoiGroup = iSvg.append('g')
    .attr('class', 'voronoi');

  // Generate voronoi polygons
  var voronoiDiagram = iVoronoi([].concat.apply([], W_BEAMS.map(d => d.values)));

  voronoiGroup.selectAll('path')
      .data(voronoiDiagram.polygons())
    .enter().append('path')
      .attr('d', d => 'M' + d.join('L') + 'Z')
      .datum(d => d.data)
      .on('mouseover', iMouseover)
      .on('mouseout', iMouseout);
}

function iUpdateWeight() {
  iy0.domain([SPECIAL.I.boundMin, SPECIAL.I.boundMax]);

  var wGroup = iSvg.selectAll('.w-group.I')
      .data(W_BEAMS, d => d.key)

  wGroup.enter().append('g')
    .attr('class', d => `g w-group I ${d.key}`)

  wGroup
    .attr('class', d => `g w-group I ${d.key}`)

  var wBeams = wGroup.selectAll('rect')
      .data(d => d.values, d => d.W)

  wBeams.enter().append('rect')
    .attr('class', d => 'w-beam X' + d.W)
    .attr('x', function(d){
      var section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('y', d => iy0(+d.Ix))
    .attr('width', ix0.bandwidth())
    .attr('height', 3)
    .attr('fill', d => colorScale(+d.Ix / +d.W))

  // Update scales only after the new dots have been entered
  ix0.domain(W_BEAMS_FILTERED.map(d => d.key));
  d3.selectAll('.x.axis.I')
    .transition().duration(TRANSITION_TIME).delay(500)
    .call(iXAxis);
  d3.selectAll('.y.axis.I')
    .transition().duration(TRANSITION_TIME).delay(500)
    .call(iYAxis.tickFormat(d3.format('.1s')))
    .selectAll('text')
    .attr('dx', '-1em')

  // Transition dots into their places
  colorScale.domain([SPECIAL.IxPerW.Min, SPECIAL.IxPerW.Min + (SPECIAL.IxPerW.Max- SPECIAL.IxPerW.Min)/2, SPECIAL.IxPerW.Max]);
  wBeams.transition().duration(500)
    .attr('fill', d => colorScale(+d.Ix / +d.W))
    .attr('opacity', iFilterOpacity);

  wBeams.transition().duration(TRANSITION_TIME).delay(500)
    .attr('width', ix0.bandwidth())
    .attr('x', d => {
      const section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
    .attr('y', d => iy0(+d.Ix))
    .attr('fill', d => colorScale(+d.Ix / +d.W))

  wBeams.exit().remove()
  wGroup.exit().remove()


  const voronoiGroup = iSvg.selectAll('.voronoi');
  const voronoiDiagram = iVoronoi([].concat.apply([], W_BEAMS_FILTERED.map(d => d.values)));
  const voronoiLines = voronoiGroup.selectAll('path')
      .data(voronoiDiagram.polygons());

  voronoiLines.enter().append('path')
      .attr('d', d => 'M' + d.join('L') + 'Z')
      .datum(d => d.data)
      .on('mouseover', iMouseover)
      .on('mouseout', iMouseout);

  voronoiLines.attr('d', d => 'M' + d.join('L') + 'Z')
      .datum(d => d.data)

  voronoiLines.exit().remove();
}

function iFilterOpacity(d) {
  var calculatedFill = colorScale(+d.Ix / +d.W);
  return validateBeam(d, {valid: 1, invalid: 0});
}

function removeHighlightBeamI(d) {
  // Return if selecting a beam currenty filtered out
  if (!ix0(d.AISC_Manual_Label.split('X')[0])) return
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var wGroup = iSvg.select('.w-group.I.' + d.AISC_Manual_Label.split('X')[0])
  var wBeam = wGroup.select('.w-beam.X' + escapeCharacter(d.W))

  // Remove the text label
  wGroup.select('.value').remove();

  wBeam.transition().duration(100)
    .attr('width', ix0.bandwidth())
    .attr('height', 3)
    .attr('fill', colorScale(+beam.Ix / +d.W))
    .attr('x', () =>{
      const section = d.AISC_Manual_Label.split('X')[0];
      return ix0(section);
    })
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
    .transition().duration(50)
    .attr('width', ix0(section) + ix0.bandwidth())
    .attr('x', 0)

  var format = d3.format(',');
  wGroup.append('text')
    .text(format(+beam.Ix))
    .attr('class', function(d){ return 'w-beam value X' + beam.W;})
    .attr('x', ix0(section) - 9)
    .attr('fill', CUSTOM_BLUE)
    .attr('y', function(d){ return iy0(+beam.Ix); })
    .attr('alignment-baseline', 'middle')
    .transition().duration(50)
    .attr('text-anchor', 'end')
    .attr('x', -9)
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
