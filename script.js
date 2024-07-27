window.addEventListener('load', function() {
    const timeline = [];
  
    // Function to create the grid html elements from grid data
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
            cell.style.backgroundColor = 'black';
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
          skipEmptyLine: true,
          complete: function(results) {
            const data = results.data;
            const trials = data.map(row => JSON.parse(row.grid));
            
            trials.forEach(trialData => {
              timeline.push(createTrial(trialData));
            });

            /* finish connection with pavlovia.org */
            var pavlovia_finish = {
              type: "pavlovia",
              command: "finish"
            };
            timeline.push(pavlovia_finish);

            jsPsych.run(timeline);
  
          }
        });
      }
  
    jsPsych.init({
      on_finish: function() {
        jsPsych.data.displayData();
      }
    });

    /* init connection with pavlovia.org */
    var pavlovia_init = {
      type: "pavlovia",
      command: "init"
    };
    timeline.push(pavlovia_init);

    var instructions = {
        type: jsPsychInstructions,
        pages: [
        'Welcome to the experiment. Click next to begin.',
        'You will see a grid in the center of the screen: ' +
        '<br>' + 
        '<img src="grid1.png" width="150"></img>',
        'Click on the cells to add or subtract to the shape in the grid. Your goal is to make the shape symmetric.' +
        '<br>' +
        '<img src="grid2.png" width="150"></img>',
        'Click next to begin the experiment.'
        ],
        show_clickable_nav: true
    }
    timeline.push(instructions);
  
    setupAndRunExperiment('conditions.csv', timeline);
  });
