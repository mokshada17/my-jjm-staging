import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { useMediaQuery } from "@/shared/hooks";
import { cn } from "@/shared/utils";
import { useAuth } from "../hooks/useAuth";
import { LoginForm, type LoginFormData } from "../components/LoginForm";
import { IMAGES } from "@/shared/assets/images";
import {
  FlowIcon,
  LocationPinIcon,
  BarsIcon,
  NotificationBellIcon,
  LionCapitalIcon,
} from "@/shared/assets/icons";

/**
 * The hero sits beside the sign-in card on desktops, and on landscape tablets and
 * small laptops from 1024px. Anything narrower, or held in portrait (a 1024px iPad
 * Pro included), stacks: the sign-in card alone and centred, so it is never below
 * the fold, with the features as a row of chips under it on tablets.
 */
const SPLIT_LAYOUT = "(min-width: 1280px), (min-width: 1024px) and (orientation: landscape)";

const featurePillars: { title: string; desc: string; iconBg: string; icon: ReactNode }[] = [
  {
    title: "IoT Operations Hub",
    desc: "Monitor Flow, Pressure, Chlorine and Sensor Health across infrastructure.",
    iconBg: "bg-[#0A2640] border border-[#164366]",
    icon: (
      <FlowIcon
        width="2.1875rem"
        height="1.40625rem"
        topColor="#24D2FF"
        middleColor="#2FA4C1"
        bottomColor="#10B981"
      />
    ),
  },
  {
    title: "GIS Intelligence",
    desc: "Visualize schemes, ESR assets, villages and distribution networks on interactive maps.",
    iconBg: "bg-[#09302C] border border-[#13544D]",
    icon: <LocationPinIcon width="1.75rem" height="1.75rem" color="#10B981" />,
  },
  {
    title: "Performance Analytics",
    desc: "Track LPCD, water consumption, service availability and compliance KPIs.",
    iconBg: "bg-[#11244A] border border-[#1D3D7A]",
    icon: <BarsIcon width="1.75rem" height="1.75rem" />,
  },
  {
    title: "Smart Alerts",
    desc: "Instant notifications for communication failures, low pressure and anomalies.",
    iconBg: "bg-[#33220A] border border-[#5C3E14]",
    icon: <NotificationBellIcon width="1.75rem" height="1.75rem" color="#F59E0B" />,
  },
];

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  // jsdom has no matchMedia: tests get the desktop layout.
  const split = useMediaQuery(SPLIT_LAYOUT, true);

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // Figma prototype navigation flow: signin transitions to landing-page
      navigate("/landing");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const background = (
    <div
      className="fixed inset-0 bg-cover bg-center z-0"
      style={{ backgroundImage: `url(${IMAGES.loginPageBackgroundPng})` }}
    />
  );

  const signInCard = (className?: string) => (
    <div
      className={cn(
        "relative z-10 w-full text-center bg-[#1E2638]/60 border border-[#26354D]/90 rounded-2xl shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      <div className="mb-2 xl:mb-3 flex items-center justify-center">
        <LionCapitalIcon
          variant="vector"
          title="Government of Maharashtra"
          className="h-9 w-auto object-contain"
        />
      </div>

      <h2 className="text-lg font-bold tracking-wide mb-1">
        Government of Maharashtra
      </h2>
      <p className="text-xs sm:text-sm lg:text-[0.6875rem] xl:text-sm text-slate-300 mt-0.5 lg:whitespace-nowrap">
        Water Supply & Sanitation Department | Jal Jeevan Mission
      </p>

      <div className="mt-6 mb-6 md:mt-5 md:mb-5 lg:mt-4 lg:mb-4 xl:mt-8 xl:mb-7">
        <h3 className="text-3xl font-bold tracking-tight">Welcome Back</h3>
        <p className="text-xs sm:text-sm lg:text-[0.6875rem] xl:text-sm text-slate-300 mt-2 lg:whitespace-nowrap">
          Sign in to your Unified Water Intelligence Platform account.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-left">
          {error.message || "Invalid credentials. Please try again."}
        </div>
      )}

      <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );

  if (!split) {
    // Phones and portrait tablets: the sign-in card alone, centred. Its own emblem
    // and department lines are the page's only branding here.
    return (
      <div className="relative min-h-dvh w-full flex flex-col items-center justify-center gap-6 px-4 py-6 sm:p-8 bg-[#0E1526] text-white selection:bg-jjm-cyan/30">
        {background}
        {signInCard("max-w-[27.5rem] md:max-w-[30rem] p-6 sm:p-8")}

        {/* Tablets: the four features as chips, icon and title only. */}
        <ul aria-label="Platform features" className="relative z-10 hidden md:flex flex-wrap justify-center gap-2 max-w-[46rem]">
          {featurePillars.map((feature) => (
            <li
              key={feature.title}
              className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#091526]/50 border border-white/10 backdrop-blur-md text-xs font-semibold whitespace-nowrap"
            >
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4", feature.iconBg)}>
                {feature.icon}
              </span>
              {feature.title}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-row bg-[#0E1526] text-white selection:bg-jjm-cyan/30">
      {background}
      {/* Left Panel: Vibrant Scenic Reservoir Hero (Figma 1:14812) */}
      <div className="relative z-10 flex-1 xl:flex-[5.5] min-w-0 flex flex-col justify-between p-8 xl:p-12 min-h-screen">

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3.5">
          {/* The solid gold "sculpture" variant, cropped tight to the emblem so it fills
              the header height. lion_capital_of_india_Gold.png is the same artwork with
              wide transparent margins, which rendered at roughly half size here. */}
          <LionCapitalIcon variant="sculpture" height="2.5rem" title="Emblem of India" />
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white drop-shadow-sm">
              Government of Maharashtra
            </h2>
            <p className="text-xs text-white/85 font-medium drop-shadow-sm">
              Water Supply & Sanitation Department | Jal Jeevan Mission
            </p>
          </div>
        </div>

        {/* Hero Headline & 4 Feature Pillars */}
        <div className="relative z-10 my-auto w-full py-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-md text-white mb-6 shadow-sm">
            <span>Enterprise Water Intelligence Platform</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
            Unified Water
            <br />
            Intelligence <span className="text-jjm-cyan">Platform</span>
          </h1>

          <p className="text-sm xl:text-base text-white/90 font-normal leading-relaxed mt-5 drop-shadow">
            Real-time monitoring, geospatial intelligence, and performance
            analytics for Maharashtra Jal Jeevan Mission infrastructure.
          </p>

          {/* Feature cards: a 2x2 grid with descriptions on desktops; below 1280px
              (landscape tablets) a compact list of icon and title, so no title or
              description wraps in a narrow card. */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 xl:gap-6 mt-8 xl:mt-10 max-xl:max-w-lg items-stretch">
            {featurePillars.map((feature) => (
              <Card
                key={feature.title}
                className="h-full p-3.5 xl:p-7 rounded-xl text-white bg-[#091526]/40 hover:bg-[#0c1c33]/50 border border-white/5 backdrop-blur-md transition-all shadow-md flex items-center gap-3 xl:gap-5"
              >
                <div
                  className={cn(
                    "w-10 h-10 xl:w-14 xl:h-14 rounded-lg xl:rounded-xl flex items-center justify-center flex-shrink-0 max-xl:[&>svg]:w-5 max-xl:[&>svg]:h-5",
                    feature.iconBg,
                  )}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-[0.9375rem] xl:text-lg font-bold text-white tracking-wide xl:mb-2">
                    {feature.title}
                  </h3>
                  <p className="hidden xl:block text-sm text-slate-300 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {/* Right Panel: the sign-in card - a fixed 432px column on landscape tablets,
          the larger share of the width on desktops. */}
      <div className="relative z-10 flex-none w-[27rem] xl:w-auto xl:flex-[4.5] flex flex-col justify-center p-6 xl:p-10">
        {signInCard("max-w-xl mx-auto p-7 xl:p-11")}
      </div>
    </div>
  );
}



// import { useNavigate } from "react-router-dom";
// import { Card } from "@/shared/components/ui";
// import { useAuth } from "../hooks/useAuth";
// import { LoginForm, type LoginFormData } from "../components/LoginForm";
// import { IMAGES } from "@/shared/assets/images";
// import {
//   FlowIcon,
//   LocationPinIcon,
//   BarsIcon,
//   NotificationBellIcon,
//   LionCapitalIcon,
// } from "@/shared/assets/icons";

// export function LoginPage() {
//   const { login, isLoading, error } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (data: LoginFormData) => {
//     try {
//       await login(data);
//       // Figma prototype navigation flow: signin transitions to landing-page
//       navigate("/landing");
//     } catch (err) {
//       console.error("Login failed:", err);
//     }
//   };

//   const featurePillars = [
//     {
//       title: "IoT Operations Hub",
//       desc: "Monitor Flow, Pressure, Chlorine and Sensor Health across infrastructure.",
//       iconBg: "bg-[#0A2640] border border-[#164366]",
//       icon: (
//         <FlowIcon
//           width="1.75rem"
//           height="1.125rem"
//           topColor="#24D2FF"
//           middleColor="#2FA4C1"
//           bottomColor="#10B981"
//         />
//       ),
//     },
//     {
//       title: "GIS Intelligence",
//       desc: "Visualize schemes, ESR assets, villages and distribution networks on interactive maps.",
//       iconBg: "bg-[#09302C] border border-[#13544D]",
//       icon: <LocationPinIcon width="1.375rem" height="1.375rem" color="#10B981" />,
//     },
//     {
//       title: "Performance Analytics",
//       desc: "Track LPCD, water consumption, service availability and compliance KPIs.",
//       iconBg: "bg-[#11244A] border border-[#1D3D7A]",
//       icon: <BarsIcon width="1.375rem" height="1.375rem" />,
//     },
//     {
//       title: "Smart Alerts",
//       desc: "Instant notifications for communication failures, low pressure and anomalies.",
//       iconBg: "bg-[#33220A] border border-[#5C3E14]",
//       icon: <NotificationBellIcon width="1.375rem" height="1.375rem" color="#F59E0B" />,
//     },
//   ];

//   return (
//     <div className="min-h-screen w-full flex flex-col lg:flex-row bg-jjm-light-bg text-slate-900 dark:bg-[#0E1526] dark:text-white selection:bg-jjm-cyan/30">
//       {/* Left Panel: Vibrant Scenic Reservoir Hero (Figma 1:14812) */}
//       <div className="relative lg:flex-[5.5] flex-1 flex flex-col justify-between p-8 lg:p-12 overflow-hidden min-h-[36.25rem] lg:min-h-screen">
//         {/* Background photo showing clear blue sky and mountains */}
//         <div
//           className="absolute inset-0 bg-cover bg-center z-0 scale-100 transition-transform duration-1000"
//           style={{ backgroundImage: `url(${IMAGES.loginPageBackgroundPng})` }}
//         />
//         {/* Transparent gradient wash preserving landscape clarity */}
//         <div className="absolute inset-0 bg-gradient-to-t from-[#000F26]/95 via-[#001026]/40 to-[#001433]/50 z-0 pointer-events-none" />

//         {/* Header Branding */}
//         <div className="relative z-10 flex items-center justify-between">
//           <div className="flex items-center gap-3.5">
//             <div className="w-12 h-12 rounded-xl avtar-bg shadow-md flex items-center justify-center p-1.5 backdrop-blur-sm">
//               {/* <img
//                 src={IMAGES.  lionCapitalBlack}
//                 alt="Government of Maharashtra"
//                 className="h-9 w-auto object-contain"
//               /> */}

//               <LionCapitalIcon
//                 variant="vector"
//                 // width="2.5rem"
//                 // height="3.5rem"
//                 title="Government of Maharashtra"
//                 className="h-9 w-auto object-contain"
//               />
//             </div>
//             <div>
//               <h2 className="text-sm font-bold tracking-wide text-white drop-shadow-sm">
//                 Government of Maharashtra
//               </h2>
//               <p className="text-xs text-white/85 font-medium drop-shadow-sm">
//                 Water Supply & Sanitation Department | Jal Jeevan Mission
//               </p>
//             </div>
//           </div>

//           {/* Top-Right Maharashtra outline with "Har Ghar Jal Har Ghar Sujal"
//           <div className="hidden sm:flex flex-col items-center opacity-85 select-none pr-4">
//             <svg viewBox="0 0 100 80" className="w-24 h-20 fill-white/10 stroke-white/30 stroke-1">
//               <path d="M 30 10 Q 55 5 75 15 T 90 40 T 70 70 T 35 65 T 15 45 Z" />
//             </svg>
//             <div className="text-[0.6875rem] font-bold text-white text-center italic tracking-wider -mt-10 drop-shadow">
//               Har Ghar Jal<br />Har Ghar Sujal
//             </div>
//           </div> */}
//         </div>

//         {/* Hero Headline & 4 Feature Pillars */}
//         <div className="relative z-10 my-auto py-8 max-w-2xl">
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-md text-white mb-4 shadow-sm">
//             <span>Enterprise Water Intelligence Platform</span>
//           </div>

//           <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
//             Unified Water
//             <br />
//             Intelligence <span className="text-jjm-cyan">Platform</span>
//           </h1>

//           <p className="text-sm sm:text-base text-white/90 font-normal leading-relaxed mt-4 drop-shadow">
//             Real-time monitoring, geospatial intelligence, and performance
//             analytics for Maharashtra Jal Jeevan Mission infrastructure.
//           </p>

//           {/* 2x2 Feature Cards Grid */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 items-stretch">
//             {featurePillars.map((feature, idx) => (
//               <Card
//                 key={idx}
//                 className="h-full p-6 rounded-xl text-white bg-[#091526]/40 hover:bg-[#0c1c33]/50 border border-white/5 backdrop-blur-md transition-all shadow-md flex items-center gap-3"
//               >
//                 <div
//                   className={`p-2.5 rounded-lg flex-shrink-0 ${feature.iconBg}`}
//                 >
//                   {feature.icon}
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-bold text-white tracking-wide mb-1">
//                     {feature.title}
//                   </h3>
//                   <p className="text-[0.6875rem] text-slate-300 leading-relaxed">
//                     {feature.desc}
//                   </p>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         </div>

//         {/* Left Footer Legal Notice */}
//         <div className="relative z-10 pt-4 flex items-center justify-between gap-6 text-xs text-white/80">
//           <p className="text-[0.6875rem]">
//             Government of Maharashtra | Water Supply & Sanitation Department
//             (WSSD) | Jal Jeevan Mission
//           </p>
//           <img
//             src={IMAGES.harGharJalTextIcon}
//             alt="Har Ghar Jal"
//             className="h-7 object-contain"
//           />
//         </div>
//       </div>

//       {/* Right Panel: Authentication Form (Solid Dark Navy #1E2638 matching Figma 1:14812) */}
//       <div className="w-full lg:flex-[4.5] lg:w-[28.75rem] xl:w-[30rem] flex-shrink-0 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-gradient-to-r from-white via-jjm-light-surface to-jjm-light-bg border-l border-slate-200 shadow-2xl z-10 dark:from-[#1E2638] dark:via-jjm-surface dark:to-jjm-canvas dark:border-[#26354D]">
//       {/* <div className="w-full lg:flex-[4.5] lg:w-[28.75rem] xl:w-[30rem] flex-shrink-0 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white border-l border-slate-200 shadow-2xl z-10 dark:bg-[#1E2638] dark:border-[#26354D]"> */}
//         <div className="my-auto py-0 max-w-lg w-full mx-auto text-center">
//           {/* Centered White Emblem Card */}
//           <div className="w-14 h-14 avtar-bg rounded-xl shadow-lg flex items-center justify-center p-2 mx-auto mb-2">
//             {/* <img
//               src={IMAGES.lionCapitalGold}
//               alt="Government of Maharashtra"
//               className="h-14 w-auto object-contain"
//             /> */}

//             <LionCapitalIcon
//                 variant="vector"
//                 // width="2.5rem"
//                 // height="3.5rem"
//                 title="Government of Maharashtra"
//                 className="h-9 w-auto object-contain"
//               />
//           </div>

//           <h2 className="text-lg font-bold tracking-wide">
//             Government of Maharashtra
//           </h2>
//           <p className="text-base text-slate-400 mt-0.5">
//             Water Supply & Sanitation Department | Jal Jeevan Mission
//           </p>

//           <div className="mt-4 mb-4">
//             <h3 className="text-3xl font-bold tracking-tight">Welcome Back</h3>
//             <p className="text-base text-slate-400 mt-1">
//               Sign in to your Unified Water Intelligence Platform account.
//             </p>
//           </div>

//           {error && (
//             <div className="mb-4 p-4 text-sm bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-left">
//               {error.message || "Invalid credentials. Please try again."}
//             </div>
//           )}

//           <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
//         </div>

//         {/* Bottom Helpdesk Row */}
//         <div className="pt-3 text-center text-sm text-slate-400">
//           <span>Don't have an account? </span>
//           <a
//             href="#contact"
//             onClick={(e) => {
//               e.preventDefault();
//               alert(
//                 "Please contact the WSSD State Control Room at support@jjm.maharashtra.gov.in",
//               );
//             }}
//             className="font-semibold a-text hover:underline"
//           >
//             Contact Administrator
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// }
