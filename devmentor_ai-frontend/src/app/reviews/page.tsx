'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Code2, 
  Zap, 
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface APIResponse {
  success: boolean;
  review: string;
  metadata?: {
    model: string;
    provider: string;
    timestamp: string;
    codeLength: number;
    language: string;
  };
  error?: string;
  message?: string;
}

export default function CodeReviewPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleSubmitReview = async () => {
    console.log('Submitting code for review:', { code, language, title, description });
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setReviewResult(null);
    
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          title,
          description
        }),
      });
      
      console.log('API response status:', response.status);
      const result: APIResponse = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to analyze code');
      }

      if (result.success && result.review) {
        setReviewResult(result.review);
        setMetadata(result.metadata);
      } else {
        throw new Error('No review content received');
      }
      
    } catch (error: any) {
      console.error('Error analyzing code:', error);
      setError(error.message || 'Failed to analyze code. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Code Review
          </h1>
          <p className="text-gray-600">
            Submit your code for instant AI-powered analysis and get detailed feedback
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Code Submission Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Submit Your Code
                </CardTitle>
                <CardDescription>
                  Paste your code below and let our AI analyze it for improvements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Review Title</Label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g., React Authentication Hook"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of what this code does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="language">Programming Language</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="code">Your Code</Label>
                  <Textarea
                    id="code"
                    placeholder="Paste your code here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <Button 
                  onClick={handleSubmitReview}
                  disabled={!code.trim() || isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Code...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Analyzing Your Code</h3>
                    <p className="text-gray-600">
                      Our AI is reviewing your code for bugs, performance issues, and best practices...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={() => setError(null)} 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                  >
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            )}

            {reviewResult && (
              <>
                {/* Review Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      AI Code Review Results
                    </CardTitle>
                    {metadata && (
                      <CardDescription>
                        Analyzed by {metadata.model} • {metadata.language} • {metadata.codeLength} characters
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {reviewResult}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata */}
                {metadata && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Analysis Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Model:</span>
                          <div className="text-gray-900">{metadata.model}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Provider:</span>
                          <div className="text-gray-900">{metadata.provider}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Language:</span>
                          <div className="text-gray-900">{metadata.language}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Code Length:</span>
                          <div className="text-gray-900">{metadata.codeLength} chars</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <span className="font-medium text-gray-600">Analyzed at:</span>
                        <div className="text-gray-900 text-xs">
                          {new Date(metadata.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          setReviewResult(null);
                          setMetadata(null);
                          setCode('');
                          setTitle('');
                          setDescription('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        New Review
                      </Button>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(reviewResult);
                          // You could add a toast notification here
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Copy Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Help Section */}
            {!reviewResult && !isAnalyzing && !error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">How it works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Paste your code in the editor</p>
                    <p>• Select the programming language</p>
                    <p>• Click "Analyze Code" to get AI feedback</p>
                    <p>• Review suggestions for bugs, performance, and best practices</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}