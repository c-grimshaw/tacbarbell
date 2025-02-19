<script>
  import { slide } from 'svelte/transition';
  
  const lifts = [
    { name: 'Squat', id: 'squat' },
    { name: 'Bench Press', id: 'bench' },
    { name: 'Deadlift', id: 'deadlift' },
    { name: 'Weighted Pullups', id: 'pullups' }
  ]
  
  // Runes for state management
  let maxes = $state({})
  let selectedLift = $state(null)
  let percentages = $state([65, 70, 75, 80, 85, 90])
  let useKilograms = $state(false)
  
  // Workout tracking state
  let workoutTemplates = $state([])
  let workoutHistory = $state([])
  let currentWorkout = $state(null)
  let editingTemplate = $state(null)
  let expandedTemplate = $state(null)
  let newExerciseSets = $state([{ percentage: 70, reps: 8 }])
  let selectedExerciseLift = $state(null)
  
  // Add new state variable for expanded history item
  let expandedHistoryWorkout = $state(null)
  
  // Unit conversion functions
  function kgToLbs(kg) {
    return kg * 2.20462
  }
  
  function lbsToKg(lbs) {
    return lbs / 2.20462
  }
  
  // Calculate weight for a given percentage
  function calculateWeight(max, percentage) {
    if (!max) return '-'
    const weight = (max * (percentage / 100))
    const rounded = Math.round(weight * 2) / 2 // Round to nearest 0.5
    return rounded
  }
  
  // Format weight with units
  function formatWeight(weight) {
    if (weight === '-') return '-'
    return `${weight}${useKilograms ? 'kg' : 'lbs'}`
  }
  
  // Load saved data on initialization
  function loadSavedData() {
    try {
      const savedTemplates = localStorage.getItem('workoutTemplates')
      if (savedTemplates) {
        workoutTemplates = JSON.parse(savedTemplates)
      }
      
      const savedHistory = localStorage.getItem('workoutHistory')
      if (savedHistory) {
        workoutHistory = JSON.parse(savedHistory)
      }
      
      const savedMaxes = localStorage.getItem('maxes')
      if (savedMaxes) {
        maxes = JSON.parse(savedMaxes)
      }
      
      // Only override the default if explicitly set in localStorage
      const savedUseKilograms = localStorage.getItem('useKilograms')
      if (savedUseKilograms !== null) {
        useKilograms = JSON.parse(savedUseKilograms)
      }
    } catch (error) {
      console.error('Error loading saved data:', error)
    }
  }
  
  // Save data to localStorage
  function saveData() {
    try {
      localStorage.setItem('workoutTemplates', JSON.stringify(workoutTemplates))
      localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory))
      localStorage.setItem('maxes', JSON.stringify(maxes))
      localStorage.setItem('useKilograms', JSON.stringify(useKilograms))
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }
  
  // Load saved data when the component mounts
  loadSavedData()
  
  // Handle max input
  function updateMax(liftId, value) {
    const numValue = parseFloat(value)
    maxes = { ...maxes, [liftId]: isNaN(numValue) ? 0 : numValue }
    saveData()
  }
  
  // Select a lift to view its percentages
  function selectLift(liftId) {
    selectedLift = liftId
  }
  
  // Toggle weight units
  function toggleUnits() {
    // Convert all existing maxes to the new unit
    const convertedMaxes = {}
    for (const [liftId, max] of Object.entries(maxes)) {
      convertedMaxes[liftId] = useKilograms ? 
        Math.round(kgToLbs(max) * 2) / 2 : 
        Math.round(lbsToKg(max) * 2) / 2
    }
    maxes = convertedMaxes
    useKilograms = !useKilograms
    saveData()
  }
  
  // Workout template structure
  function createWorkoutTemplate(name) {
    return {
      id: crypto.randomUUID(),
      name,
      exercises: []
    }
  }
  
  // Exercise set structure
  function createExerciseSet(liftId, percentage, reps) {
    return {
      id: crypto.randomUUID(),
      liftId,
      percentage,
      reps,
      completed: false,
      actualWeight: null,
      actualReps: null
    }
  }
  
  // Add a new workout template
  function addWorkoutTemplate(name) {
    if (!name) return
    workoutTemplates = [...workoutTemplates, createWorkoutTemplate(name)]
    saveData()
  }
  
  // Add exercise to template
  function addExerciseToTemplate(templateId) {
    if (!selectedExerciseLift || newExerciseSets.length === 0) return
    
    workoutTemplates = workoutTemplates.map(template => {
      if (template.id === templateId) {
        return {
          ...template,
          exercises: [...template.exercises, {
            id: crypto.randomUUID(),
            liftId: selectedExerciseLift,
            sets: newExerciseSets.map(({ percentage, reps }) => 
              createExerciseSet(selectedExerciseLift, percentage, reps)
            )
          }]
        }
      }
      return template
    })
    
    // Reset exercise creation state
    selectedExerciseLift = null
    newExerciseSets = [{ percentage: 70, reps: 5 }]
    saveData()
  }
  
  // Add a new set to the exercise being created
  function addSet() {
    newExerciseSets = [...newExerciseSets, { percentage: 70, reps: 5 }]
  }
  
  // Remove a set from the exercise being created
  function removeSet(index) {
    newExerciseSets = newExerciseSets.filter((_, i) => i !== index)
  }
  
  // Update set configuration
  function updateSet(index, field, value) {
    newExerciseSets = newExerciseSets.map((set, i) => 
      i === index ? { ...set, [field]: parseFloat(value) } : set
    )
  }
  
  // Start editing a template
  function editTemplate(templateId) {
    expandedTemplate = templateId
    editingTemplate = templateId
  }
  
  // Start a workout from template
  function startWorkout(templateId) {
    const template = workoutTemplates.find(t => t.id === templateId)
    if (!template) return
    
    currentWorkout = {
      id: crypto.randomUUID(),
      templateId,
      startTime: new Date(),
      exercises: template.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({ ...set, completed: false }))
      }))
    }
  }
  
  // Complete a set
  function completeSet(exerciseId, setId, { weight, reps }) {
    if (!currentWorkout) return
    
    currentWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => {
              if (set.id === setId) {
                return {
                  ...set,
                  completed: true,
                  actualWeight: weight,
                  actualReps: reps
                }
              }
              return set
            })
          }
        }
        return exercise
      })
    }
  }
  
  // Finish current workout
  function finishWorkout() {
    if (!currentWorkout) return
    
    workoutHistory = [...workoutHistory, {
      ...currentWorkout,
      endTime: new Date()
    }]
    currentWorkout = null
    saveData()
  }
  
  // Delete a workout template
  function deleteWorkoutTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this workout template?')) return
    workoutTemplates = workoutTemplates.filter(t => t.id !== templateId)
    if (editingTemplate === templateId) {
      editingTemplate = null
    }
    saveData()
  }
  
  // Delete a workout from history
  function deleteWorkoutHistory(workoutId) {
    if (!confirm('Are you sure you want to delete this workout from your history?')) return
    workoutHistory = workoutHistory.filter(w => w.id !== workoutId)
    saveData()
  }
  
  // Toggle template expansion
  function toggleTemplate(templateId) {
    if (expandedTemplate === templateId) {
      expandedTemplate = null;
      editingTemplate = null;
    } else {
      expandedTemplate = templateId;
    }
  }
  
  // Add toggle function for history expansion
  function toggleHistoryWorkout(workoutId) {
    expandedHistoryWorkout = expandedHistoryWorkout === workoutId ? null : workoutId
  }
