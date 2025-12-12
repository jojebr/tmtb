/**
 * @title TMT B
 * @description Trail-making test del B
 * @version 0.1.0
 *
 * @assets assets/
 */
// You can import stylesheets (.scss or .css).
import "../styles/main.scss";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import InstructionsPlugin from "@jspsych/plugin-instructions";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";

// ============================================
// CONFIGURATION - Change these values as needed
// ============================================
const TARGET_WIDTH = 1080;   // Target device width in pixels
const TARGET_HEIGHT = 810;   // Target device height in pixels
const SAVE_JSON_FILE = false; // Set to true to auto-download JSON file on completion
// ============================================

// Reference dimensions (original measurements)
const REFERENCE_WIDTH = 1080;
const REFERENCE_HEIGHT = 810;

// Calculate scale factors
const SCALE_X = TARGET_WIDTH / REFERENCE_WIDTH;
const SCALE_Y = TARGET_HEIGHT / REFERENCE_HEIGHT;

/**
 * Scale a position from reference dimensions to target dimensions
 */
function scalePosition(x, y) {
  return {
    x: Math.round(x * SCALE_X),
    y: Math.round(y * SCALE_Y)
  };
}

/**
 * Scale an array of positions
 */
function scalePositions(positions) {
  return positions.map(pos => {
    const scaled = scalePosition(pos.x, pos.y);
    return { ...pos, x: scaled.x, y: scaled.y };
  });
}

/**
 * Standardiserade positioner för övning (1-4, A-D)
 * Reference dimensions: 1080x810 (NOT rotated)
 */
const PRACTICE_POSITIONS_REF = [
  { x: 474, y: 437, number: 1, type: 'number', label: "START" },
  { x: 789, y: 102, number: 'A', type: 'letter' },
  { x: 1001, y: 443, number: 2, type: 'number' },
  { x: 713, y: 287, number: 'B', type: 'letter' },
  { x: 765, y: 641, number: 3, type: 'number' },
  { x: 214, y: 593, number: 'C', type: 'letter' },
  { x: 119, y: 150, number: 4, type: 'number' },
  { x: 399, y: 217, number: 'D', type: 'letter', label: "SLUT" }
];

const PRACTICE_POSITIONS = scalePositions(PRACTICE_POSITIONS_REF);

/**
 * Standardiserade positioner för test (1-13, A-L)
 * Reference dimensions: 1080x810 (rotated)
 */
const TEST_POSITIONS_REF = [
  { x: 469, y: 369, number: 1, type: 'number', label: "START" },
  { x: 744, y: 243, number: 'A', type: 'letter' },
  { x: 793, y: 568, number: 2, type: 'number' },
  { x: 244, y: 423, number: 'B', type: 'letter' },
  { x: 368, y: 423, number: 3, type: 'number' },
  { x: 598, y: 272, number: 'C', type: 'letter' },
  { x: 223, y: 342, number: 4, type: 'number' },
  { x: 209, y: 169, number: 'D', type: 'letter' },
  { x: 522, y: 169, number: 5, type: 'number' },
  { x: 893, y: 146, number: 'E', type: 'letter' },
  { x: 812, y: 463, number: 6, type: 'number' },
  { x: 887, y: 647, number: 'F', type: 'letter' },
  { x: 436, y: 534, number: 7, type: 'number' },
  { x: 670, y: 633, number: 'G', type: 'letter' },
  { x: 179, y: 638, number: 8, type: 'number' },
  { x: 510, y: 604, number: 'H', type: 'letter' },
  { x: 182, y: 515, number: 9, type: 'number' },
  { x: 185, y: 254, number: 'I', type: 'letter' },
  { x: 142, y: 90, number: 10, type: 'number' },
  { x: 775, y: 125, number: 'J', type: 'letter' },
  { x: 933, y: 736, number: 11, type: 'number' },
  { x: 932, y: 229, number: 'K', type: 'letter' },
  { x: 411, y: 689, number: 12, type: 'number' },
  { x: 824, y: 674, number: 'L', type: 'letter' },
  { x: 127, y: 690, number: 13, type: 'number', label: "SLUT" }
];

const TEST_POSITIONS = scalePositions(TEST_POSITIONS_REF);

/**
 * Custom jsPsych plugin för TMT med realtidsvalidering
 */
class CustomTMTPlugin {
  static info = {
    name: 'custom-tmt-b',
    parameters: {
      positions: { default: [] },
      canvas_width: { default: TARGET_WIDTH },
      canvas_height: { default: TARGET_HEIGHT },
      circle_radius: { default: 30 },
      is_practice: { default: false },
      circle_count: { default: 25 }
    }
  };

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    let startTime = performance.now();
    let currentIndex = 0; // Index in the sequence
    let isDrawing = false;
    let lastX = null;
    let lastY = null;
    let errors = 0;
    let strokes = [];
    let currentStroke = [];
    let liftOffEvents = [];
    
