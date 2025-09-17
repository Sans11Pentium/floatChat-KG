import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RotateCcw, ZoomIn, ZoomOut, Network } from 'lucide-react';
import { toast } from 'sonner';

interface CSVData {
  latitude: number;
  longitude: number;
  region: string;
  depth: number;
  salinity: number;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  fish_population: number;
  plankton: number;
  coral_coverage: number;
  timestamp: string;
  date: string;
}

interface GraphNode {
  id: string;
  type: 'region' | 'parameter' | 'biology' | 'time';
  value?: number | string;
  group: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  type: string;
}

interface KnowledgeGraphProps {
  data: CSVData[];
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const generateKnowledgeGraph = () => {
    if (!data || data.length === 0) return;

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map();

    // Create region nodes
    const regions = [...new Set(data.map(d => d.region))];
    regions.forEach((region, index) => {
      const node: GraphNode = {
        id: `region-${region}`,
        type: 'region',
        value: region,
        group: 1
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create parameter nodes
    const parameters = ['salinity', 'temperature', 'ph', 'dissolved_oxygen', 'depth'];
    parameters.forEach((param, index) => {
      const node: GraphNode = {
        id: `param-${param}`,
        type: 'parameter',
        value: param,
        group: 2
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create biology nodes
    const biologyParams = ['fish_population', 'plankton', 'coral_coverage'];
    biologyParams.forEach((param, index) => {
      const node: GraphNode = {
        id: `bio-${param}`,
        type: 'biology',
        value: param,
        group: 3
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create time nodes (by month)
    const months = [...new Set(data.map(d => d.date.substring(0, 7)))]; // YYYY-MM
    months.forEach((month, index) => {
      const node: GraphNode = {
        id: `time-${month}`,
        type: 'time',
        value: month,
        group: 4
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create links between regions and parameters
    const regionStats = new Map();
    data.forEach(record => {
      const regionKey = `region-${record.region}`;
      if (!regionStats.has(regionKey)) {
        regionStats.set(regionKey, {
          salinity: [],
          temperature: [],
          ph: [],
          dissolved_oxygen: [],
          depth: [],
          fish_population: [],
          plankton: [],
          coral_coverage: []
        });
      }
      
      const stats = regionStats.get(regionKey);
      stats.salinity.push(record.salinity);
      stats.temperature.push(record.temperature);
      stats.ph.push(record.ph);
      stats.dissolved_oxygen.push(record.dissolved_oxygen);
      stats.depth.push(record.depth);
      stats.fish_population.push(record.fish_population);
      stats.plankton.push(record.plankton);
      stats.coral_coverage.push(record.coral_coverage);
    });

    // Add links between regions and parameters
    regionStats.forEach((stats, regionId) => {
      parameters.forEach(param => {
        const values = stats[param];
        const avgValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        
        links.push({
          source: regionId,
          target: `param-${param}`,
          value: Math.max(0.1, Math.min(10, avgValue / 10)), // Normalize link strength
          type: 'parameter'
        });
      });

      biologyParams.forEach(param => {
        const values = stats[param];
        const avgValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        
        links.push({
          source: regionId,
          target: `bio-${param}`,
          value: Math.max(0.1, Math.min(10, avgValue / 100)), // Normalize link strength
          type: 'biology'
        });
      });
    });

    // Add temporal links
    const monthlyRegions = new Map();
    data.forEach(record => {
      const month = record.date.substring(0, 7);
      if (!monthlyRegions.has(month)) {
        monthlyRegions.set(month, new Set());
      }
      monthlyRegions.get(month).add(record.region);
    });

    monthlyRegions.forEach((regions, month) => {
      regions.forEach((region: string) => {
        links.push({
          source: `time-${month}`,
          target: `region-${region}`,
          value: 1,
          type: 'temporal'
        });
      });
    });

    setGraphData({ nodes, links });
  };

  const downloadGraph = () => {
    if (!graphData) return;
    
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'knowledge-graph.json');
    linkElement.click();
    
    toast.success('Knowledge graph downloaded as JSON');
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = 40;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Color scale for different node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['region', 'parameter', 'biology', 'time'])
      .range(['hsl(220, 85%, 45%)', 'hsl(185, 70%, 45%)', 'hsl(15, 85%, 60%)', 'hsl(45, 85%, 55%)']);

    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke", (d) => {
        switch (d.type) {
          case 'parameter': return 'hsl(185, 70%, 45%)';
          case 'biology': return 'hsl(15, 85%, 60%)';
          case 'temporal': return 'hsl(45, 85%, 55%)';
          default: return 'hsl(200, 25%, 70%)';
        }
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value) * 2);

    // Create nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter().append("circle")
      .attr("r", (d) => {
        switch (d.type) {
          case 'region': return 12;
          case 'parameter': return 10;
          case 'biology': return 8;
          case 'time': return 6;
          default: return 8;
        }
      })
      .attr("fill", (d) => colorScale(d.type) as string)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add labels
    const label = g.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .enter().append("text")
      .text((d) => String(d.value))
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("fill", "hsl(220, 90%, 15%)")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("pointer-events", "none");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

  }, [graphData]);

  useEffect(() => {
    generateKnowledgeGraph();
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center bg-card shadow-soft border-border">
        <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
        <p className="text-muted-foreground">Upload a CSV file to generate the knowledge graph</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card shadow-soft border-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Knowledge Graph Visualization</h3>
            <p className="text-muted-foreground">Interactive network of oceanic data relationships</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateKnowledgeGraph} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button onClick={downloadGraph} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(220, 85%, 45%)' }}></div>
            <span className="text-sm text-muted-foreground">Regions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(185, 70%, 45%)' }}></div>
            <span className="text-sm text-muted-foreground">Parameters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(15, 85%, 60%)' }}></div>
            <span className="text-sm text-muted-foreground">Biology</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45, 85%, 55%)' }}></div>
            <span className="text-sm text-muted-foreground">Time</span>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <svg ref={svgRef} className="w-full"></svg>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Click and drag nodes to reposition them. Use mouse wheel to zoom. Click nodes for details.
        </p>
      </Card>

      {selectedNode && (
        <Card className="p-4 bg-card shadow-soft border-border">
          <h4 className="font-semibold text-foreground mb-2">Selected Node Details</h4>
          <div className="flex gap-2 mb-2">
            <Badge variant="outline">{selectedNode.type}</Badge>
            <Badge variant="secondary">{String(selectedNode.value)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Node ID: {selectedNode.id}
          </p>
        </Card>
      )}
    </div>
  );
};