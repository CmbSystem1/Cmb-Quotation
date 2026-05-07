import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
}) => {

  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",

    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        px-4 py-2
        rounded-xl
        text-sm
        font-medium
        transition-all
        duration-200
        shadow-sm
        ${styles[variant]}
      `}
    >
      {children}
    </button>
  );
};

export default Button;