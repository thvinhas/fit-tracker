const Card = ({ children, className = "", highlighted = false }) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200
        ${highlighted ? "border-2 border-indigo-500 bg-indigo-50" : "border border-gray-200"}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
