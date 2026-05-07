import React from "react";

const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900">
        {title}
      </h1>

      {subtitle && (
        <p className="text-slate-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;