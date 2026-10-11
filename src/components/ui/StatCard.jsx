import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
export function StatCard({
  icon: Icon,
  title,
  value,
  detail = "Datos actuales",
  tone = "blue",
}) {
  return (
    <GlassCard className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="icon-capsule">
          <Icon size={20} />
        </span>
        <ArrowUpRight size={16} className="muted" />
      </div>
      <p className="stat-label">{title}</p>
      <strong className="stat-value">{value}</strong>
      <div className="stat-detail">
        <span className="status-dot" />
        {detail}
      </div>
    </GlassCard>
  );
}
