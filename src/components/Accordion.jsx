import { useState } from "react";

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <span className="font-medium text-zinc-200 text-sm">{title}</span>
        <svg
          className={`w-5 h-5 text-zinc-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-white/10 bg-zinc-950/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;
