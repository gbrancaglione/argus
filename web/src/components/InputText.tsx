import { forwardRef, useState, type InputHTMLAttributes } from "react";

type InputTextProps = {
  label: string;
  helperText?: string;
  error?: string;
  optional?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  ({ label, helperText, error, optional, disabled, type, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const borderClass = error
      ? "border-status-error"
      : focused
        ? "border-2 border-brand-primary"
        : "border-neutral-light";

    const bgClass = disabled ? "bg-neutral-lightest" : "bg-neutral-white";

    return (
      <div className="w-full">
        {/* Label row */}
        <div className="flex justify-between pb-1">
          <label
            className={`text-base leading-[18.75px] ${
              error
                ? "text-status-error"
                : disabled
                  ? "text-neutral-light"
                  : "text-neutral-darkest"
            }`}
          >
            {label}
          </label>
          {optional && (
            <span
              className={`text-sm leading-[16.41px] ${
                error
                  ? "text-status-error"
                  : disabled
                    ? "text-neutral-light"
                    : "text-neutral-dark"
              }`}
            >
              Opcional
            </span>
          )}
        </div>

        {/* Input field */}
        <div
          className={`flex items-center gap-2 rounded-lg border ${borderClass} ${bgClass} h-12 px-4`}
        >
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={`flex-1 bg-transparent outline-none text-base leading-[18.75px] placeholder:text-neutral-light ${
              disabled ? "text-neutral-light cursor-not-allowed" : "text-neutral-darkest"
            }`}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {isPassword && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="flex-shrink-0"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className={
                  error
                    ? "text-status-error"
                    : focused
                      ? "text-brand-primary"
                      : "text-neutral-dark"
                }
              >
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Helper / Error text */}
        {(error || helperText) && (
          <p
            className={`pt-1 text-xs leading-[14.06px] ${
              error ? "text-status-error" : "text-neutral-darkest"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

InputText.displayName = "InputText";
export default InputText;
