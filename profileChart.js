var pHeight = RIGHT_ROW_2_HEIGHT * 0.40;
var pWidth = pHeight;
var maxHeight = null;
var maxWidth = null;

var px = d3.scaleLinear();
var py = d3.scaleLinear();

const RIGHT_MARGIN = 50;

function initializeProfileChart(){
  pWidth = pHeight * SPECIAL.bf.boundMax / SPECIAL.d.boundMax;

  maxHeight = SPECIAL.d.boundMax;
  maxWidth = SPECIAL.bf.boundMax;

  px.range([0, pWidth])
    .domain([0, maxWidth]);
  py.range([0, pHeight])
    .domain([0, maxHeight]);

  // FOR debugging
  // mSvg.append('rect')
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('height', py(maxHeight))
  //   .attr('width', px(maxWidth))
  //   .attr('stroke-width', 1)
  //   .attr('stroke', 'RGBA(77, 55, 75, 0.5)')
  //   .attr('fill', 'none')
  //   .attr('transform', 'translate(' + (mWidth - RIGHT_MARGIN - pWidth) + ', 0)')

  // mSvg.append('circle')
  //   .attr(x, 0)
  //   .attr(y, 0)
  //   .attr(r, 4)
  //   .attr('transform', 'translate(' + (mWidth - RIGHT_MARGIN - pWidth) + ', 0)')
}

function removeBeamProfile(d){
  mSvg.selectAll('.w-group.selected-beam.profile').remove();
  mSvg.selectAll('.w-group.selected-beam.text').remove();
}

