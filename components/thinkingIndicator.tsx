"use client";

import { Loader2, Brain, Code, Database, AlertCircle, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThinkingState } from "@/lib/types";


export function ThinkingIndicator({
  status,
  text,
  isActive,
  sqlQuery,
}: ThinkingState) {
  const getStatusIcon = () => {
    switch (status) {
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case "reasoning":
        return <Brain className="w-4 h-4 text-muted-foreground" />;
      case "generatingQuery":
        return <Code className="w-4 h-4 text-muted-foreground" />;
      case "explaining":
        return <Lightbulb className="w-4 h-4 text-muted-foreground" />;
      case "suggesting":
        return <Lightbulb className="w-4 h-4 text-muted-foreground" />;
      case "partial":
      case "partial_reason":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      case "executing":
        return <Database className="w-4 h-4 text-muted-foreground" />;
      case "system_error":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Brain className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "initializing":
        return "Initializing...";
      case "reasoning":
        return "AI Reasoning Process";
      case "generatingQuery":
        return "Generating SQL";
      case "explaining":
        return "Explaining Results";
      case "suggesting":
        return "Suggesting Follow-ups";
      case "partial":
        return "Partial Result";
      case "partial_reason":
        return "Partial Result Reason";
      case "executing":
        return "Executing Query";
      case "complete":
        return "Process Complete";
      case "system_error":
        return "Error Occurred";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="flex justify-start">
      <div className="flex space-x-3 max-w-4xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-foreground flex items-center justify-center">
          <Brain className="w-4 h-4 text-background" />
        </div>

        <div className="flex-1 space-y-3">
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="text-sm font-semibold text-muted-foreground">
                    {getStatusLabel()}
                  </span>
                </div>

                {text ? (
                  <div className="p-3 rounded-md bg-muted/50 border border-muted">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {text}
                      {isActive && (
                        <span className="animate-pulse ml-1 text-primary">
                          ▋
                        </span>
                      )}
                    </p>
                  </div>
                ) : null}
              </div>

              {sqlQuery && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Current SQL
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 border border-muted">
                    <pre className="text-sm font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                      {sqlQuery}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}