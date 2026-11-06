import { useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberDevice: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // Both fields already show these hints via `placeholder`. Seeding them as values
      // meant the form submitted the bullet string as a real password.
      email: "",
      password: "",
      rememberDevice: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-3 lg:space-y-3 xl:space-y-5 w-full">
      {/* Government Email Field */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="email"
          className="block text-sm md:text-xs lg:text-xs xl:text-sm font-semibold text-white"
        >
          Government Email Address
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input 
            id="email"
            type="email"
            placeholder="name@maharashtra.gov.in"
            {...register("email")}
            style={{ "--login-input-bg": "#ffffff", "--login-input-text": " #0F1B2D" } as CSSProperties}
            className="w-full pl-10 pr-3 py-3 md:py-2.5 lg:py-2.5 xl:py-3 text-base rounded-lg border border-[#293E66] bg-[#0F1B2D] text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-jjm-cyan focus:border-jjm-cyan transition"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-400 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="password"
          className="block text-sm md:text-xs lg:text-xs xl:text-sm font-semibold text-white"
        >
          Password
        </label>
        <div className="relative flex items-center">
          <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            {...register("password")}
            style={{ "--login-input-bg": " #ffffff", "--login-input-text": "#0F1B2D" } as CSSProperties}
            className="w-full pl-10 pr-10 py-3 md:py-2.5 lg:py-2.5 xl:py-3 text-base rounded-lg border border-[#293E66] bg-[#0F1B2D] text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-jjm-cyan focus:border-jjm-cyan transition"
          />
          <Button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 text-slate-400 hover:bg-transparent bg-inherit focus:ring-0 focus:outline-none p-0.5 rounded transition"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-400 font-medium">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Device & Forgot Password */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer text-sm md:text-xs lg:text-xs xl:text-sm text-slate-300 select-none">
          <input
            type="checkbox"

            {...register("rememberDevice")}
            className="login-checkbox accent-[#1E6B8A] h-4 w-4 rounded focus:ring-jjm-cyan"
          />
          <span className ="text-sm md:text-xs lg:text-xs xl:text-sm text-slate-300">Remember this device</span>
        </label>
        <a
          href="#forgot"
          onClick={(e) => {
            e.preventDefault();
            alert("Please contact your IT System Administrator to reset your password.");
          }}
          className="text-sm md:text-xs lg:text-xs xl:text-sm font-semibold text-jjm-cyan hover:underline"
        >
          Forgot Password?
        </a>
      </div>

      {/* Sign In Button (Exact vibrant cyan from Figma 1:14812) */}
      <Button
        id="signin-btn"
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 h-12 text-base font-bold rounded-lg border border-jjm-blue-light bg-jjm-blue-light text-white hover:bg-[#175a73] hover:border-[#175a73] active:scale-[0.99] shadow-md transition-all"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-2 md:py-1 lg:py-1 xl:py-2">
        <div className="flex-1 h-px bg-[#465672]" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">OR</span>
        <div className="flex-1 h-px bg-[#465672]" />
      </div>

      {/* Login with Google Account Button */}
      <Button
        type="button"
        onClick={() => {
          onSubmit({
            email: "name@maharashtra.gov.in",
            password: "Password@123",
            rememberDevice: true,
          });
        }}
        className="w-full py-3.5 h-12 text-sm font-semibold rounded-lg border border-jjm-blue-light bg-jjm-blue-light hover:bg-[#175a73] hover:border-[#175a73] text-white flex items-center justify-center gap-2.5 transition active:scale-[0.99]"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Login with Google Account</span>
      </Button>

      {/* Security Audit Banner */}
          <div className="flex items-start gap-2.5 p-4 lg:p-3 xl:p-4 rounded-lg border border-[#293E66] text-sm lg:text-xs xl:text-sm leading-relaxed text-slate-300 mt-3 text-left">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-sm md:text-xs lg:text-xs xl:text-sm text-slate-300">
          Authorized government access only. All sessions, user events and telemetry queries are fully audited.
        </span>
      </div>

      <div>
         <p className="xs:flex-1 sm:text-center text-sm xl:text-base">
          Don't have an account?{" "}
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              alert(
                "Please contact the WSSD State Control Room at support@jjm.maharashtra.gov.in",
              );
            }}
            // Kept on one line: the link wraps as a whole, never mid-name.
            className="font-semibold text-jjm-cyan hover:underline whitespace-nowrap"
          >
            Contact Administrator
          </a>
        </p>
      </div>
    </form>
  );
}