function showBeamProfile(d){
  const beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  const tf = +beam.tf;
  const tw = +beam.tw;
  const bf = +beam.bf;
  const depth = +beam.d;
  const kdes = +beam.kdes;

  // Tick length
  const eL = 0.75;

  const leftOriginX = maxWidth - bf;

  const rectangles = [
    // FIRST ARGUMENT IN offsetX SHIFTS FROM LEFT ALIGNED TO RIGHT ALIGNED
    {offsetX: leftOriginX + bf / 2 - tw / 2, offsetY: 0, width: tw, height: depth, stroke: 'none', fill: CUSTOM_BLUE, opacity: 1},
    {offsetX: leftOriginX, offsetY: 0, width: bf, height: tf, stroke: 'none', fill: CUSTOM_BLUE, opacity: 1},
    {offsetX: leftOriginX, offsetY: depth - tf, width: bf, height: tf, stroke: 'none', fill: CUSTOM_BLUE, opacity: 1}
  ];

  const annotationTWeb = [
    // d text
    {offsetX: maxWidth + 2 * eL, offsetY: -eL, width: 0.2, height: depth + 2 * eL, stroke: 'none', fill: 'black', text: 'd', textPos: 'right'},
    {offsetX: maxWidth + eL, offsetY: 0, width: 2 * eL, height: 0.2, stroke: 'none', fill: 'black'},
    {offsetX: maxWidth + eL, offsetY: depth, width: 2 * eL, height: 0.2, stroke: 'none', fill: 'black'},
    // tf text
    {offsetX: leftOriginX - 2 * eL, offsetY: -eL, width: 0.2, height: tf + 2 * eL, stroke: 'none', fill: 'black', text: 'tf', textPos: 'left'},
    {offsetX: leftOriginX - 3 * eL, offsetY: 0, width: 2 * eL, height: 0.2, stroke: 'none', fill: 'black'},
    {offsetX: leftOriginX - 3 * eL, offsetY: tf, width: 2 * eL, height: 0.2, stroke: 'none', fill: 'black'},
    // kdes text
    {offsetX: leftOriginX - 2 * eL, offsetY: (depth - kdes) - eL, width: 0.2, height: kdes + 2 * eL, stroke: 'none', fill: 'black', text: 'kdes', textPos: 'left'},
    {offsetX: leftOriginX - 3 * eL, offsetY: depth, width: 2 * eL, height: 0.2, stroke: 'none', fill: 'black'},
    {offsetX: leftOriginX - 3 * eL, offsetY: (depth - kdes), width: 2 * eL + (bf / 2 - tf / 2), height: 0.2, stroke: 'none', fill: 'black'},
    // bf text
    {offsetX: leftOriginX - eL, offsetY: depth + 2 * eL, width: bf + 2 * eL, height: 0.2, stroke: 'none', fill: 'black', text: 'bf', textPos: 'middle'},
    {offsetX: leftOriginX, offsetY: depth + eL, width: 0.2, height: 2 * eL, stroke: 'none', fill: 'black'},
    {offsetX: maxWidth, offsetY: depth + eL, width: 0.2, height: 2 * eL, stroke: 'none', fill: 'black'},
    // tw text
    {offsetX: leftOriginX + bf / 2 - tw / 2 - eL, offsetY: depth / 2, width: tw + 2 * eL, height: 0.2, stroke: 'none', fill: 'black', text: 'tw', textPos: 'left'},
    {offsetX: leftOriginX + bf / 2 - tw / 2 - 0.1, offsetY: depth / 2 - eL, width: 0.2, height: 2 * eL, stroke: 'none', fill: 'black'},
    {offsetX: leftOriginX + bf / 2 - tw / 2 + tw - 0.1, offsetY: depth / 2 - eL, width: 0.2, height: 2 * eL, stroke: 'none', fill: 'black'}
  ];

  const drawings = rectangles.concat(annotationTWeb);

  mSvg.selectAll('.w-group.selected-beam.profile')
      .data(drawings)
    .enter().append('rect')
      .attr('transform', 'translate(' + (mWidth - RIGHT_MARGIN - pWidth) + ', 0)')
      .attr('class', d => 'w-group selected-beam profile ' + escapeCharacter(beam.AISC_Manual_Label))
      .attr('x', d => px(d.offsetX))
      .attr('rx', 2)
      .attr('y', d => py(d.offsetY))
      .attr('width', d => px(d.width))
      .attr('height', d => py(d.height))
      .attr('fill', d => d.fill || 'none')
      .attr('stroke', d => d.stroke || CUSTOM_BLUE)
      .attr('pointer-events', 'none')
      .attr('stroke-width', 1)
      .attr('opacity', d => d.opacity || 0)
    .transition()
      .attr('opacity', 1)

  mSvg.selectAll('.w-group.selected-beam.text')
      .data(drawings)
    .enter()
    .append('text')
      .attr('transform', 'translate(' + (mWidth - RIGHT_MARGIN - pWidth) + ', 0)')
      .attr('class', d => 'w-group selected-beam text ' + escapeCharacter(beam.AISC_Manual_Label))
      .text(d => {
        if (d.text === 'tf') return 't';
        if (d.text === 'kdes') return 'k';
        if (d.text === 'bf') return 'b';
        if (d.text === 'tw') return 't';
        return d.text;
      })
      .attr('x', d => {
        if (d.textPos === 'right') return px(d.offsetX) + 4;
        if (d.textPos === 'left') return px(d.offsetX) - 4;
        if (d.textPos === 'middle') return px(d.offsetX + d.width / 2);
      })
      .attr('y', d => {
        if (d.textPos === 'right') return py(d.offsetY + d.height / 2);
        if (d.textPos === 'left') return py(d.offsetY + d.height / 2);
        if (d.textPos === 'middle') return py(d.offsetY) + 10;
      })
      .attr('alignment-baseline', d => {
        if (d.textPos === 'left') return 'central';
      })
      .attr('text-anchor', d => {
        if (d.textPos === 'left') return 'end';
        if (d.textPos === 'middle') return 'middle';
      })
      .attr('opacity', 0)
    .append('tspan')
      .attr('dy', '.7em')
      .text(function(d) {
        if (d.text === 'tf') return 'f';
        if (d.text === 'kdes') return 'des';
        if (d.text === 'bf') return 'f';
        if (d.text === 'tw') return 'w';
      })
    .append('tspan')
      .attr('dy', d => {
        if (d.text === 'tf') return '-.35em';
        if (d.text === 'kdes') return '-.35em';
        if (d.text === 'bf') return '-.7em';
        if (d.text === 'tw') return '-.35em';
        return '0';
      })
      .text(d => {
        if (beam[d.text]) return ' = ' + beam[d.text] + '"';
      })

    mSvg.selectAll('.w-group.selected-beam.text')
      .transition()
        .attr('opacity', 1)
}
