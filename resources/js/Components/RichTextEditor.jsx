import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-hot-toast';

export default function RichTextEditor({ value, onChange, placeholder, className = "", readOnly = false }) {
    const quillRef = useRef(null);

    // 1. & 2. Custom Toolbar + RTL Control + 5. Image Handler
    const modules = useMemo(() => {
        if (readOnly) {
            return { toolbar: false };
        }
        return {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                [{ 'direction': 'rtl' }], // Direction controls
                ['image', 'clean'] // Added image button to show custom handler
            ],
            handlers: {
                image: () => {
                    toast.error('عذراً، إضافة الصور المباشرة داخل النص غير مدعومة حالياً للحفاظ على أداء النظام. الرجاء استخدام المرفقات.');
                }
            }
        },
        clipboard: {
            matchers: [
                // Prevent pasting images directly
                ['IMG', (node, delta) => {
                    toast.error('تم حظر لصق الصور مباشرة داخل النص لتجنب بطء النظام.');
                    return { ops: [] };
                }]
            ]
        }
    };
}, [readOnly]);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet',
        'align',
        'direction',
        'image'
    ];

    return (
        <div className={`relative ${className}`}>
            <style>
                {`
                /* 4. Tajawal Font & 3. UI Integration */
                .erp-quill .ql-container {
                    font-family: 'Tajawal', sans-serif !important;
                    font-size: 15px;
                    border: none !important;
                    border-radius: 0 0 1rem 1rem;
                }
                .erp-quill .ql-editor {
                    min-height: 192px;
                }
                .erp-quill .ql-editor.ql-blank::before {
                    font-style: normal !important;
                    color: var(--dark-400) !important;
                    right: 15px !important;
                    left: auto !important;
                }
                .erp-quill-readonly .ql-container {
                    font-size: 16px;
                    background: transparent !important;
                    border: none !important;
                }
                .erp-quill-readonly .ql-editor {
                    min-height: auto;
                    padding: 0;
                    color: inherit;
                }
                .erp-quill .ql-toolbar {
                    font-family: 'Tajawal', sans-serif !important;
                    border: none !important;
                    border-bottom: 1px solid var(--surface-border) !important;
                    background-color: var(--dark-50) !important;
                    border-radius: 1rem 1rem 0 0;
                    padding: 12px 15px !important;
                }
                .dark .erp-quill .ql-toolbar {
                    background-color: var(--dark-800) !important;
                    border-color: var(--dark-700) !important;
                }
                .erp-quill .ql-toolbar button, .erp-quill .ql-toolbar .ql-picker {
                    transition: all 0.2s ease !important;
                }
                .erp-quill .ql-toolbar button:hover, .erp-quill .ql-toolbar button:focus, .erp-quill .ql-toolbar button.ql-active {
                    color: var(--primary-500) !important;
                    background-color: var(--primary-50) !important;
                    border-radius: 6px;
                }
                .dark .erp-quill .ql-toolbar button:hover, .dark .erp-quill .ql-toolbar button:focus, .dark .erp-quill .ql-toolbar button.ql-active {
                    background-color: var(--primary-900) !important;
                }
                .erp-quill .ql-toolbar button:hover .ql-stroke, .erp-quill .ql-toolbar button:focus .ql-stroke, .erp-quill .ql-toolbar button.ql-active .ql-stroke {
                    stroke: var(--primary-500) !important;
                }
                .erp-quill .ql-toolbar button:hover .ql-fill, .erp-quill .ql-toolbar button:focus .ql-fill, .erp-quill .ql-toolbar button.ql-active .ql-fill {
                    fill: var(--primary-500) !important;
                }
                .dark .erp-quill .ql-picker {
                    color: var(--dark-300) !important;
                }
                .dark .erp-quill .ql-stroke {
                    stroke: var(--dark-300) !important;
                }
                .dark .erp-quill .ql-fill {
                    fill: var(--dark-300) !important;
                }
                .dark .erp-quill .ql-picker-options {
                    background-color: var(--dark-800) !important;
                    border-color: var(--dark-700) !important;
                }
                .erp-quill .ql-picker-label:hover {
                    color: var(--primary-500) !important;
                }
                .erp-quill .ql-picker-label:hover .ql-stroke {
                    stroke: var(--primary-500) !important;
                }
                `}
            </style>
            <div className={`rounded-2xl transition-all ${readOnly ? 'border-none' : 'bg-white dark:bg-dark-900 overflow-hidden border-2 border-dark-200 dark:border-dark-700 focus-within:border-primary-500 focus-within:shadow-md focus-within:shadow-primary-500/10'}`}>
                <ReactQuill 
                    ref={quillRef}
                    theme="snow"
                    value={value || ''}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={`erp-quill ${readOnly ? 'erp-quill-readonly' : ''}`}
                />
            </div>
        </div>
    );
}
