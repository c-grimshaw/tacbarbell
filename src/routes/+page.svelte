<script>
  import { slide } from 'svelte/transition';
  import { darkMode, toggleTheme } from '$lib/stores/theme';
  import { Moon, Sun, Eye, Trash2, Edit, Play, Plus, X, Copy, Save, CheckCircle2 } from 'lucide-svelte';
  import RecentWorkout from '$lib/components/RecentWorkout.svelte';
  
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
  let expandedExercises = $state(new Set())
  let newExerciseSets = $state([{ percentage: 70, reps: 8 }])
  let selectedExerciseLift = $state(null)
  
  // Add toggle function for history expansion
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
  
  // Duplicate a set
  function duplicateSet(index) {
    const setToDuplicate = newExerciseSets[index]
    newExerciseSets = [
      ...newExerciseSets.slice(0, index + 1),
      { ...setToDuplicate },
      ...newExerciseSets.slice(index + 1)
    ]
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
    if (editingTemplate === templateId) {
      // If already editing, toggle it off
      editingTemplate = null;
    } else {
      // Start editing and ensure template is expanded
      expandedTemplate = templateId;
      editingTemplate = templateId;
    }
  }
  
  // Update existing set in a template
  function updateExistingSet(templateId, exerciseId, setId, field, value) {
    workoutTemplates = workoutTemplates.map(template => {
      if (template.id === templateId) {
        return {
          ...template,
          exercises: template.exercises.map(exercise => {
            if (exercise.id === exerciseId) {
              return {
                ...exercise,
                sets: exercise.sets.map(set => {
                  if (set.id === setId) {
                    return { ...set, [field]: parseFloat(value) };
                  }
                  return set;
                })
              };
            }
            return exercise;
          })
        };
      }
      return template;
    });
    saveData();
  }
  
  // Remove an existing set from a template exercise
  function removeExistingSet(templateId, exerciseId, setId) {
    workoutTemplates = workoutTemplates.map(template => {
      if (template.id === templateId) {
        return {
          ...template,
          exercises: template.exercises
            .map(exercise => {
              if (exercise.id === exerciseId) {
                const remainingSets = exercise.sets.filter(set => set.id !== setId);
                // If no sets remain, return null to filter out the exercise
                return remainingSets.length === 0 ? null : {
                  ...exercise,
                  sets: remainingSets
                };
              }
              return exercise;
            })
            .filter(exercise => exercise !== null) // Remove exercises with no sets
        };
      }
      return template;
    });
    saveData();
  }
  
  // Duplicate an existing set in a template exercise
  function duplicateExistingSet(templateId, exerciseId, setId) {
    workoutTemplates = workoutTemplates.map(template => {
      if (template.id === templateId) {
        return {
          ...template,
          exercises: template.exercises.map(exercise => {
            if (exercise.id === exerciseId) {
              const setToDuplicate = exercise.sets.find(set => set.id === setId);
              if (setToDuplicate) {
                const newSet = createExerciseSet(
                  exercise.liftId,
                  setToDuplicate.percentage,
                  setToDuplicate.reps
                );
                const setIndex = exercise.sets.findIndex(set => set.id === setId);
                return {
                  ...exercise,
                  sets: [
                    ...exercise.sets.slice(0, setIndex + 1),
                    newSet,
                    ...exercise.sets.slice(setIndex + 1)
                  ]
                };
              }
            }
            return exercise;
          })
        };
      }
      return template;
    });
    saveData();
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
  
  // Add a new set to an exercise during a workout
  function addSetToWorkout(exerciseId) {
    if (!currentWorkout) return
    
    const exercise = currentWorkout.exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    
    // Copy the percentage and reps from the last set, or use defaults
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const newSet = createExerciseSet(
      exercise.liftId,
      lastSet ? lastSet.percentage : 70,
      lastSet ? lastSet.reps : 5
    )
    
    currentWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: [...exercise.sets, newSet]
          }
        }
        return exercise
      })
    }
  }
  
  // Remove a set from an exercise during a workout
  function removeSetFromWorkout(exerciseId, setId) {
    if (!currentWorkout) return
    
    currentWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== setId)
          }
        }
        return exercise
      })
    }
  }
  
  // Update template name
  function updateTemplateName(templateId, newName) {
    // Check if name is already taken
    const existingTemplate = workoutTemplates.find(t => t.name.toLowerCase() === newName.toLowerCase() && t.id !== templateId)
    if (existingTemplate) {
      alert('A template with this name already exists. Please choose a different name.')
      return false
    }
    
    workoutTemplates = workoutTemplates.map(template => {
      if (template.id === templateId) {
        return { ...template, name: newName }
      }
      return template
    })
    saveData()
    return true
  }
  
  // Duplicate a template
  function duplicateTemplate(templateId) {
    const template = workoutTemplates.find(t => t.id === templateId)
    if (!template) return
    
    // Generate a unique name
    let newName = `${template.name} (Copy)`
    let counter = 1
    while (workoutTemplates.some(t => t.name === newName)) {
      counter++
      newName = `${template.name} (Copy ${counter})`
    }
    
    const newTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: newName,
      exercises: template.exercises.map(exercise => ({
        ...exercise,
        id: crypto.randomUUID(),
        sets: exercise.sets.map(set => ({
          ...set,
          id: crypto.randomUUID()
        }))
      }))
    }
    
    workoutTemplates = [...workoutTemplates, newTemplate]
    saveData()
  }
  
  // Toggle exercise expansion
  function toggleExercise(exerciseId) {
    if (expandedExercises.has(exerciseId)) {
      expandedExercises.delete(exerciseId)
    } else {
      expandedExercises.add(exerciseId)
    }
    expandedExercises = new Set(expandedExercises) // Trigger reactivity
  }
