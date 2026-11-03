import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  ChevronDown,
  CheckCircle2,
  Cpu,
  Activity,
  Droplets,
  Home,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMediaQuery } from "@/shared/hooks";
import { cn } from "@/shared/utils";
import { IMAGES } from "@/shared/assets/images";
import {
  FlowIcon,
  LocationPinIcon,
  BarsIcon,
  LionCapitalIcon,
} from "@/shared/assets/icons";

/**
 * The portals sit as three cards in a row on desktops, and on landscape tablets
 * and small laptops from 1024px (compacted below 1280px). Narrower screens, or any
 * held in portrait (a 1024px iPad Pro included), list them as full-width rows -
 * never two cards and an orphan.
 */
const CARD_LAYOUT = "(min-width: 1280px), (min-width: 1024px) and (orientation: landscape)";

const PORTAL_SURFACE =
  "text-slate-900 bg-white/95 hover:bg-white border border-slate-200 backdrop-blur-md shadow-2xl transition-all cursor-pointer dark:text-white dark:bg-[#08162B]/60 dark:hover:bg-[#0A1B36]/90 dark:border-white/10";

/** The most the landing content is enlarged to fill a tall screen. */
const MAX_FILL = 1.5;

/**
 * Enlarges the page's content as a whole - text, icons, padding, cards and tiles
 * alike - until it fills the screen's height between the header and the footer,
 * so a tall screen shows larger components rather than an empty band. `zoom`
 * reflows the content at the larger size, so it still fits the width. Never
 * below the designed size: a screen shorter than the content scrolls as before.
 * (The app-wide screen fit only ever shrinks a page, and only from 1280px.)
 */
