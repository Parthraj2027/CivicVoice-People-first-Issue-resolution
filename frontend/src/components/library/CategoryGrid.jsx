import React from 'react';
import { Check } from 'lucide-react';
import '@/components/library/Library.css';

const CategoryGrid = ({ categories = [], selected, onSelect, type = 'civic' }) => {
  return (
    <div className={`cv-category-grid ${type}`}>
      {categories.map((category) => {
        const isSelected = selected === category.value;
        const Icon = category.icon;
        return (
          <button
            key={category.value}
            type="button"
            className={`cv-category-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect?.(category.value)}
            aria-pressed={isSelected}
          >
            <span className="icon-wrap">{Icon ? <Icon size={18} /> : null}</span>
            <span>{category.label}</span>
            {isSelected ? <Check size={14} className="check" /> : null}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryGrid;
