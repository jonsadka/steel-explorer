const DEFAULT_Fy = 50; // ksi
const DEFAULT_E = 29000; // ksi
const DEFAULT_Cb = 1; //
const MAX_UNBRACED = 41; // ft
const UNBRACED_STEP = 1; // ft
const TRANSITION_TIME = 1400; // ms

// User inputs
var START_LENGTH = null;
var USER_MOMENT_MAX = null;
var USER_MOMENT_MIN = null;
var USER_WEIGHT_MAX = null;
var USER_WEIGHT_MIN = null;
var USER_I_MAX = null;
var USER_I_MIN = null;
var USER_SAFTEY_FACTOR = 1;

// HEIGHTS
var CHARTS_HEIGHT = window.innerHeight;
var PADDING = 30;
var LEFT_ROW_1_HEIGHT = document.getElementById('top-container').offsetHeight + 2 * PADDING;
var LEFT_ROW_2_HEIGHT = 267 + 58 + PADDING;
var LEFT_ROW_3_HEIGHT = CHARTS_HEIGHT - LEFT_ROW_1_HEIGHT - LEFT_ROW_2_HEIGHT - PADDING - document.querySelector('#bottom-container .chart-title').offsetHeight;
var RIGHT_ROW_1_HEIGHT = document.getElementById('top-row').offsetHeight + 3 * PADDING + 20;
var RIGHT_ROW_2_HEIGHT = (CHARTS_HEIGHT - RIGHT_ROW_1_HEIGHT - document.querySelector('#middle-row .chart-title').offsetHeight) * 0.75;
var RIGHT_ROW_3_HEIGHT = (CHARTS_HEIGHT - RIGHT_ROW_1_HEIGHT - document.querySelector('#middle-row .chart-title').offsetHeight) * 0.25;
// WIDTHS
var LEFT_CHARTS_WIDTH = document.getElementById('bottom-container').offsetWidth;
var RIGHT_CHARTS_WIDTH = document.getElementById('right-column').offsetWidth - PADDING;

// CACHED GLOBAL PROPERTIES
var W_BEAMS = [];
var W_BEAMS_MAP = {};
var W_BEAMS_FILTERED = [];
var SPECIAL = null;
const PHI = 0.9;
const OMEGA = 1.67;

const CUSTOM_BLUE = '#344A82';
const CUSTOM_GREY = '#878B9B';
const TILE_BACKGROUND = '#E2E7EF';

let resizeId = null;

// HACK
(function(){
  d3.csv('https://jonsadka.github.io/steel-explorer/aisc-shapes-database-v15.0.csv').then((data) => {
    data = data.map(d => (d.AISC_Manual_Label === 'W40X294' ?
      // HACK: W40X294 and W40X294 have the same Ix. Fuzz one so they dont collide
      // in the voronoi diagram
      {...d, Ix: String(Number(d.Ix) + 0.1)} :
      d
    ));

    W_BEAMS_MAP = data.reduce((map, cv) => {
      if (cv.Type === 'W') map[cv.AISC_Manual_Label] = cv;
      return map;
    }, {})

    const beams = d3.nest()
      .key(d => d.AISC_Manual_Label.split('X')[0])
      .entries(data)

    W_BEAMS = beams.filter(isWSection);
    W_BEAMS.forEach(calculateProperties);
    SPECIAL = calculateSpecialProperties(W_BEAMS, {});

    initializeMatchList();
    initializeDistributionChart();
    initializeIChart();
    initializeMomentChart();
    initializeProfileChart();
  });
})();

function isWSection (data){
  return (data.key.slice(0, 1) === 'W') && (data.key.slice(0, 2) !== 'WT');
}

