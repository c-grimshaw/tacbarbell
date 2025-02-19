<script>
  import { darkMode } from '../stores/theme';
  
  const { percentage, weight, useKilograms } = $props();
  let isHovered = $state(false);
  
  function formatWeight(weight) {
    if (weight === '-') return '-';
    return `${weight}${useKilograms ? 'kg' : 'lbs'}`;
  }
</script>

<div 
  class="percentage-card" 
  class:dark={$darkMode}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  <div class="percentage">{percentage}%</div>
  <div class="weight" style="transform: scale({isHovered ? 1.05 : 1})">
    {formatWeight(weight)}
  </div>
</div>

<style>
  .percentage-card {
    background: white;
    padding: 1rem;
    border-radius: 1rem;
    text-align: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid #e5e5e5;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.05),
      0 4px 8px rgba(0,0,0,0.05);
  }
  
  .dark .percentage-card {
    background: #2a2a2a;
    border-color: #404040;
    box-shadow: 
      0 2px 4px rgba(0,0,0,0.2),
      0 4px 8px rgba(0,0,0,0.1);
  }
  
  .percentage-card:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.1),
      0 8px 16px rgba(0,0,0,0.05);
    border-color: #1a73e8;
  }
  
  .dark .percentage-card:hover {
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      0 8px 16px rgba(0,0,0,0.1);
    border-color: #60a5fa;
  }
  
  .percentage {
    font-size: 1rem;
    font-weight: 600;
    color: #666;
    letter-spacing: 0.5px;
  }
  
  .dark .percentage {
    color: #999;
  }
  
  .weight {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a73e8;
    margin-top: 0.5rem;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark .weight {
    color: #60a5fa;
  }
  
  @media (max-width: 480px) {
    .percentage-card {
      padding: 0.75rem;
    }
    
    .percentage {
      font-size: 0.875rem;
    }
    
    .weight {
      font-size: 1.25rem;
      margin-top: 0.25rem;
    }
  }
</style> 