var pHeight = RIGHT_ROW_1_HEIGHT * 0.40;
var pWidth = pHeight;
var maxHeight = null;
var maxWidth = null;

var px = d3.scale.linear();
var py = d3.scale.linear();

function initializeProfileChart(){
  pWidth = pHeight * SPECIAL.bf.boundMax / SPECIAL.d.boundMax;
  // pHeight =

  maxHeight = SPECIAL.d.boundMax;
  maxWidth = SPECIAL.bf.boundMax;

  px.range([0, pWidth])
    .domain([0, maxWidth]);
  py.range([0, pHeight])
    .domain([0, maxHeight]);

  // FOR debugging
  // mSvg.append('rect').attr({
  //   x: 0,
  //   y: 0,
  //   height: py(maxHeight),
  //   width: px(maxWidth),
  //   "stroke-width": 1,
  //   stroke: 'RGBA(77, 55, 75, 0.5)',
  //   fill: 'none',
  //   'transform': 'translate(' + (mWidth - mMargin.left - pWidth) + ',' + (BEAM_SIZE_FONT_SIZE + 10) + ')'
  // })
  // mSvg.append('circle').attr({
  //   x: 0,
  //   y: 0,
  //   r: 4,
  //   'transform': 'translate(' + (mWidth - mMargin.left - pWidth) + ',' + (BEAM_SIZE_FONT_SIZE + 10) + ')'
  // })
}

function removeBeamProfile(d){
  mSvg.selectAll('.w-group.selected-beam.profile').remove();
  mSvg.selectAll('.w-group.selected-beam.text').remove();
}