</script>

<main>
  <h1>Tactical Barbell</h1>
  
  <div class="unit-toggle">
    <div class="toggle-container">
      <button 
        class="unit-button {useKilograms ? 'active' : ''}" 
        onclick={toggleUnits}
      >
        kg
      </button>
      <button 
        class="unit-button {!useKilograms ? 'active' : ''}"
        onclick={toggleUnits}
      >
        lbs
      </button>
    </div>
  </div>
  
  <div class="grid">
    <!-- 1RM Input Section -->
    <section class="card">
      <h2>Your One Rep Maxes</h2>
      <div class="input-list">
        {#each lifts as lift}
          <div class="input-group">
            <label for={lift.id}>{lift.name}:</label>
            <input
              type="number"
              id={lift.id}
              placeholder="Enter weight"
              value={maxes[lift.id] || ''}
              oninput={(e) => updateMax(lift.id, e.target.value)}
              min="0"
              step="2.5"
            />
            <span class="unit-label">{useKilograms ? 'kg' : 'lbs'}</span>
            <button
              class="view-button"
              onclick={() => selectLift(lift.id)}
            >
              View
            </button>
          </div>
        {/each}
      </div>
    </section>
    
    <!-- Percentage Calculator Section -->
    <section class="card">
      <h2>Percentage Calculator</h2>
      {#if selectedLift}
        {@const lift = lifts.find(l => l.id === selectedLift)}
        {@const max = maxes[selectedLift]}
        <h3>{lift.name} - {formatWeight(max || 0)} 1RM</h3>
        <div class="percentages-grid">
          {#each percentages as percentage}
            <div class="percentage-card">
              <div class="percentage">{percentage}%</div>
              <div class="weight">
                {formatWeight(calculateWeight(max, percentage))}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">
          Select a lift to view percentage breakdowns
        </p>
      {/if}
    </section>
    
    <!-- Workout Section -->
    <section class="card workout-section">
      <h2>Workouts</h2>
      
      {#if !currentWorkout}
        <!-- Template List -->
        <div class="templates">
          <h3>Workout Templates</h3>
          <div class="template-list">
            {#each workoutTemplates as template}
              <div class="template-card">
                <div class="template-header" onclick={() => toggleTemplate(template.id)}>
                  <div class="template-title">
                    <button 
                      class="expand-button"
                      onclick={(e) => {
                        e.stopPropagation();
                        toggleTemplate(template.id);
                      }}
                    >
                      {expandedTemplate === template.id ? '−' : '+'}
                    </button>
                    <h4>{template.name}</h4>
                    <div class="exercise-count">
                      {template.exercises.length} exercise{template.exercises.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div class="template-actions" onclick={(e) => e.stopPropagation()}>
                    <button 
                      class="delete-button"
                      onclick={() => deleteWorkoutTemplate(template.id)}
                    >
                      Delete
                    </button>
                    <button 
                      class="edit-button"
                      onclick={() => editTemplate(template.id)}
                    >
                      Edit
                    </button>
                    <button 
                      class="start-button"
                      onclick={() => startWorkout(template.id)}
                    >
                      Start
                    </button>
                  </div>
                </div>
                
                {#if expandedTemplate === template.id}
                  <div class="template-content" transition:slide>
                    {#if template.exercises.length > 0}
                      <div class="template-exercises no-edit">
                        <h5>Exercises</h5>
                        {#each template.exercises as exercise}
                          {@const lift = lifts.find(l => l.id === exercise.liftId)}
                          <div class="template-exercise">
                            <h6>{lift?.name}</h6>
                            <div class="template-sets">
                              {#each exercise.sets as set}
                                <div class="template-set">
                                  {set.percentage}% × {set.reps} reps
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p class="empty-state">No exercises added yet</p>
                    {/if}
                    
                    {#if editingTemplate === template.id}
                      <div class="exercise-editor" transition:slide>
                        <div class="editor-section">
                          <h5>Add Exercise</h5>
                          <div class="exercise-form">
                            <div class="form-group">
                              <label for="lift-select">Select Exercise:</label>
                              <select 
                                id="lift-select"
                                bind:value={selectedExerciseLift}
                                class="lift-select"
                              >
                                <option value={null}>Choose a lift</option>
                                {#each lifts as lift}
                                  <option value={lift.id}>{lift.name}</option>
                                {/each}
                              </select>
                            </div>
                            
                            <div class="sets-editor">
                              <h6>Sets</h6>
                              <div class="sets-list">
                                {#each newExerciseSets as set, index}
                                  <div class="set-editor">
                                    <div class="set-inputs">
                                      <div class="input-with-label">
                                        <input
                                          type="number"
                                          placeholder="Percentage"
                                          value={set.percentage}
                                          min="1"
                                          max="100"
                                          oninput={(e) => updateSet(index, 'percentage', e.target.value)}
                                        />
                                        <span class="input-label">%</span>
                                      </div>
                                      <span class="multiply">×</span>
                                      <div class="input-with-label">
                                        <input
                                          type="number"
                                          placeholder="Reps"
                                          value={set.reps}
                                          min="1"
                                          oninput={(e) => updateSet(index, 'reps', e.target.value)}
                                        />
                                        <span class="input-label">reps</span>
                                      </div>
                                      <button
                                        class="remove-set-button"
                                        onclick={() => removeSet(index)}
                                        title="Remove set"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                {/each}
                              </div>
                              
                              <div class="editor-actions">
                                <button
                                  class="add-set-button"
                                  onclick={addSet}
                                >
                                  + Add Set
                                </button>
                                
                                <button
                                  class="add-exercise-button"
                                  onclick={() => addExerciseToTemplate(template.id)}
                                  disabled={!selectedExerciseLift}
                                >
                                  Add Exercise
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
            
            <button 
              class="add-template-button"
              onclick={() => addWorkoutTemplate(prompt('Enter template name:'))}
            >
              + New Template
            </button>
          </div>
        </div>
        
        <!-- Workout History -->
        <div class="history">
          <h3>Recent Workouts</h3>
          <div class="history-list">
            {#each workoutHistory.slice(-5) as workout}
              {@const template = workoutTemplates.find(t => t.id === workout.templateId)}
              <div class="history-card">
                <div class="history-header" onclick={() => toggleHistoryWorkout(workout.id)}>
                  <div class="history-content">
                    <h4>{template?.name}</h4>
                    <p>
                      {new Date(workout.startTime).toLocaleDateString()} • 
                      {workout.exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).length, 0)} sets completed
                    </p>
                  </div>
                  <div class="history-actions" onclick={(e) => e.stopPropagation()}>
                    <button 
                      class="expand-button"
                      onclick={() => toggleHistoryWorkout(workout.id)}
                    >
                      {expandedHistoryWorkout === workout.id ? '−' : '+'}
                    </button>
                    <button
                      class="delete-button"
                      onclick={() => deleteWorkoutHistory(workout.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {#if expandedHistoryWorkout === workout.id}
                  <div class="history-details" transition:slide>
                    <div class="workout-summary">
                      <div class="summary-item">
                        <span class="summary-label">Started:</span>
                        <span class="summary-value">{new Date(workout.startTime).toLocaleTimeString()}</span>
                      </div>
                      <div class="summary-item">
                        <span class="summary-label">Finished:</span>
                        <span class="summary-value">{new Date(workout.endTime).toLocaleTimeString()}</span>
                      </div>
                      <div class="summary-item">
                        <span class="summary-label">Duration:</span>
                        <span class="summary-value">
                          {Math.round((new Date(workout.endTime) - new Date(workout.startTime)) / 60000)} minutes
                        </span>
                      </div>
                    </div>
                    
                    <div class="history-exercises">
                      {#each workout.exercises as exercise}
                        {@const lift = lifts.find(l => l.id === exercise.liftId)}
                        <div class="history-exercise">
                          <h5>{lift?.name}</h5>
                          <div class="history-sets">
                            {#each exercise.sets as set}
                              <div class="history-set">
                                <div class="set-details">
                                  <div class="set-planned">
                                    Planned: {set.percentage}% × {set.reps}
                                  </div>
                                  {#if set.completed}
                                    <div class="set-completed">
                                      Completed: {formatWeight(set.actualWeight)} × {set.actualReps}
                                    </div>
                                  {:else}
                                    <div class="set-skipped">Set skipped</div>
                                  {/if}
                                </div>
                              </div>
                            {/each}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <!-- Active Workout -->
        {@const template = workoutTemplates.find(t => t.id === currentWorkout.templateId)}
        <div class="active-workout">
          <h3>Current Workout: {template?.name}</h3>
          
          {#each currentWorkout.exercises as exercise}
            {@const lift = lifts.find(l => l.id === exercise.liftId)}
            <div class="exercise-card">
              <h4>{lift?.name}</h4>
              <div class="sets-grid">
                {#each exercise.sets as set}
                  {@const weight = calculateWeight(maxes[exercise.liftId], set.percentage)}
                  <div class="set-card {set.completed ? 'completed' : ''}">
                    <div class="set-target">
                      {formatWeight(weight)} × {set.reps}
                    </div>
                    {#if !set.completed}
                      <button
                        class="complete-set-button"
                        onclick={() => {
                          const actualReps = parseInt(prompt(`Actual reps completed (target: ${set.reps}):`) || '0')
                          const actualWeight = parseFloat(prompt(`Actual weight used (target: ${weight}):`) || '0')
                          completeSet(exercise.id, set.id, {
                            weight: actualWeight,
                            reps: actualReps
                          })
                        }}
                      >
                        Complete
                      </button>
                    {:else}
                      <div class="set-actual">
                        Completed: {formatWeight(set.actualWeight)} × {set.actualReps}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/each}
          
          <button 
            class="finish-button"
            onclick={finishWorkout}
          >
            Finish Workout
          </button>
        </div>
      {/if}
    </section>
  </div>
</main>

<style>
  :global(body) {
    background-color: #f5f5f5;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 0.5rem;
  }
  
  @media (max-width: 480px) {
    main {
      padding: 0.5rem;
    }
    
    h1 {
      font-size: 1.75rem !important;
      margin-bottom: 1rem !important;
    }
    
    h2 {
      font-size: 1.25rem !important;
    }
    
    h3 {
      font-size: 1.1rem !important;
    }
  }
  
  h1 {
    font-size: 2.5rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2rem;
    color: #1a1a1a;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #2a2a2a;
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #2a2a2a;
  }
  
  .grid {
    display: grid;
    gap: 2rem;
  }
  
  @media (min-width: 768px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  .card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .input-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  @media (max-width: 480px) {
    .input-group {
      flex-direction: column;
      align-items: stretch;
      gap: 0.25rem;
    }
    
    .input-group label {
      min-width: auto;
    }
    
    .input-group input {
      width: 100%;
    }
    
    .view-button {
      width: 100%;
      margin-top: 0.25rem;
    }
  }
  
  label {
    min-width: 120px;
    font-weight: 500;
  }
  
  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    text-align: right;
  }
  
  input:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74,144,226,0.2);
  }
  
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
  }
  
  .view-button {
    padding: 0.5rem 1rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .view-button:hover {
    background: #357abd;
  }
  
  .percentages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    .percentage-card {
      padding: 0.75rem;
    }
    
    .percentage {
      font-size: 1rem;
    }
    
    .weight {
      font-size: 1.25rem;
    }
  }
  
  .percentage-card {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    text-align: center;
  }
  
  .percentage {
    font-size: 1.125rem;
    font-weight: 500;
    color: #666;
  }
  
  .weight {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4a90e2;
    margin-top: 0.25rem;
  }
  
  .empty-state {
    text-align: center;
    color: #666;
    padding: 2rem 0;
  }
  
  .workout-section {
    grid-column: 1 / -1;
  }
  
  .template-list,
  .history-list {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .template-card,
  .history-card {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
  }
  
  .history-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .history-content {
    flex: 1;
  }
  
  .history-content h4 {
    margin: 0;
    color: #2a2a2a;
  }
  
  .history-content p {
    margin: 0.25rem 0 0;
    color: #666;
    font-size: 0.875rem;
  }
  
  .delete-button {
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .delete-button:hover {
    background: #c82333;
  }
  
  .start-button,
  .complete-set-button,
  .finish-button {
    padding: 0.5rem 1rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .start-button:hover,
  .complete-set-button:hover,
  .finish-button:hover {
    background: #357abd;
  }
  
  .add-template-button {
    padding: 1rem;
    border: 2px dashed #ddd;
    border-radius: 0.25rem;
    background: none;
    cursor: pointer;
    color: #666;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .add-template-button:hover {
    border-color: #4a90e2;
    color: #4a90e2;
  }
  
  .exercise-card {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    margin: 1rem 0;
  }
  
  .sets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    .set-card {
      padding: 0.75rem;
    }
    
    .set-target {
      font-size: 1.1rem;
    }
    
    .complete-set-button,
    .finish-button {
      padding: 0.75rem;
      width: 100%;
    }
  }
  
  .set-card {
    background: white;
    padding: 1rem;
    border-radius: 0.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .set-card.completed {
    background: #e8f5e9;
  }
  
  .set-target {
    font-size: 1.25rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .set-actual {
    font-size: 0.875rem;
    color: #2e7d32;
  }
  
  .finish-button {
    display: block;
    width: 100%;
    margin-top: 2rem;
    padding: 1rem;
    background: #2e7d32;
  }
  
  .finish-button:hover {
    background: #1b5e20;
  }
  
  .history {
    margin-top: 2rem;
  }
  
  .template-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 0.75rem;
    margin: -0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    .template-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .template-title {
      width: 100%;
    }
    
    .template-actions {
      width: 100%;
      justify-content: stretch;
    }
    
    .template-actions button {
      flex: 1;
      padding: 0.75rem;
    }
    
    .set-inputs {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .input-with-label {
      width: 100%;
    }
    
    .input-with-label input {
      width: 100%;
    }
    
    .multiply {
      align-self: center;
      padding: 0.25rem;
    }
    
    .remove-set-button {
      align-self: center;
    }
  }
  
  .template-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .expand-button {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: #666;
    font-size: 1.25rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    transition: transform 0.2s;
  }
  
  .template-content {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
  }
  
  .template-exercises.no-edit {
    margin-top: 0;
  }
  
  .template-exercises {
    margin-top: 1.5rem;
  }
  
  .template-exercise {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    margin-top: 0.5rem;
  }
  
  .template-sets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .template-set {
    background: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  h5 {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
    color: #2a2a2a;
  }
  
  h6 {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    color: #2a2a2a;
  }
  
  .unit-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 480px) {
    .toggle-container {
      width: 100%;
      max-width: 300px;
    }
    
    .unit-button {
      flex: 1;
      padding: 0.75rem 1rem;
    }
  }
  
  .toggle-container {
    background: #f0f0f0;
    padding: 0.25rem;
    border-radius: 2rem;
    display: flex;
    gap: 0.25rem;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .unit-button {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 1.5rem;
    background: transparent;
    color: #666;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .unit-button:hover:not(.active) {
    color: #4a90e2;
    background: rgba(74,144,226,0.1);
  }
  
  .unit-button.active {
    background: white;
    color: #4a90e2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .exercise-count {
    color: #666;
    font-size: 0.875rem;
    font-weight: normal;
  }
  
  .template-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .edit-button {
    padding: 0.5rem 1rem;
    background: #666;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .edit-button:hover {
    background: #555;
  }
  
  .exercise-editor {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #ddd;
  }
  
  .editor-section {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  @media (max-width: 480px) {
    .editor-section {
      padding: 0.75rem;
    }
    
    .editor-actions {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .add-set-button,
    .add-exercise-button {
      width: 100%;
      margin: 0;
    }
  }
  
  .exercise-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group label {
    color: #666;
    font-size: 0.875rem;
  }
  
  .lift-select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    color: #2a2a2a;
    background: #f8f9fa;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .lift-select:hover {
    border-color: #4a90e2;
  }
  
  .lift-select:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74,144,226,0.2);
  }
  
  .sets-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .sets-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .set-editor {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }
  
  .set-editor:hover {
    background: #f0f0f0;
  }
  
  .set-inputs {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .input-with-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #ddd;
  }
  
  .input-with-label input {
    width: 80px;
    border: none;
    padding: 0;
    margin: 0;
    text-align: right;
  }
  
  .input-with-label input:focus {
    outline: none;
    box-shadow: none;
  }
  
  .input-label {
    color: #666;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .multiply {
    color: #666;
    font-weight: 500;
  }
  
  .remove-set-button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.25rem;
    padding: 0;
    line-height: 1;
    transition: all 0.2s;
  }
  
  .remove-set-button:hover {
    background: #c82333;
    transform: scale(1.1);
  }
  
  .editor-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .add-set-button {
    padding: 0.75rem 1.25rem;
    background: none;
    border: 2px dashed #4a90e2;
    border-radius: 0.25rem;
    color: #4a90e2;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .add-set-button:hover {
    background: rgba(74,144,226,0.1);
  }
  
  .add-exercise-button {
    padding: 0.75rem 1.25rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    margin-left: auto;
  }
  
  .add-exercise-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .add-exercise-button:not(:disabled):hover {
    background: #357abd;
  }
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 0.75rem;
    margin: -0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    .history-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .history-content {
      width: 100%;
    }
    
    .history-actions {
      width: 100%;
      justify-content: stretch;
      gap: 0.5rem;
    }
    
    .history-actions button {
      flex: 1;
      padding: 0.75rem;
    }
    
    .workout-summary {
      grid-template-columns: 1fr;
    }
    
    .history-sets {
      grid-template-columns: 1fr;
    }
  }
  
  .history-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
  }
  
  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .summary-label {
    font-size: 0.875rem;
    color: #666;
  }
  
  .summary-value {
    font-weight: 500;
    color: #2a2a2a;
  }
  
  .history-exercises {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .history-exercise {
    background: white;
    padding: 1rem;
    border-radius: 0.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .history-sets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  
  .history-set {
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 0.25rem;
  }
  
  .set-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .set-planned {
    font-size: 0.875rem;
    color: #666;
  }
  
  .set-completed {
    font-weight: 500;
    color: #2e7d32;
  }
  
  .set-skipped {
    font-weight: 500;
    color: #dc3545;
  }
</style>
