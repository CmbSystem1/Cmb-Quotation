export default function Select({
  children,
  className = "",
  ...props
}) {
  return (
    <select
      {...props}
      className={`
        border
        border-slate-300
        rounded-xl
        px-4
        py-2.5
        text-sm
        bg-white
        outline-none
        focus:ring-2
        focus:ring-slate-300
        ${className}
      `}
    >
      {children}
    </select>
  );
}