function useFillHeight() {
  const pageRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const area = areaRef.current;
    const content = contentRef.current;
    if (!page || !area || !content || typeof ResizeObserver === "undefined") return;
    let frame = 0;

    const fit = () => {
      let scale = Number(content.style.zoom) || 1;
      // Zoom changes how the text wraps, so settle in a few passes.
      for (let pass = 0; pass < 4; pass++) {
        const style = getComputedStyle(area);
        const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        // The screen's height less the header and footer, whatever the content's size.
        const available = window.innerHeight - (page.offsetHeight - area.offsetHeight) - padding;
        const used = content.getBoundingClientRect().height;
        if (available <= 0 || used <= 0) return;
        // A hair under the exact fit, so rounding cannot add a 1px scrollbar.
        const next = Math.min(MAX_FILL, Math.max(1, (scale * available) / used / 1.002));
        if (Math.abs(next - scale) < 0.002) break;
        scale = next;
        content.style.zoom = String(scale);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    window.addEventListener("resize", schedule);
    // The app's screen fit changes the root size after mount; follow it.
    const observer = new ResizeObserver(schedule);
    observer.observe(page);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  return { pageRef, areaRef, contentRef };
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // jsdom has no matchMedia: tests get the desktop cards.
  const asCards = useMediaQuery(CARD_LAYOUT, true);
  const { pageRef, areaRef, contentRef } = useFillHeight();

  const portalCards = [
    {
      id: "iot-portal",
      title: "IoT Monitoring Portal",
      status: "Operational",
      statusColor: "text-jjm-green bg-jjm-green/10 border-jjm-green/40",
      desc: "Real-time monitoring of Flow Meters, Pressure Sensors and Chlorine Analyzers across village water supply schemes.",
      iconBg: "bg-jjm-blue-light/10 border border-jjm-blue-light/30 dark:bg-[#0A2640] dark:border-[#164366]",
      icon: <FlowIcon width="1.75rem" height="1.125rem" topColor="#24D2FF" middleColor="#2FA4C1" bottomColor="#10B981" />,
      features: [
        "Sensor Communication",
        "Water Quality Compliance",
        "Flow & Pressure Analytics",
        "Equipment Health",
      ],
      checkColor: "text-jjm-blue-light dark:text-jjm-cyan",
      buttonBg: "bg-jjm-blue-light hover:bg-[#175a73] text-white dark:bg-[#146A88] dark:hover:bg-[#187d9f]",
      route: "/dashboard",
    },
    {
      id: "gis-portal",
      title: "GIS Intelligence Portal",
      status: "Online",
      statusColor: "text-jjm-blue-light bg-jjm-blue-light/10 border-jjm-blue-light/40 dark:text-jjm-cyan dark:bg-jjm-cyan/10 dark:border-jjm-cyan/40",
      desc: "Geospatial visualization of schemes, reservoirs, pipelines and village infrastructure with advanced search.",
      iconBg: "bg-jjm-amber/10 border border-jjm-amber/30 dark:bg-[#33220A] dark:border-[#5C3E14]",
      icon: <LocationPinIcon width="1.375rem" height="1.375rem" color="#F59E0B" />,
      features: [
        "Asset Mapping",
        "Scheme Discovery",
        "Layer Analysis",
        "Regional Drill-down",
      ],
      checkColor: "text-jjm-amber",
      buttonBg: "bg-[#D89A14] hover:bg-[#b9810e] text-white dark:bg-[#D89A14] dark:hover:bg-[#efa917]",
      route: "/dashboard",
    },
    {
      id: "mis-portal",
      title: "MIS Analytics Portal",
      status: "Active",
      statusColor: "text-jjm-blue-light bg-jjm-blue-light/10 border-jjm-blue-light/40 dark:text-jjm-cyan dark:bg-jjm-cyan/10 dark:border-jjm-cyan/40",
      desc: "Executive reporting and decision-support dashboards for LPCD performance, water consumption and operational efficiency.",
      iconBg: "bg-jjm-blue-light/10 border border-jjm-blue-light/30 dark:bg-[#11244A] dark:border-[#1D3D7A]",
      icon: <BarsIcon width="1.375rem" height="1.375rem" />,
      features: [
        "Regional Comparisons",
        "KPI Tracking",
        "Historical Trends",
        "Downloadable Reports",
      ],
      checkColor: "text-jjm-blue-light dark:text-jjm-cyan",
      buttonBg: "bg-jjm-cyan hover:bg-[#1bc0eb] text-white dark:hover:bg-[#1bc0eb]",
      route: "/dashboard",
    },
  ];

  const statewideStats = [
    {
      label: "Connected Sensors",
      value: "389,042",
      trend: "↑ 12.4% ",
      trendMessage: "vs. last month",
      icon: <Cpu className="w-4 h-4 text-jjm-blue-light dark:text-jjm-cyan" />,
    },
    {
      label: "Active Telemetry",
      value: "8,102",
      trend: "↑ 5.2% ",
      trendMessage: "vs. last month",
      icon: <Activity className="w-4 h-4 text-jjm-green" />,
    },
    {
      label: "Water Schemes",
      value: "12,458",
      trend: "↑ 3.1% ",
      trendMessage: "vs. last month",
      icon: <Droplets className="w-4 h-4 text-jjm-blue-light dark:text-jjm-cyan" />,
    },
    {
      label: "Villages Covered",
      value: "27,000+",
      trend: "↑ 3.8% ",
      trendMessage: "vs. last month",
      icon: <Home className="w-4 h-4 text-jjm-blue-light dark:text-cyan-300" />,
    },
    {
      label: "LPCD Compliance",
      value: "92.4%",
      trend: "↑ 1.6% ",
      trendMessage: "vs. last month",

      icon: <Award className="w-4 h-4 text-jjm-green" />,
    },
    {
      label: "Critical Alerts",
      value: "4 Active",
      trend: "↓ 2 ",
      trendMessage: "vs. last month",
      isRed: true,
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    },
  ];

  return (
    <div ref={pageRef} className="relative min-h-screen min-h-dvh flex flex-col justify-between bg-[#0E1526] text-white selection:bg-jjm-cyan/30 overflow-x-hidden">
      {/* Background full-bleed photo showing clear reservoir and hills */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${IMAGES.loginPageBackgroundPng})` }}
      />
      {/* Subtle darkening gradient to preserve landscape while ensuring text contrast */}
        {/* <div className="fixed inset-0 bg-gradient-to-b from-jjm-light-bg/95 via-jjm-light-bg/75 to-jjm-light-bg/90 dark:from-jjm-canvas/90 dark:via-jjm-canvas/40 dark:to-jjm-canvas/95 z-0 pointer-events-none" /> */}

      {/* Top Branding Header Bar (Black/Midnight #0E1526) */}
        <header className="relative z-20 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2">
        {/* The solid gold "sculpture" variant, cropped tight to the emblem so it fills
            the header height. lion_capital_of_india_Gold.png is the same artwork with
            wide transparent margins, which rendered at roughly half size here. */}
        <LionCapitalIcon variant="sculpture" height="2.5rem" title="Emblem of India" />
      </div>
          <div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Government of Maharashtra
            </h1>
              <p className="text-[0.625rem] sm:text-[0.6875rem] text-white">
              Water Supply & Sanitation Department | Jal Jeevan Mission
            </p>
          </div>
        </div>

        {/* Commissioner Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1E6B8A] to-jjm-cyan p-0.5 shadow">
            <div className="w-full h-full rounded-full bg-[#1E2638] flex items-center justify-center text-xs font-bold text-white">
              C
            </div>
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white leading-tight">
                {user?.name || "Commissioner"}
              </p>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[0.625rem] text-white leading-tight">
              WSSD, Maharashtra
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {/* On a screen taller than the content, useFillHeight enlarges the content to
          fill it; centred for the last few pixels it cannot. */}
      <main ref={areaRef} className="relative z-10 flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 xl:py-8 flex flex-col justify-center">
        <div ref={contentRef} className="flex flex-col gap-8 xl:gap-10">
        {/* Hero Introduction */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Welcome, <span className="text-jjm-cyan">Commissioner</span>
          </h2>
          <p className="text-sm text-white/90 leading-relaxed font-normal max-w-2xl drop-shadow">
            Manage statewide water infrastructure through integrated IoT Monitoring, GIS Intelligence and MIS Analytics. Select a portal below to launch.
          </p>
        </div>

        {/* 3 Core Launch Portal Cards (Figma 1:14590). The whole card opens its
            portal; the button stays as the visible, keyboard-reachable action. */}
        {asCards ? (
          <div className="grid grid-cols-3 gap-4 xl:gap-6">
            {portalCards.map((portal) => (
              <Card
                key={portal.id}
                onClick={() => navigate(portal.route)}
                className={cn(PORTAL_SURFACE, "rounded-2xl p-5 xl:p-6 flex flex-col justify-between group")}
              >
                <div>
                  {/* Header & Status - one icon tile size, so every card lines up */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${portal.iconBg}`}>
                      {portal.icon}
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 px-3 py-0.5 text-xs font-semibold ${portal.statusColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {portal.status}
                    </Badge>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5 xl:mb-6">
                    {portal.desc}
                  </p>

                  {/* Key Features */}
                  <div className="space-y-2.5 mb-6">
                    <p className="text-[0.6875rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      KEY FEATURES
                    </p>
                    <div className="space-y-2">
                      {portal.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${portal.checkColor} flex-shrink-0`} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <Button
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={() => navigate(portal.route)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${portal.buttonBg}`}
                >
                  <span>Launch Portal</span>
                  <span>➔</span>
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          // Portrait tablets and phones: a full-width row per portal - icon, title and
          // status, then the full description and key features (tablets only) - with
          // Launch at the right. Phones show the arrow alone; the label stays for
          // screen readers.
          <div className="flex flex-col gap-3 md:gap-4">
            {portalCards.map((portal) => (
              <Card
                key={portal.id}
                onClick={() => navigate(portal.route)}
                className={cn(PORTAL_SURFACE, "rounded-2xl p-4 md:p-5 flex items-center gap-4 md:gap-5")}
              >
                <div className={`w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center ${portal.iconBg}`}>
                  {portal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                      {portal.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 px-2.5 py-0 text-[0.6875rem] font-semibold whitespace-nowrap ${portal.statusColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {portal.status}
                    </Badge>
                  </div>
                  <p className="hidden md:block text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {portal.desc}
                  </p>
                  {/* Key Features, as on the cards, laid out across the row */}
                  <div className="hidden md:block mt-3">
                    <p className="text-[0.6875rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      KEY FEATURES
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
                      {portal.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${portal.checkColor} flex-shrink-0`} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={() => navigate(portal.route)}
                  className={`shrink-0 h-10 px-3 md:px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${portal.buttonBg}`}
                >
                  <span className="max-md:sr-only">Launch Portal</span>
                  <span aria-hidden>➔</span>
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Statewide Infrastructure Overview Metrics */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">
                  Statewide Infrastructure Overview
                </h3>
            
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Live data from IoT sensors, GIS and MIS systems
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">    
              <Badge
                  variant="outline"
                  className="gap-1.5 px-2.5 py-0.5 text-[0.6875rem] font-bold whitespace-nowrap bg-jjm-green/10 text-jjm-green border-jjm-green/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-jjm-green animate-pulse" />
                  Live Data
                </Badge></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {statewideStats.map((stat, idx) => (
              <Card
                key={idx}
                className="p-3 xl:p-4 rounded-xl text-slate-900 bg-white/95 border border-slate-200 backdrop-blur-md shadow-md flex flex-col justify-between dark:text-white dark:bg-[#08162B]/60 dark:border-jjm-border"
              >
                <div className="flex items-center justify-between mb-1.5 xl:mb-2">
                  <div className="p-1.5 rounded-lg border border-jjm-blue-light/25 bg-jjm-blue-light/15 dark:border-white/10 dark:bg-white/5">
                    {stat.icon}
                  </div>
                  <span className="text-[0.6875rem] font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">
                    {stat.label}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className={`text-[0.625rem] font-semibold mt-0.5 ${stat.isRed ? "text-red-700" : "text-jjm-green"}`}>
                    {stat.trend}   <span className="text-slate-500 dark:text-slate-400">
                    {stat. trendMessage}
                  </span>
                  </p>
                
                </div>
              </Card>
            ))}
          </div>
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 min-h-14 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none text-jjm-cyan">🍃</span>
          <p className="text-[0.6875rem] text-white">
            Sustainable Water Infrastructure for a Healthier and Prosperous Maharashtra
          </p>
        </div>
     <img
          src={IMAGES.harGharJalTextIcon}
          alt="Har Ghar Jal"
          className="h-9 w-auto object-contain sm:ml-auto"
        />
      </footer>
    </div>
  );
}
