"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { User, Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await login(formData);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F6F9] relative overflow-hidden font-sans">
      
      {/* Decorative Outer Background Elements matching the soft vibe of the image */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-red-500/20 to-orange-400/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-gray-900/20 to-red-900/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/4 right-[10%] w-32 h-32 bg-red-500/10 rounded-full blur-[40px]"></div>
      <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-orange-400/10 rounded-full blur-[60px]"></div>

      {/* Main Card with inner padding */}
      <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-3xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] p-5 relative z-10 mx-4">
        
        {/* Inner Container */}
        <div className="w-full h-full flex rounded-2xl overflow-hidden">
          
          {/* Left Side: Form */}
          <div className="w-1/2 bg-[#F9FAFB] flex flex-col justify-center items-center relative">
            <div className="w-full max-w-[300px] flex flex-col items-center">
              
              {/* Logo */}
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shadow-lg shadow-gray-200/50">
                  <Logo className="w-7 h-7" />
                </div>
                <span className="font-bold text-[20px] tracking-widest text-gray-800 uppercase">Fabric Nation</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="w-full space-y-5">
                
                {/* Username Input */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    name="username"
                    type="text" 
                    placeholder="Username" 
                    className="w-full pl-11 pr-4 py-3.5 bg-white rounded-full text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C80018]/20 shadow-[0_4px_15px_rgba(0,0,0,0.03)] transition-all border border-transparent focus:border-[#C80018]/20"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    name="password"
                    type="password" 
                    placeholder="Password" 
                    className="w-full pl-11 pr-4 py-3.5 bg-white rounded-full text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C80018]/20 shadow-[0_4px_15px_rgba(0,0,0,0.03)] transition-all border border-transparent focus:border-[#C80018]/20 tracking-wider"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && <p className="text-xs font-semibold text-red-500 text-center">{error}</p>}

                {/* Forgot Password */}
                <div className="w-full flex justify-start px-2 pt-1">
                  <span className="text-[11px] font-bold text-[#C80018] hover:text-[#900010] cursor-pointer transition-colors">
                    Forgot Password?
                  </span>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-center">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-[140px] py-3 bg-[#1D1E27] hover:bg-[#2A2C38] text-white text-sm font-bold rounded-full shadow-[0_8px_20px_rgba(29,30,39,0.3)] transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {loading ? "..." : "Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: Visual Abstract Background */}
          <div className="w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1D1E27] to-[#12131A] flex flex-col justify-center px-16">
            
            {/* Abstract Decorative Elements (Matching Theme Colors: #1D1E27 & #C80018) */}
            <div className="absolute inset-0 z-0 opacity-90">
              {/* Large Pill 1 */}
              <div className="absolute w-[800px] h-[90px] bg-gradient-to-r from-[#2A2C38] to-transparent rotate-[-35deg] rounded-full top-[10%] -left-[15%]"></div>
              {/* Large Red Pill */}
              <div className="absolute w-[600px] h-[110px] bg-gradient-to-r from-[#C80018] to-[#FF0000]/80 rotate-[-35deg] rounded-full top-[35%] -left-[5%] shadow-2xl shadow-black/40"></div>
              {/* Darker Pill */}
              <div className="absolute w-[700px] h-[80px] bg-gradient-to-r from-[#12131A] to-[#1D1E27] rotate-[-35deg] rounded-full top-[60%] left-[5%] shadow-xl shadow-black/30"></div>
              {/* Smaller Red Pill */}
              <div className="absolute w-[400px] h-[60px] bg-gradient-to-r from-[#C80018]/80 to-transparent rotate-[-35deg] rounded-full bottom-[10%] right-[5%]"></div>
              {/* Accent Circles */}
              <div className="absolute w-[70px] h-[70px] bg-gradient-to-br from-[#C80018] to-[#FF0000] rounded-full top-[15%] right-[20%] shadow-lg shadow-red-900/40"></div>
              <div className="absolute w-[100px] h-[100px] bg-[#2A2C38] rounded-full bottom-[25%] left-[15%] shadow-xl shadow-black/30"></div>
              <div className="absolute w-[40px] h-[40px] bg-gradient-to-tr from-[#FF0000] to-transparent rounded-full bottom-[10%] left-[30%] opacity-60"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col gap-2 -mt-10">
              <h1 className="text-[42px] font-bold text-white tracking-tight leading-tight">
                Let&apos;s Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 font-extrabold">Started</span>
              </h1>
              <p className="text-[#A0AEC0] text-sm font-medium">
                Login to access your account
              </p>
            </div>

            {/* Copyright */}
            <div className="absolute bottom-8 right-8 z-10 flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
              <span>© Copyrights Fabric Nation</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

