window.addEventListener('load', function() {
    // Define the grid size and other parameters
    let trials = [];
    let trialIndex = 0;
    const numTrials = trials.length;
    const timeline = [];
  
    // Function to create the grid
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
          cell.style.backgroundColor = trialData[row][col] === 1 ? 'black' : 'white';
          cell.addEventListener('click', function() {
            const currentColor = this.style.backgroundColor;
            if (currentColor === 'white') {
              this.style.backgroundColor = 'black';
              trialData[row][col] = 1; // Update the trial data to reflect the change
            } else {
              this.style.backgroundColor = 'white';
              trialData[row][col] = 0; // Update the trial data to reflect the change
            }
          });
          gridContainer.appendChild(cell);
        }
      }
      return gridContainer;
    }
  
    // Function to reattach event listeners
    function reattachListeners(trialData) {
      const cells = document.querySelectorAll('.grid-cell');
      cells.forEach(cell => {
        cell.addEventListener('click', function() {
          const row = parseInt(cell.dataset.row);
          const col = parseInt(cell.dataset.col);
          const currentColor = cell.style.backgroundColor;
          if (currentColor === 'white') {
            cell.style.backgroundColor = 'black';
            trialData[row][col] = 1; // Update the trial data to reflect the change
          } else {
            cell.style.backgroundColor = 'white';
            trialData[row][col] = 0; // Update the trial data to reflect the change
          }
        });
      });
    }
  
    function createTrial(trialData) {
      const gridHTML = createGridHTML(trialData);
      const originalTrialData = trialData.map(row => [...row]); // Copy 2D array to retain original grid
  
      return {
        type: jsPsychHtmlButtonResponse,
        stimulus: gridHTML.outerHTML,
        choices: ['Continue'],
        data: { 'originalTrialData': originalTrialData, additions: 0, subtractions: 0 },
        on_load: function() {
          reattachListeners(trialData);
        },
        on_finish: function(data){
            data.trialData = trialData; // Save the final, user-modified grid

            // Compare original and user-modified grid to calculate additions and subtractions
            for (let row = 0; row < trialData.length; row++) {
                for (let col = 0; col < trialData[0].length; col++) {
                    change = trialData[row][col] - data.originalTrialData[row][col];
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
        complete: function(results) {
          const data = results.data;
          trials = data.map(row => JSON.parse(row.grid));
          
          trials.forEach(trialData => {
            timeline.push(createTrial(trialData));
          });

          jsPsych.run(timeline);
        }
      });
    }
  
    const jsPsych = initJsPsych({
      on_finish: function() {
        jsPsych.data.displayData();
      }
    });
  
    setupAndRunExperiment('conditions.csv');
  });
