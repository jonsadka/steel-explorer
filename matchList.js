var MATCHES_SHOWN = 3;

function initializeMatchList(){
  var container = document.getElementById('middle-container'),
      table  = document.createElement('table');
  table.id = 'match-list-table'

  MATCHES_SHOWN = Math.floor((container.offsetWidth - 150) / 88) || MATCHES_SHOWN; // 50 px per cell

  // Sort beams by those with highest unbraced length of 0
  var wBeamsList = Object.keys(W_BEAMS_MAP)
      .map(function(shape){ return W_BEAMS_MAP[shape]; })
      .sort(function(a, b){ return +b.MnValues[0].Mn - +a.MnValues[0].Mn; });
  // Get top sorted by Weight
  wByWeight = wBeamsList.sort(function(a, b){ return +a.W - +b.W; }).slice(0, MATCHES_SHOWN);
  // Get top sorted by Weight
  wByDepth = wBeamsList.sort(function(a, b){ return +a.d - +b.d; }).slice(0, MATCHES_SHOWN);

  var tr = table.insertRow();
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('Lightest'));
  for(var i = 0; i < MATCHES_SHOWN; i++){
    var td = tr.insertCell();
    var beam = wByWeight[i];
    td.appendChild(createDiv('<div class="primary">' + beam.AISC_Manual_Label + '</div><div class="secondary">' + beam.W + ' plf' + '</div>'));
    if (i === 0){ td.setAttribute('class', 'best-beam');}
  }

  var tr = table.insertRow();
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('Shallowest'));
  for(var i = 0; i < MATCHES_SHOWN; i++){
    var td = tr.insertCell();
    var beam = wByDepth[i];
    td.appendChild(createDiv('<div class="primary">' + beam.AISC_Manual_Label + '</div><div class="secondary">' + beam.d + ' in' + '</div>'));
    if (i === 0){ td.setAttribute('class', 'best-beam');}
  }
  container.removeChild(container.lastChild);
  container.removeChild(container.lastChild);
  container.appendChild(table);
}

function createDiv(html){
  var element = document.createElement('div');
  element.setAttribute('class', 'efficient-beam')
  element.innerHTML = html;
  return element;
}

function updateMatchList(){
  var table = document.getElementById('match-list-table');
  var rows = table.rows;
  var sortedBeams = getOptimalBeams(W_BEAMS_FILTERED)

  for (var i = 0; i < rows.length; i++){
    var row = rows[i];
    for(var j = 0; j < row.cells.length; j++){
      if (j === 0) continue;
      var cell = row.cells[j];
      if (i === 0){
        var beam = sortedBeams.weight[j];
        if (beam){
          cell.innerHTML = '<div class="efficient-beam"><div class="primary">' + beam.AISC_Manual_Label + '</div><div class="secondary">' + beam.W + ' plf' + '</div></div>';
        } else {cell.innerHTML = '';}
      } else{
        var beam = sortedBeams.depth[j];
        if (beam){
          cell.innerHTML = '<div class="efficient-beam"><div class="primary">' + beam.AISC_Manual_Label + '</div><div class="secondary">' + beam.d + ' in' + '</div></div>';
        } else {cell.innerHTML = '';}
      }
    }
  }
}

function getOptimalBeams(filteredBeams){
  // Sort beams by those with highest unbraced length of 0
  var wBeamsList = [].concat.apply([], filteredBeams.map(function(group){ return group.values; }))
      .sort(function(a, b){ return +b.MnValues[0].Mn - +a.MnValues[0].Mn; });
  // Add filler to array to take place of header
  wBeamsList.unshift('Header');
  return {
    weight: wBeamsList.sort(function(a, b){ return +a.W - +b.W; }).slice(0, MATCHES_SHOWN + 1),
    depth: wBeamsList.sort(function(a, b){ return +a.d - +b.d; }).slice(0, MATCHES_SHOWN + 1)
  }
}
