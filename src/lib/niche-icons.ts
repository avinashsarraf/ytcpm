import {
  Landmark, Scale, Briefcase, TrendingUp, Home, Cpu, HeartPulse, GraduationCap,
  Car, ChefHat, Sparkles, Plane, Palette, Clapperboard, Music, Gamepad2, Camera, Baby,
  type LucideIcon,
} from "lucide-react";

/** Shared icon map — safe to import from BOTH server and client components. */
export const NICHE_ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  scale: Scale,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  home: Home,
  cpu: Cpu,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  car: Car,
  "chef-hat": ChefHat,
  sparkles: Sparkles,
  plane: Plane,
  palette: Palette,
  clapperboard: Clapperboard,
  music: Music,
  "gamepad-2": Gamepad2,
  camera: Camera,
  baby: Baby,
};