    // Skapa HTML
    const html = `
      <div id="tmt-container" style="text-align: center;">
        <canvas id="tmt-canvas" width="${trial.canvas_width}" height="${trial.canvas_height}" 
                style="border: 2px solid black; background-color: #f0f0f0; touch-action: none; cursor: crosshair;">
        </canvas>
      </div>
    `;
    
    display_element.innerHTML = html;
    
    const canvas = document.getElementById('tmt-canvas');
    const ctx = canvas.getContext('2d');
    
    // Rita cirklar
    function drawCircles() {
      trial.positions.forEach((pos, idx) => {
        // Rita cirkel
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, trial.circle_radius, 0, 2 * Math.PI);
        ctx.fillStyle = idx < currentIndex ? '#ccffcc' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rita nummer/bokstav
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pos.number.toString(), pos.x, pos.y);
        
        // Rita START/SLUT etiketter
        if (pos.label) {
          ctx.font = 'bold 14px Arial';
          ctx.fillText(pos.label, pos.x, pos.y - trial.circle_radius - 15);
        }
      });
    }
    
    // Kontrollera om punkt är i cirkel
    function isPointInCircle(px, py, circle) {
      const dx = px - circle.x;
      const dy = py - circle.y;
      return Math.sqrt(dx * dx + dy * dy) <= trial.circle_radius;
    }
    
    // Hämta canvas-koordinater från event
    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    
    // Rita linje
    function drawLine(x1, y1, x2, y2) {
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Rita alla streck på nytt
    function redrawAll() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCircles();
      
      // Rita alla tidigare streck
      strokes.forEach(stroke => {
        for (let i = 1; i < stroke.length; i++) {
          drawLine(stroke[i-1].x, stroke[i-1].y, stroke[i].x, stroke[i].y);
        }
      });
      
      // Rita nuvarande streck
      for (let i = 1; i < currentStroke.length; i++) {
        drawLine(currentStroke[i-1].x, currentStroke[i-1].y, currentStroke[i].x, currentStroke[i].y);
      }
    }
    
    // Börja rita
    function startDrawing(e) {
      e.preventDefault();
      const coords = getCanvasCoords(e);
      
      // If we haven't started yet, must start from first position
      if (strokes.length === 0) {
        const targetCircle = trial.positions[0];
        if (isPointInCircle(coords.x, coords.y, targetCircle)) {
          isDrawing = true;
          lastX = coords.x;
          lastY = coords.y;
          currentStroke = [{ x: lastX, y: lastY, timestamp: performance.now() }];
        } else {
          errors++;
        }
      } else {
        // After lifting, must continue from near the last drawn point
        const lastStroke = strokes[strokes.length - 1];
        const lastPoint = lastStroke[lastStroke.length - 1];
        const distance = Math.sqrt(
          Math.pow(coords.x - lastPoint.x, 2) + 
          Math.pow(coords.y - lastPoint.y, 2)
        );
        
        // Allow starting within reasonable distance of last point (e.g., 50px)
        if (distance < 50) {
          isDrawing = true;
          lastX = coords.x;
          lastY = coords.y;
          currentStroke = [{ x: lastX, y: lastY, timestamp: performance.now() }];
        } else {
          errors++;
        }
      }
    }
    
    // Fortsätt rita
    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      
      const coords = getCanvasCoords(e);
      drawLine(lastX, lastY, coords.x, coords.y);
      currentStroke.push({ x: coords.x, y: coords.y, timestamp: performance.now() });
      
      // Kontrollera om vi nått nästa cirkel
      const targetCircle = trial.positions[currentIndex];
      if (isPointInCircle(coords.x, coords.y, targetCircle)) {
        currentIndex++;
        
        // Rita om allt för att visa framsteg
        redrawAll();
        
        // Kontrollera om klart
        if (currentIndex >= trial.circle_count) {
          endTrial();
          return;
        }
      }
      
      lastX = coords.x;
      lastY = coords.y;
    }
    
    // Sluta rita (lyft finger)
    function stopDrawing(e) {
      if (isDrawing) {
        e.preventDefault();
        isDrawing = false;
        strokes.push([...currentStroke]);
        
        // Registrera lift-off händelse
        liftOffEvents.push({
          timestamp: performance.now(),
          position: { x: lastX, y: lastY },
          currentTarget: currentIndex
        });
        
        currentStroke = [];
      }
    }
    
    // Avsluta test
    const endTrial = () => {
      const endTime = performance.now();
      const completionTime = endTime - startTime;
      
      // Ta bort eventlyssnare
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      
      // Spara data
      const trialData = {
        trial_type: trial.is_practice ? 'practice' : 'test',
        trial_name: trial.is_practice ? 'övning' : 'test',
        test_part: 'B',
        circle_count: trial.circle_count,
        completion_time_ms: completionTime,
        completion_time_seconds: (completionTime / 1000).toFixed(2),
        strokes_count: strokes.length,
        lift_count: liftOffEvents.length,
        errors: errors,
        positions: trial.positions,
        strokes: strokes,
        lift_events: liftOffEvents,
        canvas_width: trial.canvas_width,
        canvas_height: trial.canvas_height
      };
      
      this.jsPsych.finishTrial(trialData);
    };
    
    // Lägg till eventlyssnare
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch-events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Initial ritning
    drawCircles();
  }
}

