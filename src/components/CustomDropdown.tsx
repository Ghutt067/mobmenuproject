import { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Selecione...',
  className = ''
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`custom-dropdown ${className} ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <div
        ref={triggerRef}
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        style={{
          padding: '4px 8px',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          color: disabled ? '#666' : '#333',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '120px',
          position: 'relative'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: '8px',
            flexShrink: 0
          }}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {isOpen && !disabled && (
        <div className="custom-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-dropdown-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

