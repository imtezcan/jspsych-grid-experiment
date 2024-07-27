window.addEventListener('load', function() {
    // Define the grid size and other parameters
    const gridSize = 4; // Adjust to your grid size
    let trials = [];
    let trialIndex = 0;
    const numTrials = 3;
    const timeline = [];
  
    // Function to create the grid
    function createGrid(trialData) {
      const gridContainer = document.createElement('div');
      gridContainer.classList.add('grid-container');
      gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 50px)`; // Set the grid template columns dynamically
  
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cell = document.createElement('div');
          cell.classList.add('grid-cell');
          cell.dataset.row = row;
          cell.dataset.col = col;
          cell.style.backgroundColor = trialData[row][col] === 1 ? 'black' : 'white';
          cell.addEventListener('click', function() {
            const currentColor = this.style.backgroundColor;
            if (currentColor === 'white') {
              this.style.backgroundColor = 'black';
            } else {
              this.style.backgroundColor = 'white';
            }
          });
          gridContainer.appendChild(cell);
        }
      }
      return gridContainer;
    }
  
    // Function to create a trial
    function createTrial(trialData) {
      const grid = createGrid(trialData);
  
      return {
        type: jsPsychHtmlButtonResponse,
        stimulus: grid.outerHTML,
        choices: ['Continue'],
        on_finish: function(data) {
          trialIndex++;
          if (trialIndex < numTrials) {
            timeline.push(createTrial(trials[trialIndex]));
          } else {
            jsPsych.endExperiment('Thank you for participating!');
          }
        }
      };
    }
  
    // Function to load and parse the CSV file
    function loadCSV(file, callback) {
      Papa.parse(file, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
          const data = results.data;
          trials = data.map(row => JSON.parse(row.grid));
          callback();
        }
      });
    }
  
    // Initialize jsPsych
    const jsPsych = initJsPsych({
      on_finish: function() {
        jsPsych.data.displayData();
      }
    });
  
    // Load the CSV file and start the first trial
    loadCSV('conditions.csv', function() {
      // Add all trials to the timeline
      trials.forEach(trialData => {
        timeline.push(createTrial(trialData));
      });
  
      // Start the experiment
      jsPsych.run(timeline);
    });
  });
  