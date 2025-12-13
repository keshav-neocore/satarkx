import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label: string;
  type?: string;
  icon: LucideIcon;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, type = 'text', icon: Icon, placeholder, value, onChange }) => {
  return (
    <div className="w-full space-y-2">
      <label className="text-slate-text font-bold text-sm ml-2 tracking-wide uppercase opacity-70">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-mint-500 group-focus-within:text-mint-700 transition-colors duration-300">
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-mint-50 text-slate-text rounded-2xl py-4 pl-14 pr-4 
                     shadow-soft-inner border-2 border-transparent 
                     focus:border-mint-400 focus:bg-white focus:outline-none 
                     placeholder-mint-300 font-semibold transition-all duration-300"
        />
      </div>
    </div>
  );
};

export default InputField;