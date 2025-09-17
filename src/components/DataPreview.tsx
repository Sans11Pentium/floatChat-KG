import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, BarChart3 } from 'lucide-react';
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

interface DataPreviewProps {
  data: CSVData[];
  onGenerateKnowledgeGraph: () => void;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ data, onGenerateKnowledgeGraph }) => {
  const downloadJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'oceanic-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Data downloaded as JSON');
  };

  const getStats = () => {
    if (!data || data.length === 0) return {};
    
    const regions = [...new Set(data.map(d => d.region))];
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const avgSalinity = data.reduce((sum, d) => sum + d.salinity, 0) / data.length;
    const avgPH = data.reduce((sum, d) => sum + d.ph, 0) / data.length;
    
    return {
      totalRecords: data.length,
      regions: regions.length,
      regionList: regions,
      avgTemp: avgTemp.toFixed(2),
      avgSalinity: avgSalinity.toFixed(2),
      avgPH: avgPH.toFixed(2),
    };
  };

  const stats = getStats();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-card shadow-soft border-border">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Data Preview</h3>
          <p className="text-muted-foreground">Overview of your oceanic dataset</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadJSON} variant="outline" size="sm" className="transition-smooth">
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
          <Button onClick={onGenerateKnowledgeGraph} className="bg-gradient-ocean transition-smooth">
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Knowledge Graph
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-2xl font-bold text-primary">{stats.totalRecords}</div>
          <div className="text-sm text-muted-foreground">Records</div>
        </div>
        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
          <div className="text-2xl font-bold text-secondary-deep">{stats.regions}</div>
          <div className="text-sm text-muted-foreground">Regions</div>
        </div>
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <div className="text-2xl font-bold text-accent">{stats.avgTemp}°C</div>
          <div className="text-sm text-muted-foreground">Avg Temperature</div>
        </div>
        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
          <div className="text-2xl font-bold text-success">{stats.avgPH}</div>
          <div className="text-sm text-muted-foreground">Avg pH</div>
        </div>
      </div>

      {/* Regions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">Regions in Dataset:</h4>
        <div className="flex flex-wrap gap-2">
          {stats.regionList?.map((region: string, index: number) => (
            <Badge key={index} variant="secondary" className="bg-secondary text-secondary-foreground">
              {region}
            </Badge>
          ))}
        </div>
      </div>

      {/* Sample Data Table */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Sample Data (First 5 rows):
        </h4>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Region</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Lat</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Lon</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Depth</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Temp</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Salinity</th>
                <th className="text-left p-3 font-medium text-muted-foreground">pH</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Fish Pop.</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((row, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50 transition-smooth">
                  <td className="p-3 font-medium text-foreground">{row.region}</td>
                  <td className="p-3 text-muted-foreground">{row.latitude.toFixed(3)}</td>
                  <td className="p-3 text-muted-foreground">{row.longitude.toFixed(3)}</td>
                  <td className="p-3 text-muted-foreground">{row.depth}m</td>
                  <td className="p-3 text-muted-foreground">{row.temperature}°C</td>
                  <td className="p-3 text-muted-foreground">{row.salinity}</td>
                  <td className="p-3 text-muted-foreground">{row.ph}</td>
                  <td className="p-3 text-muted-foreground">{row.fish_population}</td>
                  <td className="p-3 text-muted-foreground">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};