</script>

<main class:dark={$darkMode}>
  <button 
    class="theme-toggle" 
    onclick={toggleTheme}
    title={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {#if $darkMode}
      <Sun size={24} strokeWidth={2} />
    {:else}
      <Moon size={24} strokeWidth={2} />
    {/if}
  </button>
  
  <div class="logo-container">
    <img 
      src="http://www.tacticalbarbell.com/wp-content/uploads/2016/10/logo_1.png" 
      alt="Tactical Barbell Logo"
      class="logo"
    />
  </div>
  
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
      <h2>One Rep Maxes</h2>
      <div class="input-list">
        {#each lifts as lift}
          <div class="input-group">
            <label for={lift.id}>{lift.name}</label>
            <div class="input-row">
              <div class="input-container">
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
              </div>
              <button
                class="view-button"
                onclick={() => selectLift(lift.id)}
                title="View percentages"
              >
                <Eye size={20} strokeWidth={2} />
              </button>
            </div>
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
                    {#if editingTemplate === template.id}
                      <input
                        type="text"
                        class="template-name-input"
                        value={template.name}
                        onclick={(e) => e.stopPropagation()}
                        onblur={(e) => {
                          if (e.target.value.trim() !== template.name) {
                            updateTemplateName(template.id, e.target.value.trim())
                          }
                        }}
                        onkeydown={(e) => {
                          if (e.key === 'Enter') {
                            e.target.blur()
                          }
                          e.stopPropagation()
                        }}
                      />
                    {:else}
                      <h4>{template.name}</h4>
                    {/if}
                    <div class="exercise-count">
                      {template.exercises.length} exercise{template.exercises.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div class="template-actions" onclick={(e) => e.stopPropagation()}>
                    <div class="template-actions-row">
                      <button 
                        class="duplicate-button"
                        onclick={() => duplicateTemplate(template.id)}
                        title="Duplicate template"
                      >
                        <Copy size={20} strokeWidth={2} />
                      </button>
                      <button 
                        class="delete-button"
                        onclick={() => deleteWorkoutTemplate(template.id)}
                        title="Delete template"
                      >
                        <Trash2 size={20} strokeWidth={2} />
                      </button>
                      <button 
                        class="edit-button"
                        onclick={() => editTemplate(template.id)}
                        title="Edit template"
                      >
                        <Edit size={20} strokeWidth={2} />
                      </button>
                    </div>
                    <button 
                      class="start-button"
                      onclick={() => startWorkout(template.id)}
                      title="Start workout"
                    >
                      <Play size={20} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                
                {#if expandedTemplate === template.id}
                  <div class="template-content" transition:slide>
                    {#if template.exercises.length > 0}
                      <div class="template-exercises">
                        <h5>Exercises</h5>
                        {#each template.exercises as exercise}
                          {@const lift = lifts.find(l => l.id === exercise.liftId)}
                          <div class="template-exercise">
                            <div class="exercise-header" onclick={() => toggleExercise(exercise.id)}>
                              <div class="exercise-title">
                                <h6>{lift?.name}</h6>
                                <div class="set-count">
                                  {exercise.sets.length} set{exercise.sets.length === 1 ? '' : 's'}
                                </div>
                              </div>
                              <button 
                                class="expand-button"
                                onclick={(e) => {
                                  e.stopPropagation()
                                  toggleExercise(exercise.id)
                                }}
                              >
                                {expandedExercises.has(exercise.id) ? '−' : '+'}
                              </button>
                            </div>
                            {#if expandedExercises.has(exercise.id)}
                              <div class="template-sets" transition:slide>
                                {#each exercise.sets as set, setIndex}
                                  {#if editingTemplate === template.id}
                                    <div class="set-editor">
                                      <div class="set-number">Set {setIndex + 1}</div>
                                      <div class="set-content">
                                        <div class="set-inputs">
                                          <div class="input-with-label">
                                            <input
                                              type="number"
                                              placeholder="Percentage"
                                              value={set.percentage}
                                              min="1"
                                              max="100"
                                              oninput={(e) => updateExistingSet(template.id, exercise.id, set.id, 'percentage', e.target.value)}
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
                                              oninput={(e) => updateExistingSet(template.id, exercise.id, set.id, 'reps', e.target.value)}
                                            />
                                            <span class="input-label">reps</span>
                                          </div>
                                        </div>
                                        <div class="set-actions">
                                          <button
                                            class="duplicate-set-button"
                                            onclick={() => duplicateExistingSet(template.id, exercise.id, set.id)}
                                            title="Duplicate set"
                                          >
                                            <Copy size={18} strokeWidth={2} />
                                          </button>
                                          <button
                                            class="remove-set-button"
                                            onclick={() => removeExistingSet(template.id, exercise.id, set.id)}
                                            title="Remove set"
                                          >
                                            <X size={18} strokeWidth={2} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  {:else}
                                    <div class="template-set">
                                      {set.percentage}% × {set.reps} reps
                                    </div>
                                  {/if}
                                {/each}
                              </div>
                            {/if}
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
                                    <div class="set-number">Set {index + 1}</div>
                                    <div class="set-content">
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
                                      </div>
                                      <div class="set-actions">
                                        <button
                                          class="duplicate-set-button"
                                          onclick={() => duplicateSet(index)}
                                          title="Duplicate set"
                                        >
                                          <Copy size={18} strokeWidth={2} />
                                        </button>
                                        <button
                                          class="remove-set-button"
                                          onclick={() => removeSet(index)}
                                          title="Remove set"
                                        >
                                          <X size={18} strokeWidth={2} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                {/each}
                              </div>
                              
                              <div class="editor-actions">
                                <button
                                  class="add-set-button"
                                  onclick={addSet}
                                  title="Add set"
                                >
                                  <Plus size={24} strokeWidth={2} />
                                </button>
                                
                                <button
                                  class="add-exercise-button"
                                  onclick={() => addExerciseToTemplate(template.id)}
                                  disabled={!selectedExerciseLift}
                                  title="Add exercise"
                                >
                                  <Save size={20} strokeWidth={2} />
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
              <Plus size={24} strokeWidth={2} />
            </button>
          </div>
        </div>
        
        <!-- Workout History -->
        <div class="history">
          <h3>Recent Workouts</h3>
          <div class="history-list">
            {#each workoutHistory.slice(-5) as workout}
              {@const template = workoutTemplates.find(t => t.id === workout.templateId)}
              <RecentWorkout
                {workout}
                {template}
                {useKilograms}
                isExpanded={expandedHistoryWorkout === workout.id}
                onToggle={() => toggleHistoryWorkout(workout.id)}
                onDelete={() => deleteWorkoutHistory(workout.id)}
              />
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
              <div class="exercise-header">
                <h4>{lift?.name}</h4>
              </div>
              <div class="sets-list">
                {#each exercise.sets as set, index}
                  {@const weight = calculateWeight(maxes[exercise.liftId], set.percentage)}
                  <div class="set-row {set.completed ? 'completed' : ''}">
                    <div class="set-number">{index + 1}</div>
                    <div class="set-target">
                      {formatWeight(weight)} × {set.reps}
                    </div>
                    {#if !set.completed}
                      <div class="set-actions">
                        <button
                          class="complete-set-button"
                          onclick={() => completeSet(exercise.id, set.id, {
                            weight,
                            reps: set.reps
                          })}
                        >
                          Complete
                        </button>
                        <button
                          class="remove-set-button"
                          onclick={() => removeSetFromWorkout(exercise.id, set.id)}
                          title="Remove set"
                        >
                          <X size={18} strokeWidth={2} />
                        </button>
                      </div>
                    {:else}
                      <div class="set-actual">
                        {formatWeight(set.actualWeight)} × {set.actualReps}
                      </div>
                      <button
                        class="edit-set-button"
                        onclick={() => {
                          const actualReps = parseInt(prompt(`Actual reps completed (current: ${set.actualReps}):`) || '0')
                          const actualWeight = parseFloat(prompt(`Actual weight used (current: ${set.actualWeight}):`) || '0')
                          completeSet(exercise.id, set.id, {
                            weight: actualWeight,
                            reps: actualReps
                          })
                        }}
                      >
                        <Edit size={18} />
                      </button>
                    {/if}
                  </div>
                {/each}
                <button
                  class="add-set-button"
                  onclick={() => addSetToWorkout(exercise.id)}
                  title="Add set"
                >
                  <Plus size={20} strokeWidth={2} />
                </button>
              </div>
            </div>
          {/each}
          
          <div class="workout-actions">
            <button 
              class="cancel-button"
              onclick={() => {
                if (confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
                  currentWorkout = null;
                }
              }}
              title="Cancel workout"
            >
              <X size={24} strokeWidth={2} />
            </button>
            <button 
              class="finish-button"
              onclick={finishWorkout}
              title="Finish workout"
            >
              <CheckCircle2 size={24} strokeWidth={2} />
            </button>
          </div>
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
    transition: background-color 0.3s ease;
  }
  
  :global(body.dark) {
    background-color: #000000;
  }
  
  main.dark {
    color: #e5e5e5;
    background-color: #000000;
  }
  
  main.dark .card {
    background: #1a1a1a;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark .exercise-card {
    background: #1a1a1a;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark .set-card {
    background: #262626;
    color: #e5e5e5;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark .set-card.completed {
    background: #064e3b;
    color: #e5e5e5;
  }
  
  main.dark .set-target {
    color: #e5e5e5;
  }
  
  main.dark .set-actual {
    color: #4ade80;
  }
  
  main.dark .template-card,
  main.dark .set-editor {
    background: #1a1a1a;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark .template-exercise {
    background: #262626;
  }
  
  main.dark .template-set {
    background: #333333;
    color: #e5e5e5;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark h1,
  main.dark h2,
  main.dark h3,
  main.dark h4,
  main.dark h5,
  main.dark h6 {
    color: #f3f4f6;
  }
  
  main.dark .input-group input {
    background: #333;
    border-color: #404040;
    color: #e5e5e5;
  }
  
  main.dark .input-group input::placeholder {
    color: #666;
  }
  
  main.dark .input-label,
  main.dark .multiply {
    color: #999;
  }
  
  main.dark .set-number {
    font-size: 0.875rem;
    font-weight: 600;
    color: #666;
    min-width: 3rem;
    text-align: center;
  }
  
  .dark .set-number {
    color: #94a3b8;
  }
  
  .set-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .view-button, .edit-button, .delete-button, .start-button, 
  .add-template-button, .add-set-button, .add-exercise-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    min-height: 36px;
    padding: 8px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 1;
  }

  .view-button:hover, .edit-button:hover, .delete-button:hover, 
  .start-button:hover, .add-exercise-button:hover {
    transform: scale(1.1);
  }

  .view-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    min-height: 36px;
    padding: 8px;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(74,144,226,0.2);
  }

  .view-button:hover {
    background: #357abd;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(74,144,226,0.3);
  }

  .delete-button {
    background: #fee2e2;
    color: #dc2626;
  }

  .delete-button:hover {
    background: #fecaca;
  }

  .edit-button {
    background: #f3f4f6;
    color: #4b5563;
  }

  .edit-button:hover {
    background: #e5e7eb;
  }

  .start-button {
    background: #10b981;
    color: white;
    box-shadow: 0 2px 4px rgba(16,185,129,0.2);
  }

  .start-button:hover {
    background: #059669;
    box-shadow: 0 4px 8px rgba(16,185,129,0.3);
  }

  .dark .start-button {
    background: #059669;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .dark .start-button:hover {
    background: #047857;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .add-template-button {
    width: 100%;
    height: auto;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 2px dashed #d1d5db;
  }

  .add-template-button:hover {
    transform: none;
  }

  .duplicate-set-button, .remove-set-button, .edit-set-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    min-height: 28px;
    padding: 6px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 1;
  }

  .duplicate-set-button {
    background: #4a90e2;
    color: white;
    box-shadow: 0 2px 4px rgba(74,144,226,0.2);
  }

  .duplicate-set-button:hover {
    background: #357abd;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(74,144,226,0.3);
  }

  .remove-set-button {
    background: #fee2e2;
    color: #dc2626;
    box-shadow: 0 2px 4px rgba(220,38,38,0.2);
  }

  .remove-set-button:hover {
    background: #fecaca;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(220,38,38,0.3);
  }

  .add-set-button {
    background: #f3f4f6;
    color: #4a90e2;
    border: 2px dashed #4a90e2;
  }

  .add-set-button:hover {
    background: rgba(74,144,226,0.1);
  }

  .add-exercise-button {
    background: #4a90e2;
    color: white;
    margin-left: auto;
    box-shadow: 0 2px 4px rgba(74,144,226,0.2);
  }

  .add-exercise-button:hover {
    background: #357abd;
    box-shadow: 0 4px 8px rgba(74,144,226,0.3);
  }

  .add-exercise-button:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
  }

  main.dark .view-button,
  main.dark .start-button,
  main.dark .add-exercise-button {
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  main.dark .edit-button,
  main.dark .add-template-button,
  main.dark .add-set-button {
    background: #1e293b;
    color: #e5e5e5;
    border-color: #475569;
  }

  main.dark .edit-button:hover,
  main.dark .add-template-button:hover {
    background: #334155;
    border-color: #60a5fa;
    color: #60a5fa;
  }

  main.dark .delete-button {
    background: #450a0a;
    color: #fca5a5;
  }

  main.dark .delete-button:hover {
    background: #7f1d1d;
  }

  main.dark .duplicate-set-button {
    background: #60a5fa;
  }

  main.dark .duplicate-set-button:hover {
    background: #3b82f6;
  }

  main.dark .remove-set-button {
    background: #450a0a;
    color: #fca5a5;
  }

  main.dark .remove-set-button:hover {
    background: #7f1d1d;
  }

  @media (max-width: 480px) {
    .view-button, .edit-button, .delete-button, .start-button, 
    .add-set-button, .add-exercise-button {
      width: 42px;
      height: 42px;
    }

    .template-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
  }
  
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 0.5rem;
    background-color: #f8f9fa;
    min-height: 100vh;
    transition: background-color 0.3s ease;
  }
  
  main.dark {
    color: #e5e5e5;
    background-color: #0f172a;
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
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  main.dark h1 {
    color: #f3f4f6;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
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
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .input-group label {
    font-weight: 500;
    color: #333;
  }
  
  .dark .input-group label {
    color: #e5e5e5;
  }
  
  .input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .input-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    padding: 0.5rem;
    flex: 1;
  }
  
  .dark .input-container {
    background: #333;
    border-color: #404040;
  }
  
  .input-container input {
    width: 80px;
    border: none;
    padding: 0;
    background: transparent;
  }
  
  .input-container input:focus {
    outline: none;
    box-shadow: none;
  }
  
  .dark .input-container input {
    color: #e5e5e5;
  }
  
  @media (max-width: 480px) {
    .input-group {
      width: 100%;
    }
    
    .input-row {
      width: 100%;
    }
    
    .input-container {
      flex: 1;
    }
    
    .input-container input {
      width: 100%;
      min-width: 0;
    }
  }
  
  .unit-label {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
    margin-right: 0.5rem;
  }
  
  .dark .unit-label {
    color: #94a3b8;
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
    border: 1px solid #e5e5e5;
    transition: all 0.2s ease;
  }
  
  main.dark .percentage-card {
    background: #1e293b;
    border-color: #334155;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .percentage {
    font-size: 1.125rem;
    font-weight: 500;
    color: #666;
  }
  
  main.dark .percentage {
    color: #94a3b8;
  }
  
  .weight {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4a90e2;
    margin-top: 0.25rem;
  }
  
  main.dark .weight {
    color: #60a5fa;
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
  
  .sets-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .set-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: all 0.2s;
  }
  
  .dark .set-row {
    background: #334155;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  
  .set-row.completed {
    background: #f0fdf4;
  }
  
  .dark .set-row.completed {
    background: #064e3b;
  }
  
  .set-number {
    font-size: 0.875rem;
    font-weight: 600;
    color: #666;
    min-width: 3rem;
    text-align: center;
  }
  
  .dark .set-number {
    color: #94a3b8;
  }
  
  .set-row:hover .set-number {
    transform: scale(1.05);
    box-shadow: 
      0 4px 8px rgba(16,185,129,0.3),
      0 8px 16px rgba(16,185,129,0.1);
  }
  
  .dark .set-row:hover .set-number {
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      0 8px 16px rgba(0,0,0,0.1);
  }
  
  .set-target {
    flex: 1;
    font-size: 1.125rem;
    font-weight: 500;
  }
  
  .dark .set-target {
    color: #e5e5e5;
  }
  
  .set-actual {
    font-size: 1.125rem;
    font-weight: 500;
    color: #059669;
    margin-right: 1rem;
  }
  
  .dark .set-actual {
    color: #4ade80;
  }
  
  .complete-set-button {
    padding: 0.5rem 1rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .complete-set-button:hover {
    background: #357abd;
    transform: translateY(-1px);
  }
  
  .dark .complete-set-button {
    background: #60a5fa;
  }
  
  .dark .complete-set-button:hover {
    background: #3b82f6;
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
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .template-actions-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    
    .template-actions button {
      width: 100%;
      padding: 0.75rem;
    }

    .start-button {
      margin-top: 0.25rem;
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
    flex-direction: column;
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
  
  main.dark .editor-section {
    background: #1e293b;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .set-editor:hover {
    background: #f0f0f0;
  }
  
  .set-inputs {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: nowrap;
  }
  
  @media (max-width: 480px) {
    .set-inputs {
      gap: 0.5rem;
      width: 100%;
    }
    
    .input-with-label {
      flex: 1;
      min-width: 0;
    }
    
    .input-with-label input {
      width: 100%;
      min-width: 0;
    }
    
    .set-actions {
      width: 100%;
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
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
    border-radius: 8px;
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
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .add-set-button:hover {
    background: #357abd;
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
  
  .theme-toggle {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.1),
      0 4px 8px rgba(0,0,0,0.05);
    z-index: 100;
  }
  
  .theme-toggle:hover {
    transform: scale(1.1);
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.15),
      0 8px 16px rgba(0,0,0,0.1);
  }
  
  main.dark .theme-toggle {
    background: #2a2a2a;
    color: #e5e5e5;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 4px 8px rgba(0,0,0,0.1);
  }
  
  main.dark .theme-toggle:hover {
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      0 8px 16px rgba(0,0,0,0.2);
  }
  
  @media (max-width: 480px) {
    .theme-toggle {
      top: 0.5rem;
      right: 0.5rem;
    }
  }
  
  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
    padding: 0 1rem;
  }
  
  .logo {
    max-width: 300px;
    height: auto;
    margin: 0 auto;
  }
  
  @media (max-width: 480px) {
    .logo {
      max-width: 200px;
    }
  }
  
  .exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .add-set-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    min-height: 36px;
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: #4a90e2;
    color: white;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(74,144,226,0.2);
  }
  
  .add-set-button:hover {
    background: #357abd;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(74,144,226,0.3);
  }
  
  main.dark .add-set-button {
    background: #60a5fa;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark .add-set-button:hover {
    background: #3b82f6;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  
  .workout-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .finish-button {
    flex: 1;
    padding: 1rem;
    min-width: 56px;
    min-height: 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 2px 4px rgba(16,185,129,0.2),
      0 4px 8px rgba(16,185,129,0.1);
  }
  
  .finish-button:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 
      0 4px 8px rgba(16,185,129,0.3),
      0 8px 16px rgba(16,185,129,0.1);
  }
  
  .dark .finish-button {
    background: #059669;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 4px 8px rgba(0,0,0,0.1);
  }
  
  .dark .finish-button:hover {
    background: #047857;
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      0 8px 16px rgba(0,0,0,0.1);
  }
  
  .cancel-button {
    min-width: 56px;
    min-height: 56px;
    padding: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 2px 4px rgba(220,38,38,0.1),
      0 4px 8px rgba(220,38,38,0.05);
  }
  
  .cancel-button:hover {
    background: #fecaca;
    transform: translateY(-1px);
    box-shadow: 
      0 4px 8px rgba(220,38,38,0.2),
      0 8px 16px rgba(220,38,38,0.1);
  }
  
  .dark .cancel-button {
    background: #450a0a;
    color: #fca5a5;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 4px 8px rgba(0,0,0,0.1);
  }
  
  .dark .cancel-button:hover {
    background: #7f1d1d;
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      0 8px 16px rgba(0,0,0,0.1);
  }
  
  @media (max-width: 480px) {
    .workout-actions {
      flex-direction: column;
    }
    
    .finish-button,
    .cancel-button {
      width: 100%;
      padding: 1.25rem;
    }
  }
  
  .template-name-input {
    flex: 1;
    font-size: 1rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    background: white;
    margin: -0.25rem 0;
  }
  
  .template-name-input:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74,144,226,0.2);
  }
  
  main.dark .template-name-input {
    background: #1e293b;
    border-color: #475569;
    color: #e5e5e5;
  }
  
  main.dark .template-name-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(96,165,250,0.2);
  }
  
  .duplicate-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    min-height: 36px;
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: #4a90e2;
    color: white;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(74,144,226,0.2);
  }
  
  .duplicate-button:hover {
    background: #357abd;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(74,144,226,0.3);
  }
  
  main.dark .duplicate-button {
    background: #60a5fa;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  main.dark .duplicate-button:hover {
    background: #3b82f6;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  @media (max-width: 480px) {
    .template-card {
      width: calc(100% + 0.5rem);
    }
  }

  @media (max-width: 480px) {
    .active-workout {
      margin: 0 -0.25rem;
      width: calc(100% + 0.5rem);
      overflow-x: hidden;
    }

    .exercise-card {
      margin: 1rem -0.25rem;
      padding: 0.75rem;
      width: calc(100% + 0.5rem);
      overflow-x: hidden;
    }

    .set-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .set-number {
      width: 2rem;
      height: 2rem;
      padding: 0;
    }

    .set-target {
      width: 100%;
    }

    .set-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .set-actual {
      width: 100%;
      margin-right: 0;
      text-align: left;
    }

    .complete-set-button {
      width: 100%;
    }

    .edit-set-button {
      width: 100%;
      padding: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .exercise-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .exercise-header h4 {
      margin: 0;
      width: 100%;
    }

    .add-set-button {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }

    .sets-list {
      gap: 0.5rem;
    }

    .set-row {
      margin: 0 -0.25rem;
      width: calc(100% + 0.5rem);
      border-radius: 0.5rem;
    }

    .set-actions {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem;
    }

    .remove-set-button {
      width: 42px;
      height: 42px;
    }
  }

  @media (max-width: 480px) {
    .template-list {
      margin: 0;
      width: 100%;
      overflow-x: hidden;
    }

    .template-card {
      margin: 0 0 1rem 0;
      width: 100%;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .template-header {
      padding: 0.75rem;
      margin: 0;
    }
  }

  @media (max-width: 480px) {
    .set-editor {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .set-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .set-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .input-with-label {
      flex: 1;
      min-width: 0;
    }
    
    .input-with-label input {
      width: 100%;
      min-width: 0;
    }

    .multiply {
      margin: 0 0.25rem;
      flex-shrink: 0;
    }
    
    .set-actions {
      display: flex;
      gap: 0.5rem;
    }

    .duplicate-set-button,
    .remove-set-button {
      flex: 1;
      height: 42px;
    }
  }

  @media (max-width: 480px) {
    .exercise-form {
      gap: 1rem;
    }

    .form-group {
      width: 100%;
    }

    .lift-select {
      width: 100%;
    }

    .set-editor {
      padding: 0.75rem;
    }

    .set-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .set-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .input-with-label {
      flex: 1;
      min-width: 0;
    }

    .input-with-label input {
      width: 100%;
      min-width: 0;
    }

    .set-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    .editor-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .add-set-button,
    .add-exercise-button {
      width: 100%;
    }
  }

  .template-exercise {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    margin-top: 0.5rem;
  }

  .exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .exercise-header:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .exercise-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .set-count {
    color: #666;
    font-size: 0.875rem;
  }

  main.dark .exercise-header:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  main.dark .set-count {
    color: #94a3b8;
  }

  .template-sets {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>