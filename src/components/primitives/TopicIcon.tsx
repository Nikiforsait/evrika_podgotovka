import {
  Calculator,
  CheckSquare,
  ChevronsLeftRight,
  Circle,
  Diamond,
  Dices,
  Equal,
  FunctionSquare,
  Grid3x3,
  Layers,
  LineChart,
  MoveHorizontal,
  PieChart,
  Ruler,
  Sigma,
  Square,
  Superscript,
  Table,
  TrendingUp,
  Triangle,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  table: Table,
  layers: Layers,
  ruler: Ruler,
  square: Square,
  calculator: Calculator,
  'pie-chart': PieChart,
  'move-horizontal': MoveHorizontal,
  superscript: Superscript,
  equal: Equal,
  dices: Dices,
  'line-chart': LineChart,
  'function-square': FunctionSquare,
  'chevrons-left-right': ChevronsLeftRight,
  'trending-up': TrendingUp,
  triangle: Triangle,
  circle: Circle,
  diamond: Diamond,
  grid: Grid3x3,
  'check-square': CheckSquare,
};

export function TopicIcon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Sigma;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
