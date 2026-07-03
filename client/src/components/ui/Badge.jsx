import React from 'react';

const Badge = ({ children, variant = 'default' }) => {
  const baseStyle = "px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit";
  
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    brand: "bg-[#e5f7e3] text-[#1a4a15]"
  };

  return (
    <span className={`${baseStyle} ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
};

export default Badge;
