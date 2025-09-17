import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, MessageCircle, Sparkles } from 'lucide-react';
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

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  data: CSVData[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your oceanic data assistant. You can ask me questions about your dataset, such as:\n\n• "Which region had the highest salinity in September 2025?"\n• "Show me fish population trends in the Indian Ocean"\n• "What is the average temperature where coral coverage is above 50%?"\n\nWhat would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuery = async (query: string): Promise<string> => {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerQuery = query.toLowerCase();

    // Mock LLM responses based on common patterns
    if (lowerQuery.includes('salinity') && lowerQuery.includes('highest')) {
      const regionSalinity = new Map();
      data.forEach(record => {
        if (!regionSalinity.has(record.region)) {
          regionSalinity.set(record.region, []);
        }
        regionSalinity.get(record.region).push(record.salinity);
      });

      let highestRegion = '';
      let highestSalinity = 0;
      
      regionSalinity.forEach((salinities, region) => {
        const avg = salinities.reduce((a: number, b: number) => a + b, 0) / salinities.length;
        if (avg > highestSalinity) {
          highestSalinity = avg;
          highestRegion = region;
        }
      });

      return `Based on your data, **${highestRegion}** had the highest average salinity at **${highestSalinity.toFixed(2)} PSU** (Practical Salinity Units). This region shows consistently elevated salinity levels across the time period in your dataset.`;
    }

    if (lowerQuery.includes('fish') && lowerQuery.includes('population')) {
      const fishData = data.filter(d => d.region.toLowerCase().includes(lowerQuery.includes('indian') ? 'indian' : lowerQuery.includes('pacific') ? 'pacific' : lowerQuery.includes('atlantic') ? 'atlantic' : ''));
      
      if (fishData.length > 0) {
        const avgFish = fishData.reduce((sum, d) => sum + d.fish_population, 0) / fishData.length;
        const maxFish = Math.max(...fishData.map(d => d.fish_population));
        const minFish = Math.min(...fishData.map(d => d.fish_population));
        
        return `Fish population analysis shows:\n\n• **Average population**: ${avgFish.toFixed(0)} individuals\n• **Peak population**: ${maxFish} individuals\n• **Lowest population**: ${minFish} individuals\n\nThe data suggests ${avgFish > 500 ? 'healthy' : 'concerning'} fish population levels in this region.`;
      }
    }

    if (lowerQuery.includes('temperature') && lowerQuery.includes('coral')) {
      const coralData = data.filter(d => d.coral_coverage > 50);
      
      if (coralData.length > 0) {
        const avgTemp = coralData.reduce((sum, d) => sum + d.temperature, 0) / coralData.length;
        
        return `In areas where coral coverage exceeds 50%, the average temperature is **${avgTemp.toFixed(2)}°C**. This temperature range is ${avgTemp < 28 ? 'optimal' : avgTemp < 30 ? 'acceptable' : 'concerning'} for coral health. Higher temperatures can lead to coral bleaching events.`;
      }
    }

    if (lowerQuery.includes('region') || lowerQuery.includes('area')) {
      const regions = [...new Set(data.map(d => d.region))];
      const regionStats = regions.map(region => {
        const regionData = data.filter(d => d.region === region);
        const avgTemp = regionData.reduce((sum, d) => sum + d.temperature, 0) / regionData.length;
        const avgPH = regionData.reduce((sum, d) => sum + d.ph, 0) / regionData.length;
        return { region, avgTemp: avgTemp.toFixed(1), avgPH: avgPH.toFixed(2), records: regionData.length };
      });

      return `Your dataset contains **${regions.length} regions**:\n\n${regionStats.map(stat => 
        `• **${stat.region}**: ${stat.records} records, Avg temp: ${stat.avgTemp}°C, Avg pH: ${stat.avgPH}`
      ).join('\n')}\n\nEach region shows distinct environmental characteristics that can be explored further.`;
    }

    if (lowerQuery.includes('ph') || lowerQuery.includes('acid')) {
      const avgPH = data.reduce((sum, d) => sum + d.ph, 0) / data.length;
      const pHRange = {
        min: Math.min(...data.map(d => d.ph)),
        max: Math.max(...data.map(d => d.ph))
      };
      
      return `Ocean pH analysis:\n\n• **Average pH**: ${avgPH.toFixed(2)}\n• **pH Range**: ${pHRange.min.toFixed(2)} - ${pHRange.max.toFixed(2)}\n\nA pH of ${avgPH.toFixed(2)} indicates ${avgPH > 8.1 ? 'normal alkaline' : avgPH > 7.8 ? 'slightly acidic' : 'concerning acidification'} conditions. Ocean acidification is a critical environmental indicator.`;
    }

    // Default response for unmatched queries
    return `I analyzed your query about oceanic data. While I can see patterns in your dataset of **${data.length} records** across **${[...new Set(data.map(d => d.region))].length} regions**, I'd need more specific information to provide a detailed answer. \n\nTry asking about specific parameters like temperature, salinity, pH, or fish populations in particular regions or time periods.`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!data || data.length === 0) {
      toast.error('Please upload data first to ask questions');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await processQuery(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to process your question');
      console.error('Query processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Which region has the highest average temperature?",
    "What's the pH level in areas with high coral coverage?",
    "Show me salinity trends across different regions",
    "Compare fish populations between regions"
  ];

  return (
    <Card className="flex flex-col h-[600px] bg-card shadow-soft border-border">
      <div className="p-4 border-b border-border bg-gradient-ocean rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Oceanic Data Assistant</h3>
            <p className="text-white/80 text-sm">Ask questions about your dataset in natural language</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <div className="whitespace-pre-line text-sm">{message.content}</div>
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="p-2 bg-accent/10 rounded-lg">
                <User className="w-4 h-4 text-accent" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted text-foreground p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing your question...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth"
                onClick={() => setInput(question)}
              >
                {question}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your oceanic data..."
            disabled={isLoading}
            className="transition-smooth"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-ocean transition-smooth"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};