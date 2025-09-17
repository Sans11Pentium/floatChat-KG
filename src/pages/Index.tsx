import React, { useState } from 'react';
import { CSVUpload } from '@/components/CSVUpload';
import { DataPreview } from '@/components/DataPreview';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { ChatInterface } from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Waves, Database, MessageSquare, Network, Upload } from 'lucide-react';
import heroImage from '@/assets/hero-ocean.jpg';

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

const Index = () => {
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'graph' | 'chat'>('upload');

  const handleDataParsed = (data: CSVData[]) => {
    setCsvData(data);
    setActiveTab('preview');
  };

  const handleGenerateKnowledgeGraph = () => {
    setShowKnowledgeGraph(true);
    setActiveTab('graph');
  };

  const tabs = [
    { id: 'upload' as const, label: 'Upload Data', icon: Upload, disabled: false },
    { id: 'preview' as const, label: 'Data Preview', icon: Database, disabled: csvData.length === 0 },
    { id: 'graph' as const, label: 'Knowledge Graph', icon: Network, disabled: csvData.length === 0 },
    { id: 'chat' as const, label: 'AI Assistant', icon: MessageSquare, disabled: csvData.length === 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Hero Section */}
      <div className="relative">
        <div 
          className="h-64 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-ocean opacity-90"></div>
          <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
            <div className="max-w-4xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Waves className="w-8 h-8 text-white" />
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  Oceanic Data Platform
                </h1>
              </div>
              <p className="text-xl text-white/90 mb-6">
                Upload, analyze, and explore oceanic datasets through knowledge graphs and AI-powered insights
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  CSV Upload
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Knowledge Graph
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  AI Assistant
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Data Visualization
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-1 bg-card rounded-lg shadow-soft border border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  disabled={tab.disabled}
                  className={`flex-1 min-w-fit transition-smooth ${
                    activeTab === tab.id 
                      ? 'bg-gradient-ocean text-white shadow-ocean' 
                      : tab.disabled 
                        ? 'opacity-50' 
                        : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.id === 'preview' && csvData.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
                      {csvData.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <CSVUpload onDataParsed={handleDataParsed} />
              
              {csvData.length === 0 && (
                <div className="mt-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Expected CSV Format</h3>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-left">
                    <p className="text-sm text-muted-foreground mb-2">Required columns:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                      <span>latitude, longitude, region</span>
                      <span>depth, salinity, temperature</span>
                      <span>ph, dissolved_oxygen</span>
                      <span>fish_population, plankton</span>
                      <span>coral_coverage</span>
                      <span>timestamp, date</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && csvData.length > 0 && (
            <DataPreview data={csvData} onGenerateKnowledgeGraph={handleGenerateKnowledgeGraph} />
          )}

          {activeTab === 'graph' && csvData.length > 0 && (
            <KnowledgeGraph data={csvData} />
          )}

          {activeTab === 'chat' && csvData.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <ChatInterface data={csvData} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground">
            Oceanic Data Platform - Explore marine environments through data science
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;