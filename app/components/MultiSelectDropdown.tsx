'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = 'Search and select...',
  label,
  required = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((item) => item !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleRemoveTag = (option: string) => {
    onChange(selectedValues.filter((item) => item !== option));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-ink mb-2">
          {label}
          {required && <span className="text-coral ml-1">*</span>}
        </label>
      )}

      {/* Main Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 cursor-pointer flex items-center justify-between min-h-[44px]"
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {selectedValues.length === 0 ? (
            <span className="text-ink/40">{placeholder}</span>
          ) : (
            selectedValues.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded-full bg-ocean/10 px-3 py-1 text-sm text-ocean"
              >
                {value}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(value);
                  }}
                  className="hover:text-ocean/60 transition"
                  type="button"
                >
                  <X size={14} />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {selectedValues.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-ink/5 rounded transition"
              type="button"
              aria-label="Clear selection"
            >
              <X size={16} className="text-ink/40" />
            </button>
          )}
          <ChevronDown
            size={20}
            className={`text-ink/40 transition ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-lg border border-ink/20 bg-paper shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-ink/10">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-ink/60 text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-ocean/5 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggleOption(option)}
                    className="w-4 h-4 rounded border-ink/30 text-ocean focus:ring-2 focus:ring-ocean/20 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm text-ink">{option}</span>
                </label>
              ))
            )}
          </div>

          {/* Selected Count Footer */}
          {selectedValues.length > 0 && (
            <div className="px-4 py-2 text-xs text-ink/60 border-t border-ink/10 bg-ink/5">
              {selectedValues.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
