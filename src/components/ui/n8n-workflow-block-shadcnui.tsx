import { motion, type PanInfo } from "framer-motion";
import type React from "react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Database,
  Mail,
  Bot,
  FileSpreadsheet,
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "output";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
}

const NODE_WIDTH = 210;
const NODE_HEIGHT = 100;

const colorClasses: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  blue:   { border: "border-[#4285F4]/40", bg: "bg-[#4285F4]/10", text: "text-[#4285F4]", dot: "bg-[#4285F4]" },
  purple: { border: "border-purple-400/40", bg: "bg-purple-400/10", text: "text-purple-400", dot: "bg-purple-400" },
  amber:  { border: "border-amber-400/40",  bg: "bg-amber-400/10",  text: "text-amber-400",  dot: "bg-amber-400" },
  green:  { border: "border-emerald-400/40",bg: "bg-emerald-400/10",text: "text-emerald-400",dot: "bg-emerald-400" },
};

const initialNodes: WorkflowNode[] = [
  {
    id: "node-1",
    type: "trigger",
    title: "Connect Your Data",
    description: "Google Sheets, website URL, or text input",
    icon: FileSpreadsheet,
    color: "blue",
    position: { x: 40, y: 120 },
  },
  {
    id: "node-2",
    type: "action",
    title: "Hoursback Detects Changes",
    description: "Monitors on your schedule — daily or weekly",
    icon: Database,
    color: "amber",
    position: { x: 300, y: 120 },
  },
  {
    id: "node-3",
    type: "action",
    title: "Claude AI Analyzes",
    description: "Extracts signals, trends, and key insights",
    icon: Bot,
    color: "purple",
    position: { x: 560, y: 120 },
  },
  {
    id: "node-4",
    type: "output",
    title: "Insight Sent to Inbox",
    description: "Clear summary email on your schedule",
    icon: Mail,
    color: "green",
    position: { x: 820, y: 120 },
  },
];

const initialConnections: WorkflowConnection[] = [
  { from: "node-1", to: "node-2" },
  { from: "node-2", to: "node-3" },
  { from: "node-3", to: "node-4" },
];

function WorkflowConnectionLine({
  from,
  to,
  nodes,
}: {
  from: string;
  to: string;
  nodes: WorkflowNode[];
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const startX = fromNode.position.x + NODE_WIDTH;
  const startY = fromNode.position.y + NODE_HEIGHT / 2;
  const endX = toNode.position.x;
  const endY = toNode.position.y + NODE_HEIGHT / 2;
  const cp1X = startX + (endX - startX) * 0.5;
  const cp2X = endX - (endX - startX) * 0.5;
  const path = `M${startX},${startY} C${cp1X},${startY} ${cp2X},${endY} ${endX},${endY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="#4285F4"
      strokeWidth={2}
      strokeDasharray="8,6"
      strokeLinecap="round"
      opacity={0.5}
    />
  );
}

export function N8nWorkflowBlock() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections] = useState<WorkflowConnection[]>(initialConnections);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(...initialNodes.map((n) => n.position.x + NODE_WIDTH));
    const maxY = Math.max(...initialNodes.map((n) => n.position.y + NODE_HEIGHT));
    return { width: maxX + 60, height: maxY + 60 };
  });

  const handleDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) dragStartPosition.current = { x: node.position.x, y: node.position.y };
  };

  const handleDrag = (nodeId: string, { offset }: PanInfo) => {
    if (draggingNodeId !== nodeId || !dragStartPosition.current) return;
    const newX = Math.max(0, dragStartPosition.current.x + offset.x);
    const newY = Math.max(0, dragStartPosition.current.y + offset.y);
    flushSync(() => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, position: { x: newX, y: newY } } : node
        )
      );
    });
    setContentSize((prev) => ({
      width: Math.max(prev.width, newX + NODE_WIDTH + 60),
      height: Math.max(prev.height, newY + NODE_HEIGHT + 60),
    }));
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    dragStartPosition.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-light p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-500"
          >
            Live
          </Badge>
          <span className="text-xs uppercase tracking-widest text-brand-dark/40 font-semibold">
            How Hoursback Works
          </span>
        </div>
        <span className="text-[10px] text-brand-dark/30 uppercase tracking-widest hidden sm:block">
          Drag nodes to explore
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full overflow-auto rounded-xl border border-brand-dark/8 bg-white"
        style={{ height: "280px" }}
        role="region"
        aria-label="Workflow canvas"
      >
        <div
          className="relative"
          style={{ minWidth: contentSize.width, minHeight: contentSize.height }}
        >
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={contentSize.width}
            height={contentSize.height}
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {connections.map((c) => (
              <WorkflowConnectionLine
                key={`${c.from}-${c.to}`}
                from={c.from}
                to={c.to}
                nodes={nodes}
              />
            ))}
          </svg>

          {nodes.map((node) => {
            const Icon = node.icon;
            const isDragging = draggingNodeId === node.id;
            const cls = colorClasses[node.color];

            return (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                dragConstraints={{ left: 0, top: 0, right: 100000, bottom: 100000 }}
                onDragStart={() => handleDragStart(node.id)}
                onDrag={(_, info) => handleDrag(node.id, info)}
                onDragEnd={handleDragEnd}
                style={{ x: node.position.x, y: node.position.y, width: NODE_WIDTH, transformOrigin: "0 0" }}
                className="absolute cursor-grab"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                whileHover={{ scale: 1.03 }}
                whileDrag={{ scale: 1.06, zIndex: 50, cursor: "grabbing" }}
              >
                <Card
                  className={`relative w-full overflow-hidden rounded-xl border ${cls.border} ${cls.bg} bg-white p-3.5 transition-all hover:shadow-md ${isDragging ? "shadow-xl ring-2 ring-[#4285F4]/30" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cls.border} bg-white`}>
                      <Icon className={`h-4 w-4 ${cls.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="outline"
                        className={`mb-1 rounded-full border-0 px-1.5 py-0 text-[9px] uppercase tracking-widest ${cls.bg} ${cls.text}`}
                      >
                        {node.type}
                      </Badge>
                      <h3 className="text-[11px] font-bold text-brand-dark leading-tight">{node.title}</h3>
                      <p className="text-[10px] text-brand-dark/50 mt-0.5 leading-snug">{node.description}</p>
                    </div>
                  </div>
                  <div className={`mt-2 flex items-center gap-1 text-[9px] uppercase tracking-widest ${cls.text}`}>
                    <ArrowRight className="h-2.5 w-2.5" />
                    Connected
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-dark/8 bg-brand-light px-4 py-2">
        <div className="flex gap-4">
          {[
            { color: "bg-[#4285F4]", label: "4 Steps" },
            { color: "bg-emerald-400", label: "Always On" },
            { color: "bg-purple-400", label: "Claude AI" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[10px] text-brand-dark/50 uppercase tracking-widest">
              <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
              {s.label}
            </div>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-brand-dark/30">Runs automatically · No login required</p>
      </div>
    </div>
  );
}
