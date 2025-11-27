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

/**
 * Standardiserade positioner för övning (1-4, A-D)
 * Skalad (INTE roterad) för Lenovo Tab M9 1340x800
 */
const PRACTICE_POSITIONS = [
  { x: 588, y: 432, number: 1, type: 'number', label: "START" },
  { x: 979, y: 101, number: 'A', type: 'letter' },
  { x: 1242, y: 437, number: 2, type: 'number' },
  { x: 885, y: 283, number: 'B', type: 'letter' },
  { x: 950, y: 633, number: 3, type: 'number' },
  { x: 266, y: 586, number: 'C', type: 'letter' },
  { x: 148, y: 148, number: 4, type: 'number'},
  { x: 495, y: 214, number: 'D', type: 'letter', label: "SLUT"}
];

/**
 * Standardiserade positioner för test (1-13, A-L)
 * Roterad 90° och skalad för Lenovo Tab M9 1340x800
 */
const TEST_POSITIONS = [
  { x: 582, y: 364, number: 1, type: 'number', label: "START" },
  { x: 923, y: 240, number: 'A', type: 'letter' },
  { x: 984, y: 561, number: 2, type: 'number' },
  { x: 303, y: 418, number: 'B', type: 'letter' },
  { x: 457, y: 418, number: 3, type: 'number' },
  { x: 742, y: 269, number: 'C', type: 'letter' },
  { x: 277, y: 338, number: 4, type: 'number' },
  { x: 259, y: 167, number: 'D', type: 'letter' },
  { x: 648, y: 167, number: 5, type: 'number' },
  { x: 1108, y: 144, number: 'E', type: 'letter' },
  { x: 1008, y: 457, number: 6, type: 'number' },
  { x: 1101, y: 639, number: 'F', type: 'letter' },
  { x: 541, y: 528, number: 7, type: 'number' },
  { x: 831, y: 625, number: 'G', type: 'letter' },
  { x: 222, y: 630, number: 8, type: 'number' },
  { x: 633, y: 596, number: 'H', type: 'letter' },
  { x: 226, y: 509, number: 9, type: 'number' },
  { x: 230, y: 251, number: 'I', type: 'letter' },
  { x: 176, y: 89, number: 10, type: 'number' },
  { x: 962, y: 123, number: 'J', type: 'letter' },
  { x: 1158, y: 727, number: 11, type: 'number' },
  { x: 1157, y: 226, number: 'K', type: 'letter' },
  { x: 510, y: 680, number: 12, type: 'number' },
  { x: 1023, y: 666, number: 'L', type: 'letter' },
  { x: 158, y: 681, number: 13, type: 'number', label: "SLUT" }
];

/**
 * Custom jsPsych plugin för TMT med realtidsvalidering
 */
class CustomTMTPlugin {
  static info = {
    name: 'custom-tmt-b',
    parameters: {
      positions: { default: [] },
      canvas_width: { default: 1340 },
      canvas_height: { default: 800 },
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
        <div id="tmt-prompt" style="margin-bottom: 20px;">
          <p><strong>${trial.is_practice ? 'ÖVNING' : 'TEST'}</strong></p>
          <p>Dra ett streck: 1-A-2-B-3-C osv. (alternerande mellan siffror och bokstäver)</p>
          <p id="error-message" style="color: red; min-height: 20px; font-weight: bold;"></p>
        </div>
        <canvas id="tmt-canvas" width="${trial.canvas_width}" height="${trial.canvas_height}" 
                style="border: 2px solid black; background-color: #f0f0f0; touch-action: none; cursor: crosshair;">
        </canvas>
        <div style="margin-top: 10px; color: #666; font-size: 14px;">
          <p>Antal lyft: <span id="lift-count">0</span></p>
        </div>
      </div>
    `;
    
    display_element.innerHTML = html;
    
    const canvas = document.getElementById('tmt-canvas');
    const ctx = canvas.getContext('2d');
    const errorMessage = document.getElementById('error-message');
    const liftCountSpan = document.getElementById('lift-count');
    
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
          errorMessage.textContent = '';
        } else {
          errorMessage.textContent = 'Vänligen börja från 1 (START)';
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
          errorMessage.textContent = '';
        } else {
          errorMessage.textContent = 'Fortsätt från där du slutade';
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
        
        // Uppdatera räknare
        liftCountSpan.textContent = liftOffEvents.length;
        
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
        lift_events: liftOffEvents
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
    canvas_width: 1340,
    canvas_height: 800,
    circle_radius: 30,
    is_practice: isPractice,
    circle_count: positions.length
  };
}

/**
 * Huvudfunktion för experimentet
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
  const jsPsych = initJsPsych({
    on_finish: function() {
      // Spara data som JSON-fil
      jsPsych.data.get().localSave('json', 'tmt-b-results.json');
    }
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
    margin_vertical: '40px'
  });

  await jsPsych.run(timeline);

  return jsPsych;
}