function calculateProperties (beamGroup){
  beamGroup.values.forEach(bm => {
    const c = 1;                                                     // [AISC 16.1-48 (F2-8a)]
    bm.Mp = DEFAULT_Fy * +bm.Zx; // kip-in
    bm.Lp = 1.76 * +bm.ry * Math.sqrt(DEFAULT_E / DEFAULT_Fy) / 12; // ft. [AISC 16.1-48 (F2-5)]
    bm.Lr = 1.95 * +bm.rts * (DEFAULT_E / (0.7 * DEFAULT_Fy)) // ft. [AISC 16.1-48 (F2-6)]
        * Math.sqrt(
          (+bm.J * c / (+bm.Sx * +bm.ho)) +
          Math.sqrt(
            Math.pow(+bm.J * c / (+bm.Sx * +bm.ho), 2) +
            6.76 * Math.pow(0.7 * DEFAULT_Fy / DEFAULT_E, 2)
          )
        ) / 12;
    // Returns Mn in kip-ft
    // Lb expected in feet
    bm.MnFunction = function(Lb){
      if (Lb <= bm.Lp){
        return bm.Mp / 12;
      } else if (bm.Lp < Lb && Lb <= bm.Lr) { // [AISC 16.1-48 (F2-2)]
        return Math.min(
          bm.Mp,
          DEFAULT_Cb *
            (bm.Mp - (bm.Mp - 0.7 * DEFAULT_Fy * +bm.Sx) * (Lb - bm.Lp)/(bm.Lr - bm.Lp))
        ) / 12;
      } else { // [AISC 16.1-47 (F2-4)]
        const Fcr =  // in ksi
          (DEFAULT_Cb * Math.pow(Math.PI, 2) * DEFAULT_E / Math.pow(Lb * 12 / +bm.rts, 2)) *
          Math.sqrt(
            1 + (0.078 * +bm.J * c / (+bm.Sx * +bm.ho) * Math.pow(Lb * 12/ +bm.rts, 2))
          );
        return Math.min(bm.Mp, Fcr * +bm.Sx) / 12;
      }
    }
    // Future optimization: Skip over every other point if you are in the straight line case (i.e. case 1)
    bm.MnValues = d3.range(0, MAX_UNBRACED, UNBRACED_STEP).map(length => {
      return { length: length, Mn: bm.MnFunction(length) }
    });
  })
}

function validateBeam (d, options){
  var passedValid = false;
  if (USER_MOMENT_MAX || USER_MOMENT_MIN){
    // SHOULD TECHNICALLY INTERPOLATE
    if (USER_MOMENT_MAX && (+d.MnValues[d.MnValues.length - 1].Mn * USER_SAFTEY_FACTOR) > USER_MOMENT_MAX) return options.invalid;
    if (USER_MOMENT_MIN && (+d.MnValues[0].Mn * USER_SAFTEY_FACTOR) < USER_MOMENT_MIN) return options.invalid;

    if (START_LENGTH) {
      const beamMoment = d.MnFunction(START_LENGTH) * USER_SAFTEY_FACTOR;
      if (beamMoment < USER_MOMENT_MIN) return options.invalid;
    }

    passedValid = true;
  }
  if (USER_WEIGHT_MIN || USER_WEIGHT_MAX){
    if (USER_WEIGHT_MIN && +d.W < USER_WEIGHT_MIN) return options.invalid;
    if (USER_WEIGHT_MAX && +d.W > USER_WEIGHT_MAX) return options.invalid;
    passedValid = true;
  }
  if (USER_I_MAX || USER_I_MIN){
    if (USER_I_MAX && +d.Ix > USER_I_MAX) return options.invalid;
    if (USER_I_MIN && +d.Ix < USER_I_MIN) return options.invalid;
    passedValid = true;
  }
  if (passedValid) return options.valid;
  return options.nullState;
}

function updateMoment(){
  var NEW_USER_MOMENT_MIN = +document.getElementById('moment-min-input').value;
  // var NEW_USER_MOMENT_MAX = document.getElementById('moment-max-input') ? +document.getElementById('moment-max-input').value : Infinity;

  // Don't update when a value is out of bounds
  const GREATEST_BEAM_MOMENT = 17208;
  if (NEW_USER_MOMENT_MIN > GREATEST_BEAM_MOMENT) return;

  // Don't update when the min is greater than the max
  // if (NEW_USER_MOMENT_MIN && NEW_USER_MOMENT_MAX && NEW_USER_MOMENT_MIN > NEW_USER_MOMENT_MAX) return;

  // Dont update when there is no change in the values
  // if (USER_MOMENT_MAX === NEW_USER_MOMENT_MAX && USER_MOMENT_MIN === NEW_USER_MOMENT_MIN) return;
  if (USER_MOMENT_MIN === NEW_USER_MOMENT_MIN) return;

  USER_MOMENT_MIN = NEW_USER_MOMENT_MIN;
  // USER_MOMENT_MAX = NEW_USER_MOMENT_MAX;
  updateVisual();
}

