<script>
  import { slide } from 'svelte/transition';
  import { darkMode } from '../stores/theme';
  import { Clock, Calendar, CheckCircle2 } from 'lucide-svelte';
  
  const { workout, template, onDelete, onToggle, isExpanded, useKilograms } = $props();
  
  function formatWeight(weight) {
    if (weight === '-') return '-';
    return `${weight}${useKilograms ? 'kg' : 'lbs'}`;
  }
  
  function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatTime(date) {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
  
  function getDuration(start, end) {
    return Math.round((new Date(end) - new Date(start)) / 60000);
  }
  
  function getCompletedSets(workout) {
    return workout.exercises.reduce((total, ex) => 
      total + ex.sets.filter(s => s.completed).length, 0
    );
  }
</script>

<div class="workout-card" class:dark={$darkMode}>
  <div class="card-header" onclick={onToggle}>
    <div class="header-content">
      <h4>{template?.name || 'Unnamed Workout'}</h4>
      <div class="meta">
        <div class="meta-item">
          <Calendar size={14} />
          <span>{formatDate(workout.startTime)}</span>
        </div>
        <div class="meta-item">
          <Clock size={14} />
          <span>{formatTime(workout.startTime)}</span>
        </div>
        <div class="meta-item">
          <CheckCircle2 size={14} />
          <span>{getCompletedSets(workout)} sets completed</span>
        </div>
      </div>
    </div>
    <div class="header-actions" onclick={(e) => e.stopPropagation()}>
      <button 
        class="expand-button"
        onclick={onToggle}
      >
        {isExpanded ? '−' : '+'}
      </button>
      <button
        class="delete-button"
        onclick={onDelete}
      >
        Delete
      </button>
    </div>
  </div>
  
  {#if isExpanded}
    <div class="workout-details" transition:slide>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Started</span>
          <span class="summary-value">{formatTime(workout.startTime)}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Finished</span>
          <span class="summary-value">{formatTime(workout.endTime)}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Duration</span>
          <span class="summary-value">{getDuration(workout.startTime, workout.endTime)} min</span>
        </div>
      </div>
      
      <div class="exercises">
        {#each workout.exercises as exercise}
          <div class="exercise-card">
            <h5>{exercise.liftName}</h5>
            <div class="sets-grid">
              {#each exercise.sets as set}
                <div class="set-card" class:completed={set.completed}>
                  <div class="set-planned">
                    Planned: {set.percentage}% × {set.reps}
                  </div>
                  {#if set.completed}
                    <div class="set-actual">
                      {formatWeight(set.actualWeight)} × {set.actualReps}
                    </div>
                  {:else}
                    <div class="set-skipped">Set skipped</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .workout-card {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.05),
      0 4px 8px rgba(0,0,0,0.05);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid #e5e5e5;
  }
  
  :global(main.dark) .workout-card {
    background: #0f172a;
    border-color: #334155;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 4px 8px rgba(0,0,0,0.1);
  }
  
  .workout-card:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.1),
      0 8px 16px rgba(0,0,0,0.05);
  }
  
  :global(main.dark) .workout-card:hover {
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      0 8px 16px rgba(0,0,0,0.1);
    border-color: #475569;
  }
  
  .card-header {
    padding: 1.25rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-content {
    flex: 1;
  }
  
  h4 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .dark h4 {
    color: #f3f4f6;
  }
  
  .meta {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.875rem;
  }
  
  .dark .meta-item {
    color: #94a3b8;
  }
  
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .expand-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: #f0f0f0;
    color: #666;
    font-size: 1.25rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }
  
  .dark .expand-button {
    background: #334155;
    color: #94a3b8;
  }
  
  .expand-button:hover {
    background: #e0e0e0;
    color: #333;
  }
  
  .dark .expand-button:hover {
    background: #475569;
    color: #f3f4f6;
  }
  
  .delete-button {
    padding: 0.5rem 1rem;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .dark .delete-button {
    background: #450a0a;
    color: #fca5a5;
  }
  
  .delete-button:hover {
    background: #fecaca;
  }
  
  .dark .delete-button:hover {
    background: #7f1d1d;
  }
  
  .workout-details {
    padding: 0 1.25rem 1.25rem;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .summary-card {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid #e5e5e5;
  }
  
  .dark .summary-card {
    background: #1e293b;
    border-color: #334155;
  }
  
  .summary-label {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
  }
  
  .dark .summary-label {
    color: #94a3b8;
  }
  
  .summary-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .dark .summary-value {
    color: #f3f4f6;
  }
  
  .exercises {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  
  .exercise-card {
    background: #f8f9fa;
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid #e5e5e5;
  }
  
  .dark .exercise-card {
    background: #1e293b;
    border-color: #334155;
  }
  
  h5 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .dark h5 {
    color: #f3f4f6;
  }
  
  .sets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  .set-card {
    background: white;
    padding: 1rem;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border: 1px solid #e5e5e5;
  }
  
  .dark .set-card {
    background: #0f172a;
    border-color: #1e293b;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  
  .set-card.completed {
    background: #f0fdf4;
    border: 1px solid #86efac;
  }
  
  .dark .set-card.completed {
    background: #064e3b;
    border: 1px solid #059669;
  }
  
  .set-planned {
    font-size: 0.875rem;
    color: #666;
  }
  
  .dark .set-planned {
    color: #94a3b8;
  }
  
  .set-actual {
    font-size: 1rem;
    font-weight: 600;
    color: #059669;
  }
  
  .dark .set-actual {
    color: #4ade80;
  }
  
  .set-skipped {
    font-size: 0.875rem;
    color: #dc2626;
  }
  
  .dark .set-skipped {
    color: #fca5a5;
  }
  
  @media (max-width: 480px) {
    .card-header {
      flex-direction: column;
      padding: 1rem;
    }
    
    .header-actions {
      width: 100%;
      margin-top: 1rem;
    }
    
    .expand-button,
    .delete-button {
      flex: 1;
      height: 40px;
    }
    
    .workout-details {
      padding: 0 1rem 1rem;
    }
    
    .summary-grid {
      grid-template-columns: 1fr;
    }
    
    .sets-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 