/**
 * Skapa TMT-test med standardiserade positioner
 */
function createTMTTrial(isPractice = false) {
  const positions = isPractice ? PRACTICE_POSITIONS : TEST_POSITIONS;
  
  return {
    type: CustomTMTPlugin,
    positions: positions,
    canvas_width: TARGET_WIDTH,
    canvas_height: TARGET_HEIGHT,
    circle_radius: 30,
    is_practice: isPractice,
    circle_count: positions.length
  };
}

/**
 * Huvudfunktion för experimentet
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
  // Extract pid from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get('pid') || 'unknown';
  
  const jsPsych = initJsPsych({
    on_finish: function() {
      // Optionally save data as JSON file
      if (SAVE_JSON_FILE) {
        jsPsych.data.get().localSave('json', `tmt-b-results-${pid}.json`);
      }
    }
  });
  
  // Add pid to all trials
  jsPsych.data.addProperties({
    pid: pid,
    test_version: 'TMT-B',
    target_width: TARGET_WIDTH,
    target_height: TARGET_HEIGHT
  });
  
  const timeline = [];

  // Förladdning av tillgångar
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video,
  });

  // Auto-enter fullscreen immediately (no pause screen)
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
    delay_after: 0
  });

  // Instruktioner (med touch/mouse navigation)
  timeline.push({
    type: InstructionsPlugin,
    pages: [
      `<div style="max-width: 800px; margin: auto; color: white;">
        <h1>Trail Making Test - Del B</h1>
        <p style="font-size: 1.2em;">Välkommen till Trail Making Test Del B!</p>
        <p>I detta test kommer du att se cirklar med både siffror och bokstäver.</p>
        <p>Din uppgift är att förbinda cirklarna genom att <strong>alternera mellan siffror och bokstäver</strong>.</p>
      </div>`,
      `<div style="max-width: 800px; margin: auto; color: white;">
        <h2>Instruktioner</h2>
        <p>• Rita ett streck från 1 till A, sedan till 2, sedan till B, och så vidare.</p>
        <p>• Alternera alltid: <strong>siffra → bokstav → siffra → bokstav</strong></p>
        <p>• Försök att inte lyfta fingret/pennan från skärmen.</p>
        <p>• Om du lyftar fingret, fortsätt från där du slutade.</p>
        <p>• Arbeta så snabbt och noggrant som möjligt.</p>
      </div>`,
      `<div style="max-width: 800px; margin: auto; color: white;">
        <h2>Övning</h2>
        <p>Vi börjar med en kort övning: 1-A-2-B-3-C-4-D</p>
        <p>Detta är för att du ska bekanta dig med uppgiften.</p>
        <p>Redo? Tryck "Nästa" för att börja övningen.</p>
      </div>`
    ],
    show_clickable_nav: true,
    button_label_previous: "Föregående",
    button_label_next: "Nästa",
    on_finish: function() {
      const displayEl = jsPsych.getDisplayElement();
      displayEl.innerHTML = "";
    }
  });

  // Övning (1-4, A-D)
  timeline.push(createTMTTrial(true));

  // Instruktioner för huvudtest
  timeline.push({
    type: InstructionsPlugin,
    pages: [
      `<div style="max-width: 800px; margin: auto; color: white;">
        <h2>Bra jobbat!</h2>
        <p>Nu ska du göra det riktiga testet.</p>
        <p>Den här gången finns det fler cirklar: 1-A-2-B-3-C... till 13-L</p>
        <p><strong>Kom ihåg:</strong> Alternera mellan siffror och bokstäver så snabbt och noggrant som möjligt.</p>
        <p>Din tid kommer att registreras.</p>
      </div>`
    ],
    show_clickable_nav: true,
    button_label_previous: "Föregående",
    button_label_next: "Nästa",
    on_finish: function() {
      const displayEl = jsPsych.getDisplayElement();
      displayEl.innerHTML = "";
    }
  });

  // Huvudtest (1-13, A-L)
  timeline.push(createTMTTrial(false));

  // Slutskärm (med button istället för keyboard)
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: `<div style="max-width: 800px; margin: auto; text-align: center; color: white;">
      <h2>Nu är du färdig med testet!</h2>
      <p style="margin-top: 30px; font-size: 1.2em;">Tack för ditt deltagande!</p>
    </div>`,
    choices: ['Avsluta'],
    margin_vertical: '40px',
    on_load: function() {
      // Ensure canvas is removed/hidden
      const canvas = document.getElementById('tmt-canvas');
      if (canvas) {
        canvas.style.display = 'none';
      }
    }
  });

  await jsPsych.run(timeline);

  // Return jsPsych instance so results are always available to jsPsych Builder
  return jsPsych;
}