import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Papa from 'papaparse';
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

interface CSVUploadProps {
  onDataParsed: (data: CSVData[]) => void;
}

const REQUIRED_COLUMNS = [
  'latitude', 'longitude', 'region', 'depth', 'salinity', 'temperature',
  'ph', 'dissolved_oxygen', 'fish_population', 'plankton', 'coral_coverage',
  'timestamp', 'date'
];

export const CSVUpload: React.FC<CSVUploadProps> = ({ onDataParsed }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const validateCSVStructure = (data: any[]): boolean => {
    if (!data || data.length === 0) {
      setErrorMessage('CSV file is empty');
      return false;
    }

    const headers = Object.keys(data[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      setErrorMessage(`Missing required columns: ${missingColumns.join(', ')}`);
      return false;
    }

    return true;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      setErrorMessage('No file selected');
      setUploadStatus('error');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Only CSV files are allowed');
      setUploadStatus('error');
      toast.error('Invalid file format');
      return;
    }

    setUploadStatus('uploading');
    setFileName(file.name);
    setErrorMessage('');

    Papa.parse(file, {
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            setErrorMessage(`CSV parsing error: ${results.errors[0].message}`);
            setUploadStatus('error');
            return;
          }

          const parsedData = results.data as any[];
          
          if (!validateCSVStructure(parsedData)) {
            setUploadStatus('error');
            return;
          }

          // Convert string numbers to actual numbers
          const processedData: CSVData[] = parsedData.map((row: any) => ({
            ...row,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            depth: parseFloat(row.depth),
            salinity: parseFloat(row.salinity),
            temperature: parseFloat(row.temperature),
            ph: parseFloat(row.ph),
            dissolved_oxygen: parseFloat(row.dissolved_oxygen),
            fish_population: parseFloat(row.fish_population),
            plankton: parseFloat(row.plankton),
            coral_coverage: parseFloat(row.coral_coverage),
          }));

          setUploadStatus('success');
          onDataParsed(processedData);
          toast.success(`Successfully parsed ${processedData.length} records`);
        } catch (error) {
          setErrorMessage('Error processing CSV file');
          setUploadStatus('error');
          toast.error('Failed to process CSV file');
        }
      },
      header: true,
      skipEmptyLines: true,
    });
  }, [onDataParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <Card className="p-8 bg-card shadow-ocean border-border transition-smooth">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Oceanic Data</h2>
        <p className="text-muted-foreground">Upload a CSV file with oceanic measurements and parameters</p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-smooth
          ${isDragActive 
            ? 'border-primary bg-primary/5 shadow-glow' 
            : uploadStatus === 'success'
            ? 'border-success bg-success/5'
            : uploadStatus === 'error'
            ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-primary hover:bg-primary/5'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {uploadStatus === 'uploading' ? (
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle className="w-12 h-12 mx-auto text-success" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          ) : (
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          )}

          <div>
            {uploadStatus === 'uploading' ? (
              <p className="text-lg font-medium text-foreground">Processing {fileName}...</p>
            ) : uploadStatus === 'success' ? (
              <p className="text-lg font-medium text-success">Successfully uploaded {fileName}</p>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-primary">Drop the CSV file here</p>
            ) : (
              <p className="text-lg font-medium text-foreground">
                Drag & drop a CSV file here, or <span className="text-primary">click to browse</span>
              </p>
            )}
            
            {uploadStatus === 'idle' && (
              <p className="text-sm text-muted-foreground mt-2">
                Required columns: latitude, longitude, region, depth, salinity, temperature, ph, dissolved_oxygen, fish_population, plankton, coral_coverage, timestamp, date
              </p>
            )}
          </div>
        </div>
      </div>

      {uploadStatus === 'error' && (
        <Alert className="mt-6 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-destructive-foreground">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === 'success' && (
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={() => {
              setUploadStatus('idle');
              setFileName('');
              setErrorMessage('');
            }}
            variant="outline"
            className="transition-smooth"
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload Another File
          </Button>
        </div>
      )}
    </Card>
  );
};