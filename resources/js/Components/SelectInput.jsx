import React, { forwardRef } from 'react';
import Select from 'react-select';

const SelectInput = forwardRef(({ 
    options = [], 
    value, 
    onChange, 
    isMulti = false, 
    placeholder = "اختر...",
    className = '',
    required = false,
    ...props 
}, ref) => {

    // Helper to find the object value from a primitive string/number (if the consumer passed just an ID)
    const getFormattedValue = () => {
        if (value === null || value === undefined || value === '') return isMulti ? [] : null;
        
        if (isMulti) {
            // If value is an array of strings/numbers, map them to objects
            if (Array.isArray(value)) {
                return value.map(v => {
                    if (typeof v === 'object' && v !== null) return v;
                    return options.find(opt => String(opt.value) === String(v)) || { value: v, label: v };
                });
            }
            return [];
        } else {
            if (typeof value === 'object' && value !== null) return value;
            return options.find(opt => String(opt.value) === String(value)) || null;
        }
    };

    // Helper to emit just the primitive values back to the consumer (or array of primitives for multi)
    const handleChange = (selected) => {
        if (!onChange) return;
        
        if (isMulti) {
            // selected is an array of objects
            const vals = selected ? selected.map(item => item.value) : [];
            onChange(vals);
        } else {
            // selected is an object
            onChange(selected ? selected.value : '');
        }
    };

    const customClassNames = {
        control: (state) => `
            flex bg-white dark:bg-slate-900 
            border ${state.isFocused ? 'border-primary-400 dark:border-primary-500 ring-4 ring-primary-500/10' : 'border-slate-200 dark:border-slate-800'} 
            rounded-2xl px-2 py-1 text-sm transition-all text-slate-700 dark:text-slate-200 font-bold hover:border-slate-300 dark:hover:border-slate-700 shadow-sm
        `,
        menu: () => "mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-[9999]",
        menuList: () => "p-1",
        option: (state) => `
            px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors
            ${state.isSelected ? 'bg-primary-500 text-white' : 
              state.isFocused ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 
              'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
        `,
        multiValue: () => "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 rounded-lg m-1 flex items-center",
        multiValueLabel: () => "px-2 py-1 text-xs font-bold",
        multiValueRemove: () => "px-2 hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-800 dark:hover:text-primary-200 rounded-l-lg transition-colors cursor-pointer",
        placeholder: () => "text-slate-400 dark:text-slate-500 font-semibold",
        singleValue: () => "text-slate-800 dark:text-slate-200 font-bold",
        input: () => "text-slate-800 dark:text-slate-200 font-bold outline-none",
        indicatorSeparator: () => "bg-slate-200 dark:bg-slate-700 my-2",
        dropdownIndicator: () => "p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer",
        clearIndicator: () => "p-2 text-slate-400 hover:text-accent-500 cursor-pointer"
    };

    return (
        <div className={`relative ${className}`}>
            <Select
                ref={ref}
                options={options}
                value={getFormattedValue()}
                onChange={handleChange}
                isMulti={isMulti}
                placeholder={placeholder}
                isRtl={true}
                unstyled={true}
                classNames={customClassNames}
                isClearable={true}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                {...props}
            />
            {/* Native input for required validation if Select is empty */}
            {required && (
                <input
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ opacity: 0, height: 0, width: 0, position: 'absolute', zIndex: -1 }}
                    value={value || ''}
                    onChange={() => {}}
                    required
                />
            )}
        </div>
    );
});

export default SelectInput;
