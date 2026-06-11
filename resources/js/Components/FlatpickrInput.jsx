import React, { forwardRef } from 'react';
import Flatpickr from 'react-flatpickr';
import "flatpickr/dist/themes/airbnb.css";
import { Arabic } from "flatpickr/dist/esm/l10n/ar.js";
import { Calendar, Clock } from 'lucide-react';

const FlatpickrInput = forwardRef(({ type = 'date', value, onChange, placeholder, className = '', required = false, ...props }, ref) => {
    
    // Config based on type
    const isTime = type === 'time';
    const isDateTime = type === 'datetime';

    const options = {
        locale: Arabic,
        disableMobile: true, // Forces flatpickr to render instead of native on mobile
        enableTime: isTime || isDateTime,
        noCalendar: isTime,
        dateFormat: isTime ? "H:i" : isDateTime ? "Y-m-d H:i" : "Y-m-d",
        time_24hr: true,
        ...props.options
    };

    const defaultPlaceholder = isTime ? "اختر الوقت..." : "اختر التاريخ...";
    const finalPlaceholder = placeholder || defaultPlaceholder;

    const baseClassName = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white";

    return (
        <div className="relative">
            <Flatpickr
                ref={ref}
                value={value}
                onChange={([date]) => {
                    if (date) {
                        let formattedDate = "";
                        if (isTime) {
                            formattedDate = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                        } else if (isDateTime) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                            formattedDate = `${year}-${month}-${day} ${time}`;
                        } else {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            formattedDate = `${year}-${month}-${day}`;
                        }
                        onChange && onChange(formattedDate);
                    } else {
                        onChange && onChange('');
                    }
                }}
                options={options}
                placeholder={finalPlaceholder}
                className={`${baseClassName} ${className}`}
                required={required}
                {...props}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                {isTime ? <Clock size={18} /> : <Calendar size={18} />}
            </div>
        </div>
    );
});

export default FlatpickrInput;