function updateWeight() {
  // var NEW_USER_WEIGHT_MIN = document.getElementById('weight-min-input') ? +document.getElementById('weight-min-input').value : -Infinity;
  var NEW_USER_WEIGHT_MAX = +document.getElementById('weight-max-input').value;

  // Don't update when a value is out of bounds
  const LIGHTEST_BEAM_WEIGHT = 8.5;
  const USER_EMPTY_VALUE = 0;
  if (NEW_USER_WEIGHT_MAX < LIGHTEST_BEAM_WEIGHT & NEW_USER_WEIGHT_MAX !== USER_EMPTY_VALUE) return;

  // Don't update when the min is greater than the max
  // if (NEW_USER_WEIGHT_MIN && NEW_USER_WEIGHT_MAX && NEW_USER_WEIGHT_MIN > NEW_USER_WEIGHT_MAX) return;

  // Dont update when there is no change in the values
  // if (USER_WEIGHT_MAX === NEW_USER_WEIGHT_MAX && USER_WEIGHT_MIN === NEW_USER_WEIGHT_MIN) return;
  if (USER_WEIGHT_MAX === NEW_USER_WEIGHT_MAX) return;

  // USER_WEIGHT_MIN = NEW_USER_WEIGHT_MIN;
  USER_WEIGHT_MAX = NEW_USER_WEIGHT_MAX;
  updateVisual();
}

function updateI() {
  var NEW_USER_I_MIN = +document.getElementById('I-min-input').value;
  // var NEW_USER_I_MAX = document.getElementById('I-max-input') ? +document.getElementById('I-max-input').value : Infinity;

  // Don't update when a value is out of bounds
  const GREATEST_BEAM_I = 73000;
  if (NEW_USER_I_MIN > GREATEST_BEAM_I) return;

  // Don't update when the min is greater than the max
  // if (NEW_USER_I_MIN && NEW_USER_I_MAX && NEW_USER_I_MIN > NEW_USER_I_MAX) return;

  // Dont update when there is no change in the values
  // if (USER_I_MAX === NEW_USER_I_MAX && USER_I_MIN === NEW_USER_I_MIN) return;
  if (USER_I_MIN === NEW_USER_I_MIN) return;

  USER_I_MIN = NEW_USER_I_MIN;
  // USER_I_MAX = NEW_USER_I_MAX;
  updateVisual();
}

function updateSafteyFactor() {
  const safteyFactor = document.getElementById('saftey-factor-dropdown');
  const {selectedIndex} = safteyFactor.options;
  const checkedId = safteyFactor.options[selectedIndex].value;
  USER_SAFTEY_FACTOR = checkedId === 'LRFD' ? PHI :
    checkedId === 'ASD' ? (1 / OMEGA) :
      1;
  updateVisual();
}

function updateLength() {
  const userLength = +document.getElementById('unbraced-length-input').value;
  if (START_LENGTH === (userLength - 2)) return;
  START_LENGTH = Math.max(0, userLength - 2);
  const endLength = (userLength === 0) ? (MAX_UNBRACED - 1) : Math.min(MAX_UNBRACED - 1, userLength + 2);

  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  updateVisual();
}

function updateVisual(){
  SPECIAL = calculateSpecialProperties(W_BEAMS, {});
  filterBeams();

  updateMatchList();
  updateDistributionChart();
  updateMomentChart();
  updateIChart();
}

window.addEventListener('resize', onResize);

