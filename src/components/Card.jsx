import React from 'react';

const Card = ({ children, title, icon: Icon, value, className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
          {Icon && (
            <div className="p-2 bg-primary-50 rounded-lg">
              <Icon className="text-primary-600 w-5 h-5" />
            </div>
          )}
        </div>
      )}
      {value && <div className="text-3xl font-bold text-gray-800">{value}</div>}
      {children}
    </div>
  );
};

export default Card;
