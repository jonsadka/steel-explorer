var MATCHES_SHOWN = 3;

function initializeMatchList(){
  var container = document.getElementById('middle-container'),
      table  = document.createElement('table');
  table.id = 'match-list-table'

  // Sort beams by those with highest moment at unbraced length of 0
  var wBeamsList = Object.values(W_BEAMS_MAP)
      .sort((a, b) => +b.MnValues[0].Mn - +a.MnValues[0].Mn);
  // Get top sorted by Weight
  wByWeight = wBeamsList.sort((a, b) => +a.W - +b.W)
                        .slice(0, MATCHES_SHOWN);
  // Get top sorted by Weight
  wByDepth = wBeamsList.sort((a, b) => +a.d - +b.d)
                        .slice(0, MATCHES_SHOWN);

  var tr = table.insertRow();
  for(let i = 0; i < MATCHES_SHOWN; i++){
    let td = tr.insertCell();
    let beam = wByWeight[i];
    td.appendChild(createDiv('<div class="primary">' + beam.W + ' plf' + '</div><div class="secondary">' + beam.AISC_Manual_Label + '</div>'));
    td.addEventListener('mouseenter', () => matchMouseover(beam));
    td.addEventListener('mouseleave', () => matchMouseout(beam));
    if (i === 0){ td.setAttribute('class', 'best-beam');}
  }
  var tr = table.insertRow();
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('LIGHTEST BEAMS'));
  td.setAttribute('class', 'section-title');
  td.setAttribute('colspan', MATCHES_SHOWN);

  var tr = table.insertRow();
  for(let i = 0; i < MATCHES_SHOWN; i++){
    let td = tr.insertCell();
    let beam = wByDepth[i];
    td.appendChild(createDiv('<div class="primary">' + beam.d + ' in' + '</div><div class="secondary">' + beam.AISC_Manual_Label + '</div>'));
    td.addEventListener('mouseenter', () => matchMouseover(beam));
    td.addEventListener('mouseleave', () => matchMouseout(beam));
    if (i === 0){ td.setAttribute('class', 'best-beam');}
  }
  var tr = table.insertRow();
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('SHALLOWEST BEAMS'));
  td.setAttribute('class', 'section-title');
  td.setAttribute('colspan', MATCHES_SHOWN);

  container.appendChild(table);
}

function createDiv(html){
  var element = document.createElement('div');
  element.setAttribute('class', 'efficient-beam')
  element.innerHTML = html;
  return element;
}

function updateMatchList(){
  const table = document.getElementById('match-list-table');
  const rows = table.rows;
  const sortedBeams = getOptimalBeams(W_BEAMS_FILTERED);

  for (let i = 0; i < rows.length; i++){
    // Skip over title rows
    if (i === 1 || i === 3) continue;

    const row = rows[i];
    for(let j = 0; j < row.cells.length; j++){
      // Clone the cells to remove the previous event listener
      const oldCell = row.cells[j];
      const cell = oldCell.cloneNode(true);
      oldCell.parentNode.replaceChild(cell, oldCell);
      if (i === 0){
        let beam = sortedBeams.weight[j];
        if (beam){
          cell.innerHTML = '<div class="efficient-beam"><div class="primary">' + beam.W + ' plf' + '</div><div class="secondary">' + beam.AISC_Manual_Label + '</div></div>';
        } else if (j === 0) {
          cell.innerHTML = '<div class="efficient-beam"><div class="primary">' + 'No match' + '</div><div class="secondary">' + 'No beam matches your criteria' + '</div></div>';
        } else {
          cell.innerHTML = '';
        }
        cell.addEventListener('mouseenter', () => matchMouseover(beam));
        cell.addEventListener('mouseleave', () => matchMouseout(beam));
      } else {
        let beam = sortedBeams.depth[j];
        if (beam){
          cell.innerHTML = '<div class="efficient-beam"><div class="primary">' + beam.d + ' in' + '</div><div class="secondary">' + beam.AISC_Manual_Label + '</div></div>';
        } else if (j === 0) {
          cell.innerHTML = '<div class="efficient-beam"><div class="primary">' + 'No match' + '</div><div class="secondary">' + 'No beam matches your criteria' + '</div></div>';
        } else {
          cell.innerHTML = '';
        }
        cell.addEventListener('mouseenter', () => matchMouseover(beam));
        cell.addEventListener('mouseleave', () => matchMouseout(beam));
      }
    }
  }
}

function getOptimalBeams(filteredBeams){
  // Sort beams by those with highest moment at unbraced length of 0
  var wBeamsList = [].concat.apply([], filteredBeams.map(group => group.values))
      .sort((a, b) => +b.MnValues[0].Mn - +a.MnValues[0].Mn);
  return {
    weight: wBeamsList.sort((a, b) => +a.W - +b.W)
                      .slice(0, MATCHES_SHOWN + 1),
    depth: wBeamsList.sort((a, b) => +a.d - +b.d)
                      .slice(0, MATCHES_SHOWN + 1)
  }
}

function matchMouseover(d) {
  if (!d) {
    return;
  }
  showBeamDetails(d);
  showBeamProfile(d);
  highlightBeamI(d);
  highlightBeamDistribution(d);
}

function matchMouseout(d) {
  removeBeamProfile();
  removeBeamDistribution();
  if (!d) {
    return;
  }
  removeBeamDetails(d);
  removeHighlightBeamI(d);
}