function onResize() {
  clearTimeout(resizeId);
  resizeId = setTimeout(endResize, 300);

  // Update heights
  CHARTS_HEIGHT = window.innerHeight;
  LEFT_ROW_3_HEIGHT = CHARTS_HEIGHT - LEFT_ROW_1_HEIGHT - LEFT_ROW_2_HEIGHT - PADDING - document.querySelector('#bottom-container .chart-title').offsetHeight;
  RIGHT_ROW_1_HEIGHT = document.getElementById('top-row').offsetHeight + 3 * PADDING + 20;
  RIGHT_ROW_2_HEIGHT = (CHARTS_HEIGHT - RIGHT_ROW_1_HEIGHT - document.querySelector('#middle-row .chart-title').offsetHeight) * 0.75;
  RIGHT_ROW_3_HEIGHT = (CHARTS_HEIGHT - RIGHT_ROW_1_HEIGHT - document.querySelector('#middle-row .chart-title').offsetHeight) * 0.25;
  // Update widths
  RIGHT_CHARTS_WIDTH = document.getElementById('right-column').offsetWidth - PADDING;

  resizeIChart();
  resizeDistributionChart();
  resizeMomentChart();
}

function endResize() {
  recalculateIVoronoi();
  recalculateDistributionVoronoi();
  recalculateMomentVoronoi();
}

function noResults() {
  return hasFilterSelected() && !W_BEAMS_FILTERED.length;
}

function hasFilterSelected() {
  return USER_MOMENT_MIN || USER_WEIGHT_MAX || USER_I_MIN;
}

