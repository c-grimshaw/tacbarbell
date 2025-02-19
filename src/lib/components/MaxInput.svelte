<script>
  import { PlusCircle } from 'lucide-svelte';
  import { darkMode } from '../stores/theme';
  
  const { lift, useKilograms } = $props();
  
  let inputValue = $state('');
  let isFocused = $state(false);
  let isHovered = $state(false);
  
  $effect(() => {
    // Update input value when max changes
    inputValue = lift.max || '';
  });
  
  function handleInput(e) {
    const value = e.target.value;
    const numValue = parseFloat(value);
    lift.max = isNaN(numValue) ? 0 : numValue;
  }
  
  function handleView() {
    lift.isSelected = true;
  }
</script>

<div class="max-input" class:dark={$darkMode}>
  <label for={lift.id} class="text-sm font-medium">{lift.name}</label>
  <div class="input-row">
    <div class="input-group" class:focused={isFocused}>
      <input
        type="number"
        id={lift.id}
        placeholder="Enter weight"
        value={inputValue}
        oninput={handleInput}
        onfocus={() => isFocused = true}
        onblur={() => isFocused = false}
        min="0"
        step="2.5"
      />
      <span class="unit">{useKilograms ? 'kg' : 'lbs'}</span>
    </div>
    <button
      class="view-btn"
      onclick={handleView}
      onmouseenter={() => isHovered = true}
      onmouseleave={() => isHovered = false}
    >
      <PlusCircle 
        size={22} 
        strokeWidth={2.5}
        class="icon"
        style="transform: scale({isHovered ? 1.1 : 1}); transition: transform 0.2s"
      />
    </button>
  </div>
</div>

<style>
  .max-input {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  label {
    color: #333;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  .dark label {
    color: #e5e5e5;
  }
  
  .input-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .input-group {
    flex: 1;
    display: flex;
    align-items: center;
    background: white;
    border-radius: 0.75rem;
    padding: 0.25rem 0.75rem;
    gap: 0.5rem;
    border: 2px solid #e5e5e5;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .dark .input-group {
    background: #2a2a2a;
    border-color: #404040;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .input-group.focused {
    border-color: #1a73e8;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.05),
      0 0 0 2px rgba(26,115,232,0.2);
  }
  
  .dark .input-group.focused {
    border-color: #60a5fa;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 0 0 2px rgba(96,165,250,0.2);
  }
  
  input {
    flex: 1;
    border: none;
    padding: 0.75rem 0;
    font-size: 1.1rem;
    font-weight: 500;
    text-align: right;
    outline: none;
    background: transparent;
    color: #333;
  }
  
  .dark input {
    color: #e5e5e5;
  }
  
  input::placeholder {
    color: #999;
  }
  
  .dark input::placeholder {
    color: #666;
  }
  
  input::-webkit-inner-spin-button,
  input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  .unit {
    color: #666;
    font-size: 0.95rem;
    font-weight: 600;
    min-width: 35px;
  }
  
  .dark .unit {
    color: #999;
  }
  
  .view-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: #1a73e8;
    color: white;
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 2px 4px rgba(26,115,232,0.2),
      0 4px 8px rgba(26,115,232,0.1);
  }
  
  .view-btn:hover {
    background: #1557b0;
    transform: translateY(-1px);
    box-shadow: 
      0 4px 8px rgba(26,115,232,0.3),
      0 8px 16px rgba(26,115,232,0.1);
  }
  
  .dark .view-btn {
    background: #60a5fa;
    box-shadow: 
      0 2px 4px rgba(96,165,250,0.3),
      0 4px 8px rgba(96,165,250,0.2);
  }
  
  .dark .view-btn:hover {
    background: #3b82f6;
    box-shadow: 
      0 4px 8px rgba(96,165,250,0.4),
      0 8px 16px rgba(96,165,250,0.2);
  }
  
  @media (max-width: 480px) {
    .input-row {
      flex-direction: column;
      width: 100%;
      gap: 0.5rem;
    }
    
    .input-group {
      width: 100%;
    }
    
    .view-btn {
      width: 100%;
      padding: 0.875rem;
    }
    
    input {
      font-size: 1rem;
    }
  }
</style> 