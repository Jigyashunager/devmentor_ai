'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Copy, 
  Download, 
  Maximize2, 
  Minimize2, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lightbulb,
  Code2,
  Eye,
  EyeOff
} from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language: string;
  issues?: Array<{
    line: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestion?: string;
  }>;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  height?: string;
  onCodeChange?: (code: string) => void;
}

declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

export default function CodeViewer({
  code,
  language,
  issues = [],
  readOnly = true,
  showLineNumbers = true,
  height = '400px',
  onCodeChange
}: CodeViewerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIssues, setShowIssues] = useState(true);
  const [copied, setCopied] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  // Load Monaco Editor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if Monaco is already loaded
      if (window.monaco) {
        setMonacoLoaded(true);
        return;
      }

      // Load Monaco Editor via CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
      script.onload = () => {
        // Configure the loader
        window.require.config({ 
          paths: { 
            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
          } 
        });

        // Load the editor
        window.require(['vs/editor/editor.main'], () => {
          console.log('✅ Monaco Editor loaded successfully');
          setMonacoLoaded(true);
        });
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Monaco Editor');
      };
      
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Monaco Editor
  useEffect(() => {
    if (monacoLoaded && editorRef.current && !monacoEditorRef.current && window.monaco) {
      try {
        console.log('🚀 Creating Monaco Editor instance');
        
        const editor = window.monaco.editor.create(editorRef.current, {
          value: code,
          language: getMonacoLanguage(language),
          theme: 'vs-dark',
          readOnly,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          lineHeight: 1.6,
          renderWhitespace: 'selection',
          folding: true,
          wordWrap: 'on',
          glyphMargin: true,
          rulers: [80, 120],
        });

        monacoEditorRef.current = editor;
        console.log('✅ Monaco Editor instance created');

        // Add decorations for issues
        if (issues.length > 0) {
          addIssueDecorations(editor);
        }

        // Handle code changes
        if (onCodeChange) {
          editor.onDidChangeModelContent(() => {
            onCodeChange(editor.getValue());
          });
        }

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          editor.layout();
        });
        
        if (editorRef.current) {
          resizeObserver.observe(editorRef.current);
        }

        return () => {
          resizeObserver.disconnect();
        };
        
      } catch (error) {
        console.error('❌ Error creating Monaco Editor:', error);
      }
    }
  }, [monacoLoaded, code, language, issues, readOnly, showLineNumbers, onCodeChange]);

  // Update editor content when code changes
  useEffect(() => {
    if (monacoEditorRef.current && code !== monacoEditorRef.current.getValue()) {
      monacoEditorRef.current.setValue(code);
    }
  }, [code]);

  // Clean up editor on unmount
  useEffect(() => {
    return () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose();
        monacoEditorRef.current = null;
      }
    };
  }, []);

  const getMonacoLanguage = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rust',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      sql: 'sql',
    };
    return languageMap[lang] || 'plaintext';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.3)'; // red
      case 'high': return 'rgba(245, 158, 11, 0.3)'; // orange
      case 'medium': return 'rgba(251, 191, 36, 0.3)'; // yellow
      case 'low': return 'rgba(59, 130, 246, 0.3)'; // blue
      default: return 'rgba(156, 163, 175, 0.3)'; // gray
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const addIssueDecorations = (editor: any) => {
    try {
      if (!window.monaco || !window.monaco.Range) {
        console.warn('Monaco Range not available for decorations');
        return;
      }

      const decorations = issues.map(issue => ({
        range: new window.monaco.Range(issue.line, 1, issue.line, 1),
        options: {
          isWholeLine: true,
          className: 'code-issue-line',
          glyphMarginClassName: 'code-issue-glyph',
          hoverMessage: {
            value: `**${issue.type.toUpperCase()}** (${issue.severity})\n\n${issue.message}${issue.suggestion ? `\n\n**Suggestion:** ${issue.suggestion}` : ''}`
          },
          linesDecorationsClassName: 'code-issue-decoration',
          backgroundColor: getSeverityColor(issue.severity),
        }
      }));

      editor.deltaDecorations([], decorations);
      console.log(`✅ Added ${decorations.length} issue decorations`);
    } catch (error) {
      console.error('❌ Error adding issue decorations:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = monacoEditorRef.current ? monacoEditorRef.current.getValue() : code;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const textToDownload = monacoEditorRef.current ? monacoEditorRef.current.getValue() : code;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
    };
    return extensions[lang] || 'txt';
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Trigger layout update after fullscreen change
    setTimeout(() => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.layout();
      }
    }, 100);
  };

  if (!monacoLoaded) {
    return (
      <div className="border border-gray-300 rounded-lg bg-gray-50" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Monaco Editor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-4 z-50' : 'relative'} bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 capitalize">{language}</span>
          {issues.length > 0 && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {issues.length > 0 && (
            <button
              onClick={() => setShowIssues(!showIssues)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              title={showIssues ? 'Hide Issues' : 'Show Issues'}
            >
              {showIssues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          
          <button
            onClick={copyToClipboard}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title="Copy Code"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
          
          <button
            onClick={downloadCode}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title="Download Code"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Monaco Editor */}
        <div className="flex-1">
          <div 
            ref={editorRef} 
            style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
            className="w-full"
          />
        </div>

        {/* Issues Panel */}
        {issues.length > 0 && showIssues && (
          <div className="w-80 border-l bg-white overflow-y-auto" style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Code Issues ({issues.length})
              </h3>
              
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start gap-2 mb-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {issue.type}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">Line {issue.line}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-800 mb-2">{issue.message}</p>
                    
                    {issue.suggestion && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-start gap-1">
                          <Lightbulb className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-800">{issue.suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}