function calculateSpecialProperties(beams, options){
  var endLength = MAX_UNBRACED;
  var maxMoment = !!USER_MOMENT_MAX ? Math.max(1, USER_MOMENT_MAX) : Infinity;
  var minMoment = !!USER_MOMENT_MIN ? Math.min(17200, USER_MOMENT_MIN) : 0;
  var maxWeight = !!USER_WEIGHT_MAX ? Math.max(8, USER_WEIGHT_MAX) : Infinity;
  var minWeight = !!USER_WEIGHT_MIN ? Math.min(925, USER_WEIGHT_MIN) : 0;
  var maxI = !!USER_I_MAX ? Math.max(11, USER_I_MAX) : Infinity;
  var minI = !!USER_I_MIN ? Math.min(73000, USER_I_MIN) : 0;

  var groupDimensions = {}
  var special = beams.slice().reduce((pv, cv) => {
    var wGroup = cv.key;
    var groupStats = cv.values.reduce((pv, cv) => {
      var shouldUpdateMn = false;
      var shouldUpdateW = false;
      var shouldUpdateI = false;
      var shouldUpdateIxPerW = false;
      var shouldUpdateDimensions = false;
      if (minMoment <= (+cv.MnValues[0].Mn * USER_SAFTEY_FACTOR) && (+cv.MnValues[0].Mn * USER_SAFTEY_FACTOR) <= maxMoment){
        if (minWeight <= +cv.W && +cv.W <= maxWeight){
          if (minI <= +cv.Ix && +cv.Ix <= maxI){
            shouldUpdateMn = true;
            shouldUpdateW = true;
            shouldUpdateI = true;
            shouldUpdateIxPerW = true;
            shouldUpdateDimensions = true;
          }
        }
      }

      if (shouldUpdateMn){
        pv.Mn.Min = Math.min(pv.Mn.Min, cv.MnFunction(endLength) * USER_SAFTEY_FACTOR);
        pv.Mn.Max = Math.max(pv.Mn.Max, cv.MnFunction(0) * USER_SAFTEY_FACTOR);
      }
      if (shouldUpdateW){
        pv.W.Min = Math.min(pv.W.Min, +cv.W);
        pv.W.Max = Math.max(pv.W.Max, +cv.W);
      }
      if (shouldUpdateI){
        pv.I.Min = Math.min(pv.I.Min, +cv.Ix);
        pv.I.Max = Math.max(pv.I.Max, +cv.Ix);
      }
      if (shouldUpdateIxPerW){
        pv.IxPerW.Min = Math.min(pv.IxPerW.Min, +cv.Ix / +cv.W);
        pv.IxPerW.Max = Math.max(pv.IxPerW.Max, +cv.Ix / +cv.W);
      }
      if (shouldUpdateDimensions){
        pv.d.Min = Math.min(pv.d.Min, +cv.d);
        pv.d.Max = Math.max(pv.d.Max, +cv.d);
        pv.bf.Min = Math.min(pv.bf.Min, +cv.bf);
        pv.bf.Max = Math.max(pv.bf.Max, +cv.bf);
      }

      return pv
    }, {
      Mn: {Min: Infinity, Max: 0},
      W: {Min: Infinity, Max: 0},
      I: {Min: Infinity, Max: 0},
      IxPerW: {Min: Infinity, Max: 0},
      d: {Min: Infinity, Max: 0},
      bf: {Min: Infinity, Max: 0}
    });

    // Set the min and max properties thus far
    var specialProperties = ['Mn', 'W', 'I', 'IxPerW', 'd', 'bf'];
    for (var i = 0; i < specialProperties.length; i++){
      var variable = specialProperties[i];
      pv[variable].Min = Math.min(pv[variable].Min, groupStats[variable].Min);
      pv[variable].Max = Math.max(pv[variable].Max, groupStats[variable].Max);
    }
    // Cache the W group min and max dimensions
    groupDimensions[wGroup] = groupDimensions[wGroup] || {};
    var specialDimensions = ['d', 'bf'];
    for (var i = 0; i < specialDimensions.length; i++){
      var dimension = specialDimensions[i];
      groupDimensions[wGroup][dimension] = groupDimensions[wGroup][dimension] || {};
      if (groupStats[dimension].Max > 0) {
        groupDimensions[wGroup][dimension].Max = groupStats[dimension].Max;
      }
      if (groupStats[dimension].Min < Infinity){
        groupDimensions[wGroup][dimension].Min = groupStats[dimension].Min;
      }
      // Delete the dimension if no dimensions were set
      if (!Object.keys(groupDimensions[wGroup][dimension]).length) delete groupDimensions[wGroup][dimension];
    }
    // Delete the W group if no dimensions were set
    if (!Object.keys(groupDimensions[wGroup]).length) delete groupDimensions[wGroup];

    return pv;
  }, {
    Mn: {Min: Infinity, Max: 0},
    W: {Min: Infinity, Max: 0},
    I: {Min: Infinity, Max: 0},
    IxPerW: {Min: Infinity, Max: 0},
    d: {Min: Infinity, Max: 0},
    bf: {Min: Infinity, Max: 0}
  });

  special.groupDimensions = Object.keys(groupDimensions).map(function(wGroup){
    groupDimensions[wGroup].key = wGroup;
    return groupDimensions[wGroup];
  });
  //Add padding to x and y axis
  if (USER_MOMENT_MAX){
    special.Mn.boundMax = Math.ceil(special.Mn.Max + special.Mn.Max * 0.20);
  } else {
    special.Mn.boundMax = Math.ceil(special.Mn.Max + special.Mn.Max * 0.01);
  }
  special.Mn.boundMin = Math.floor(special.Mn.Min - special.Mn.Min * 0.01);
  special.I.boundMin = Math.floor(special.I.Min - special.I.Min * 0.01);
  special.I.boundMax = Math.ceil(special.I.Max + special.I.Max * 0.01);
  special.d.boundMin = Math.floor(special.d.Min - special.d.Min * 0.05);
  special.d.boundMax = Math.ceil(special.d.Max + special.d.Max * 0.05);
  special.bf.boundMin = Math.floor(special.bf.Min - special.bf.Min * 0.05);
  special.bf.boundMax = Math.ceil(special.bf.Max + special.bf.Max * 0.05);
  return special;
}

function filterBeams(){
  W_BEAMS_FILTERED = W_BEAMS.map(group => {
    const groupValues = [];
    for (var i = 0; i < group.values.length; i++){
      const beam = group.values[i];
      if (validateBeam(beam, {valid: true, invalid: false, nullState: true})) {
        groupValues.push(beam);
      }
    }
    return {key: group.key, values: groupValues};
  })
  .filter(group => group.values.length);
}

function escapeCharacter(string){
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}
