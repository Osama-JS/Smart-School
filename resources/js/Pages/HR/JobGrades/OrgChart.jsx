import React, { useState, useRef, useEffect } from 'react';
import { Star, ShieldCheck, ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';

const levelColor = (level) => {
    // القيادي / Executive (1-4)
    if (level <= 4) {
        return 'bg-gradient-to-br from-accent-500 to-accent-600 text-white border-accent-400 shadow-accent-500/30';
    }
    // الإشرافي / Supervisory (5-9)
    if (level <= 9) {
        return 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/40 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-700/50 shadow-primary-500/10';
    }
    // التشغيلي / Operational (10-15)
    return 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-slate-200/50 dark:shadow-none';
};

const TreeNode = ({ node }) => {
    const isTopLevel = node.level <= 4;
    
    return (
        <div className="flex flex-col items-center">
            {/* The Node Card */}
            <div className={`relative group px-4 py-3 rounded-2xl border shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-w-[130px] max-w-[160px] z-10 ${levelColor(node.level)}`}>
                {isTopLevel && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-400 to-accent-600 rounded-[1.2rem] blur opacity-20 group-hover:opacity-40 transition-opacity -z-10"></div>
                )}
                
                <div className="flex flex-col items-center justify-center text-center">
                    {isTopLevel && (
                        <div className="w-8 h-8 mb-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                    )}
                    
                    <h4 className={`font-black mb-1.5 leading-snug ${isTopLevel ? 'text-sm' : 'text-xs'}`}>
                        {node.name}
                    </h4>
                    
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm border border-black/5 dark:border-white/5">
                        <Star size={9} className={isTopLevel ? 'fill-white' : 'fill-primary-500 dark:fill-primary-400'} /> 
                        مستوى {node.level}
                    </div>
                </div>
            </div>
            
            {/* Children container */}
            {node.children && node.children.length > 0 && (
                <div className="relative flex justify-center mt-8">
                    {/* Parent line down to the horizontal connecting bar */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300 dark:bg-slate-600"></div>
                    
                    <div className="flex justify-center">
                        {node.children.map((child, index) => {
                            const isFirst = index === 0;
                            const isLast = index === node.children.length - 1;
                            const isOnly = node.children.length === 1;

                            return (
                                <div key={child.id} className="relative flex flex-col items-center px-4 sm:px-6">
                                    {/* Horizontal connecting line */}
                                    {!isOnly && (
                                        <div className={`absolute top-0 h-[2px] bg-slate-300 dark:bg-slate-600 ${
                                            isFirst ? 'left-0 w-1/2' : 
                                            isLast ? 'right-0 w-1/2' : 
                                            'inset-x-0 w-full'
                                        }`}></div>
                                    )}
                                    
                                    {/* Vertical line down to the node */}
                                    <div className="relative w-[2px] h-8 bg-slate-300 dark:bg-slate-600"></div>
                                    
                                    {/* The Node */}
                                    <TreeNode node={child} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function OrgChart({ data }) {
    const buildTree = (grades) => {
        const map = new Map();
        const roots = [];

        // Sort data by level asc so higher levels (lower numbers) come first
        const sortedData = [...grades].sort((a, b) => a.level - b.level);

        // Initialize map
        sortedData.forEach(g => map.set(g.id, { ...g, children: [] }));

        // Build hierarchy
        sortedData.forEach(g => {
            if (g.parent_id) {
                const parent = map.get(g.parent_id);
                if (parent) {
                    parent.children.push(map.get(g.id));
                } else {
                    roots.push(map.get(g.id));
                }
            } else {
                roots.push(map.get(g.id));
            }
        });

        // Sort children of each node by level (asc)
        map.forEach(node => {
            node.children.sort((a, b) => a.level - b.level);
        });
        
        roots.sort((a, b) => a.level - b.level);

        return roots;
    };

    const treeData = buildTree(data);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const wrapperRef = useRef(null);
    const contentRef = useRef(null);

    // Initial fit-to-screen logic
    const fitToScreen = () => {
        if (wrapperRef.current && contentRef.current) {
            const wrapperWidth = wrapperRef.current.clientWidth;
            const contentWidth = contentRef.current.scrollWidth;
            // Only scale down if the content is wider than the wrapper
            if (contentWidth > wrapperWidth) {
                const newScale = (wrapperWidth - 80) / contentWidth;
                setScale(newScale < 0.2 ? 0.2 : newScale);
            } else {
                setScale(1);
            }
            setPosition({ x: 0, y: 0 });
        }
    };

    useEffect(() => {
        if (treeData.length > 0) {
            // Slight delay to ensure DOM is fully rendered before calculating widths
            setTimeout(fitToScreen, 100);
        }
    }, [data]);

    // Handle Wheel for Zooming
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            const scaleAmount = -e.deltaY * 0.0015;
            setScale(s => Math.min(Math.max(0.15, s + scaleAmount), 2.5));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const onMouseDown = (e) => {
        // Prevent dragging if clicking on buttons
        if (e.target.closest('button')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    if (treeData.length === 0) {
        return (
            <div className="text-center py-16 text-slate-450 dark:text-slate-500 bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm">
                <p className="font-bold">لا توجد بيانات للعرض الشجري</p>
            </div>
        );
    }

    return (
        <div 
            ref={wrapperRef}
            className={`w-full overflow-hidden bg-white dark:bg-[#0f141a] rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-lg relative h-[calc(100vh-280px)] min-h-[500px] select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} 
            style={{ direction: 'rtl' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.25] pointer-events-none rounded-[2rem]" />
            
            {/* Control Panel */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 z-50">
                <button onClick={() => setScale(s => Math.min(s + 0.2, 2.5))} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="تكبير">
                    <ZoomIn size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                <button onClick={fitToScreen} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2" title="الاحتواء في الشاشة">
                    <Maximize size={18} />
                    <span className="text-xs font-bold hidden sm:block px-1">احتواء</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                <button onClick={() => setScale(s => Math.max(s - 0.2, 0.15))} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="تصغير">
                    <ZoomOut size={18} />
                </button>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold pointer-events-none z-40">
                <MousePointer2 size={14} />
                <span>اسحب للتحريك • استخدم العجلة للتكبير</span>
            </div>

            {/* Transform Container */}
            <div 
                className="absolute inset-0 flex justify-center items-start origin-top"
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
            >
                <div ref={contentRef} className="min-w-max flex justify-center gap-10 sm:gap-16 pt-16 pb-20 px-20">
                    {treeData.map(root => (
                        <TreeNode key={root.id} node={root} />
                    ))}
                </div>
            </div>
        </div>
    );
}