function showBeamProfile(d){
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var tf = +beam.tf;
  var tw = +beam.tw;
  var bf = +beam.bf;
  var d = +beam.d;
  var kdes = +beam.kdes;

  // Tick length
  var eL = 0.75;

  var rectangles = [
    // FIRST ARGUMENT IN offsetX SHIFTS FROM LEFT ALIGNED TO RIGHT ALIGNED
    {offsetX: (maxWidth - bf + tw/2) + (bf - tf)/2, offsetY: 0, width: tw, height: d, stroke: 'none', fill: CUSTOM_GRAY_DARK, opacity: 1},
    {offsetX: (maxWidth - bf), offsetY: 0, width: bf, height: tf, stroke: 'none', fill: CUSTOM_GRAY_DARK, opacity: 1},
    {offsetX: (maxWidth - bf), offsetY: d - tf, width: bf, height: tf, stroke: 'none', fill: CUSTOM_GRAY_DARK, opacity: 1}
  ];

  var annotationTWeb = [
    // d text
    {offsetX: maxWidth + 2*eL, offsetY: -eL, width: 0.2, height: d + 2*eL, stroke: 'none', fill: 'black', text: 'd', textPos: 'right'},
    {offsetX: maxWidth + eL, offsetY: 0, width: 2*eL, height: 0.2, stroke: 'none', fill: 'black'},
    {offsetX: maxWidth + eL, offsetY: d, width: 2*eL, height: 0.2, stroke: 'none', fill: 'black'},
    // tf text
    {offsetX: (maxWidth - bf) - 2*eL, offsetY: -eL, width: 0.2, height: tf + 2*eL, stroke: 'none', fill: 'black', text: 'tf', textPos: 'left'},
    {offsetX: (maxWidth - bf) - 3*eL, offsetY: 0, width: 2*eL, height: 0.2, stroke: 'none', fill: 'black'},
    {offsetX: (maxWidth - bf) - 3*eL, offsetY: tf, width: 2*eL, height: 0.2, stroke: 'none', fill: 'black'},
    // kdes text
    {offsetX: (maxWidth - bf) - 2*eL, offsetY: (d - kdes) - eL, width: 0.2, height: kdes + 2*eL, stroke: 'none', fill: 'black', text: 'kdes', textPos: 'left'},
    {offsetX: (maxWidth - bf) - 3*eL, offsetY: d, width: 2*eL, height: 0.2, stroke: 'none', fill: 'black'},
    {offsetX: (maxWidth - bf) - 3*eL, offsetY: (d - kdes), width: 2*eL + (bf/2), height: 0.2, stroke: 'none', fill: 'black'},
    // bf text
    {offsetX: (maxWidth - bf) - eL, offsetY: d + 2*eL, width: bf + 2*eL, height: 0.2, stroke: 'none', fill: 'black', text: 'bf', textPos: 'middle'},
    {offsetX: (maxWidth - bf), offsetY: d + eL, width: 0.2, height: 2*eL, stroke: 'none', fill: 'black'},
    {offsetX: maxWidth, offsetY: d + eL, width: 0.2, height: 2*eL, stroke: 'none', fill: 'black'},
    // tw text
    {offsetX: (maxWidth - bf + tw/2) + (bf - tf)/2 - eL, offsetY: d/2, width: tw + 2*eL, height: 0.2, stroke: 'none', fill: 'black', text: 'tw', textPos: 'left'},
    {offsetX: (maxWidth - bf + tw/2) + (bf - tf)/2 - 0.1, offsetY: d/2 - eL, width: 0.2, height: 2*eL, stroke: 'none', fill: 'black'},
    {offsetX: (maxWidth - bf + tw/2) + (bf - tf)/2 + tw - 0.1, offsetY: d/2 - eL, width: 0.2, height: 2*eL, stroke: 'none', fill: 'black'}
  ];

  var drawings = rectangles.concat(annotationTWeb);

  mSvg.selectAll('.w-group.selected-beam.profile')
      .data(drawings)
    .enter().append('rect')
      .attr('transform', 'translate(' + (mWidth - pWidth) + ',' + (BEAM_SIZE_FONT_SIZE + 10) + ')')
      .attr('class', function(d){ return 'w-group selected-beam profile ' + escapeCharacter(beam.AISC_Manual_Label); })
      .attr('x', function(d){ return px(d.offsetX);})
      .attr('rx', 2)
      .attr('y', function(d){ return py(d.offsetY);})
      .attr('width', function(d){ return px(d.width);})
      .attr('height', function(d){ return py(d.height);})
      .attr('fill', function(d){ return d.fill || 'none';})
      .attr('stroke', function(d){ return d.stroke || CUSTOM_GREEN;})
      .attr('pointer-events', 'none')
      .attr('stroke-width', 1)
      .attr('opacity', function(d, i){ return d.opacity || 0;})
    .transition()
      .attr('opacity', 1)

  mSvg.selectAll('.w-group.selected-beam.text')
      .data(drawings)
    .enter()
    .append('text')
      .attr('transform', 'translate(' + (mWidth - pWidth) + ',' + (BEAM_SIZE_FONT_SIZE + 10) + ')')
      .attr('class', function(d){ return 'w-group selected-beam text ' + escapeCharacter(beam.AISC_Manual_Label); })
      .text(function(d){
        if (d.text === 'tf') return 't';
        if (d.text === 'kdes') return 'k';
        if (d.text === 'bf') return 'b';
        if (d.text === 'tw') return 't';
        return d.text;
      })
      .attr('x', function(d){
        if (d.textPos === 'right') return px(d.offsetX) + 4;
        if (d.textPos === 'left') return px(d.offsetX) - 4;
        if (d.textPos === 'middle') return px(d.offsetX + d.width / 2);
      })
      .attr('y', function(d){
        if (d.textPos === 'right') return py(d.offsetY + d.height/2);
        if (d.textPos === 'left') return py(d.offsetY + d.height/2);
        if (d.textPos === 'middle') return py(d.offsetY) + 10;
      })
      .attr('alignment-baseline', function(d){
        if (d.textPos === 'left') return 'central';
      })
      .attr('text-anchor', function(d){
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
      .attr('dy', function(d){
        if (d.text === 'tf') return '-.35em';
        if (d.text === 'kdes') return '-.35em';
        if (d.text === 'bf') return '-.7em';
        if (d.text === 'tw') return '-.35em';
        return '0';
      })
      .text(function(d) {
        if (beam[d.text]) return ' = ' + beam[d.text] + '"';
      })

    mSvg.selectAll('.w-group.selected-beam.text')
      .transition()
        .attr('opacity', 1)
}
