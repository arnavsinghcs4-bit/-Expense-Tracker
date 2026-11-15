import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  prefix?: React.ReactNode;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => React.ReactNode;
  inFlow?: boolean; // If true, dropdown expands in-flow pushing content down
}

export function Select<T>({
  value,
  onChange,
  options,
  placeholder,
  prefix,
  searchable = false,
  disabled = false,
  className = '',
  ariaLabel,
  renderOption,
  inFlow = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const visibleOptions = filteredOptions.filter(opt => !opt.disabled);
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev + 1;
          return next >= visibleOptions.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev - 1;
          return next < 0 ? visibleOptions.length - 1 : next;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < visibleOptions.length) {
          onChange(visibleOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        if (searchable && e.key.length === 1) {
          // Let the search input handle typing
        }
        break;
    }
  };

  const handleOptionClick = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setHighlightedIndex(0);
        setSearchQuery('');
      }
    }
  };

  // Scroll highlighted option into view
  const highlightedOptionRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (highlightedOptionRef.current) {
      highlightedOptionRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={`select-dropdown ${inFlow ? '' : 'popover'}`}
      role="listbox"
      aria-label={ariaLabel}
    >
      {searchable && (
        <div className="select-search">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            aria-label="Search options"
          />
          <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
        </div>
      )}
      <div className="select-dropdown-content">
        {filteredOptions.length === 0 ? (
          <div className="select-empty">No options found</div>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            const isDisabled = option.disabled;

            return (
              <button
                key={String(option.value)}
                ref={isHighlighted ? highlightedOptionRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleOptionClick(option.value)}
                onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
                className={`select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {renderOption ? (
                  renderOption(option, isSelected)
                ) : (
                  <>
                    {option.icon && (
                      <span className="option-icon" aria-hidden="true">{option.icon}</span>
                    )}
                    <span className="option-label">{option.label}</span>
                    {isSelected && (
                      <span className="option-check" aria-hidden="true">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className={`dropdown-container ${className} ${isOpen ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        {prefix && <span className="select-prefix" aria-hidden="true">{prefix}</span>}
        <span className="select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="select-icon w-4 h-4 flex-shrink-0 text-muted transition-transform duration-200" strokeWidth={2} aria-hidden="true" />
      </button>
      {isOpen && dropdownContent}
    </div>
  );
}

// Multi-select variant for future use
export interface MultiSelectProps<T> {
  value: T[];
  onChange: (value: T[]) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  maxSelected?: number;
}

// Helper to create option icon for currencies
export function createCurrencyIcon(symbol: string) {
  return (
    <span className="category-pill" style={{ backgroundColor: 'var(--accent-primary)', width: 28, height: 28 }}>
      <span className="text-white font-medium text-sm">{symbol}</span>
    </span>
  );
}

// Helper to create option icon for categories
export function createCategoryIcon(Icon: React.ElementType, color: string) {
  return (
    <span className="category-pill" style={{ backgroundColor: color + '20', width: 28, height: 28 }}>
      <Icon className="w-4 h-4" strokeWidth={2.5} style={{ color }} />
    </span>
  );
}