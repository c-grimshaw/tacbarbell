<script>
  import { Scale } from 'lucide-svelte';
  import { darkMode } from '../stores/theme';
  
  const { useKilograms, onToggle } = $props();
  let isHovered = $state(false);
</script>

<div class="unit-toggle" class:dark={$darkMode}>
  <div class="toggle-container" 
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
  >
    <Scale 
      class="toggle-icon" 
      size={20} 
      strokeWidth={2.5}
      style="opacity: {isHovered ? '1' : '0.7'}; transition: opacity 0.2s"
    />
    <button 
      class="unit-button {useKilograms ? 'active' : ''}" 
      onclick={onToggle}
    >
      kg
    </button>
    <button 
      class="unit-button {!useKilograms ? 'active' : ''}"
      onclick={onToggle}
    >
      lbs
    </button>
  </div>
</div>

<style>
  .unit-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .toggle-container {
    background: #f0f0f0;
    padding: 0.5rem;
    border-radius: 2rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    box-shadow: 
      inset 0 2px 4px rgba(0,0,0,0.05),
      0 1px 2px rgba(0,0,0,0.05);
  }
  
  .dark .toggle-container {
    background: #2a2a2a;
    box-shadow: 
      inset 0 2px 4px rgba(0,0,0,0.2),
      0 1px 2px rgba(255,255,255,0.05);
  }
  
  .toggle-icon {
    margin: 0 0.5rem;
    color: #666;
  }
  
  .dark .toggle-icon {
    color: #999;
  }
  
  .unit-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 1.5rem;
    background: transparent;
    color: #666;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
  }
  
  .unit-button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: inherit;
  }
  
  .unit-button:hover:not(.active)::after {
    opacity: 0.05;
  }
  
  .dark .unit-button {
    color: #999;
  }
  
  .unit-button.active {
    background: white;
    color: #1a73e8;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.1),
      0 4px 8px rgba(26,115,232,0.1);
    transform: translateY(-1px);
  }
  
  .dark .unit-button.active {
    background: #3a3a3a;
    color: #60a5fa;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 4px 8px rgba(96,165,250,0.1);
  }
  
  @media (max-width: 480px) {
    .toggle-container {
      width: 100%;
      max-width: 280px;
      justify-content: space-between;
    }
    
    .unit-button {
      flex: 1;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
  }
</style> 