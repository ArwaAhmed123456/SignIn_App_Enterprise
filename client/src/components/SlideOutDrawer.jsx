import React, { useEffect } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

const SlideOutDrawer = ({ isOpen, onClose, title, children, actions }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1">
              <button className="hover:text-slate-600"><ArrowUp size={18} /></button>
              <button className="hover:text-slate-600"><ArrowDown size={18} /></button>
            </div>
            <button onClick={onClose} className="hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
        
      </div>
    </>
  );
};

export default SlideOutDrawer;
