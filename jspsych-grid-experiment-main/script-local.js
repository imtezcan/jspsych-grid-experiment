// Add CSS styles
const style = document.createElement('style');
style.textContent = `
  .instructions-page {
    font-size: 24px; 
    font-weight: bold;
  }
  .instructions-page h1 {
    font-size: 40px; 
    font-weight: bold;
  }
  .instructions-page h2 {
    font-size: 20px; 
    font-weight: bold;
  }
  .centered-text {
    text-align: center;
  }
  .left-aligned-text {
    text-align: left; 
  }
  .image-container {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 10px; 
  }
  form {
    margin-top: 5px; 
  }
  form label {
    display: block;
    margin-bottom: 5px; 
  }
  form input, form textarea {
    margin-bottom: 10px;
    width: 90%; 
    padding: 8px;
    font-size: 14px; 
  }
  .image-container img {
    max-width: 100%;
    height: auto;
  }
  .second-page {
    background-size: cover; 
    background-position: center; 
    color: #000; 
  }
  .two-columns {
    display: flex;
    justify-content: space-between;
  }
`;

document.head.appendChild(style);

// Initialize the timeline
const timeline = [];

// Function to create the grid HTML elements from grid data
function createGridHTML(trialData) {
  const gridSize = trialData.length;
  const gridContainer = document.createElement('div');
  gridContainer.classList.add('grid-container');
  gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 50px)`; // Set the grid template columns dynamically

  for (let row = 0; row < trialData.length; row++) {
    for (let col = 0; col < trialData[0].length; col++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.style.backgroundColor = trialData[row][col] === 1 ? 'ForestGreen' : 'white';
      gridContainer.appendChild(cell);
    }
  }
  return gridContainer;
}

// Attach mouse event listeners to grid cells that toggle the cell color
function attachListeners(trialData) {
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => {
    cell.addEventListener('click', function() {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const currentColor = cell.style.backgroundColor;
      if (currentColor === 'white') {
        cell.style.backgroundColor = 'ForestGreen';
        trialData[row][col] = 1;
      } else {
        cell.style.backgroundColor = 'white';
        trialData[row][col] = 0;
      }
    });
  });
}

// Create a single trial object from single row of grid data
function createTrial(trialData) {
  const gridHTML = createGridHTML(trialData);
  const originalTrialData = trialData.map(row => [...row]); // Copy 2D array to retain original grid

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: gridHTML.outerHTML,
    choices: ['Continue'],
    data: { 'originalTrialData': originalTrialData, additions: 0, subtractions: 0 },
    on_load: function() {
      attachListeners(trialData);
    },
    on_finish: function(data) {
      data.trialData = trialData; // Save the final, user-modified grid

      // Compare original and user-modified grid to calculate additions and subtractions
      for (let row = 0; row < trialData.length; row++) {
        for (let col = 0; col < trialData[0].length; col++) {
          const change = trialData[row][col] - data.originalTrialData[row][col];
          if (change > 0) {
            data.additions += 1;
          } else if (change < 0) {
            data.subtractions += 1;
          }
        }
      }
    }
  };
}

function setupAndRunExperiment(file) {
  Papa.parse(file, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      const data = results.data;
      const trials = data.map(row => JSON.parse(row.grid));
      
      // Shuffle the trials to randomize the order
      shuffleArray(trials);
      
      trials.forEach(trialData => {
        timeline.push(createTrial(trialData));
      });
      
      const survey = {
        type: jsPsychSurveyText,
        preamble: "Please answer the questions below",
        questions: [
          {prompt: 'How old are you?', name: "age"},
          {prompt: 'What country were you born in?', name: "country", required: true}
        ]
      };
      timeline.push(survey);

      const debrief_block = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: 'Thank you for participating in the experiment!',
        trial_duration: 5000
      };
      timeline.push(debrief_block);

      jsPsych.run(timeline);
    }
  });
}

// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

// Initialize jsPsych
const jsPsych = initJsPsych({
  on_finish: function() {
    // Download the data at the end of the experiment - should be removed for final version
    const csvData = jsPsych.data.get().csv();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'experiment_data.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    // Show data - should be removed for final version
    jsPsych.data.displayData();
  }
});

// Instructions block
const instructions = {
  type: jsPsychInstructions,
  pages: [
    '<div class="centered-text">' +
    '<img src="Figure_22.png" width="200"></img>' + 
    '<h1 class="instructions-page">Grid Symmetry Experiment</h1>' +
    'Welcome to the experiment!<br>' +
    'Please click the next button for the instructions.',

    '<div class="centered-text">' +
    'You will see a grid in the center of the screen: <br><img src="grid1.png" width="150"></img>' +
    '<div class="centered-text">' +
    'Click on the cells to add or subtract to the shape in the grid. Your goal is to make the shape symmetric.' +
    '<br><img src="grid2.png" width="150"></img>' +
    '<br>' +
    'Click next to begin the experiment.</div>'
  ],
  show_clickable_nav: true
};
timeline.push(instructions);

// Sample consent check function
const check_consent = function() {
  if (document.getElementById('consent_checkbox').checked) {
    return true;
  } else {
    alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this experiment.'");
    return false;
  }
};

// Add consent form trial
const consentTrial = {
  type: jsPsychExternalHtml,
  url: "Consent_form_2024_v2.html",
  cont_btn: "Next",
  check_fn: check_consent
};
timeline.unshift(consentTrial); // Ensure consent form appears before the rest of the experiment

// Start the experiment
setupAndRunExperiment('conditions_exp.csv');
