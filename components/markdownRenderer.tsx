import type React from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  children: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children, ...props }) => (
          <h1
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            {...props}
          >
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2
            className="text-xl font-semibold text-gray-800 dark:text-gray-200"
            {...props}
          >
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3
            className="text-xl font-medium text-gray-700 dark:text-gray-300"
            {...props}
          >
            {children}
          </h3>
        ),
        p: ({ ...props }) => (
          <p className="text-sm text-gray-600 dark:text-gray-400" {...props} />
        ),
        ul: ({ ...props }) => (
          <ul
            className="text-sm list-disc list-inside text-gray-600 dark:text-gray-400"
            {...props}
          />
        ),
        li: ({ ...props }) => <li className="" {...props} />,
        ol: ({ ...props }) => (
          <ol className="list-decimal list-inside" {...props} />
        ),
        code: ({ className, children, ...props }) => {
          const isCodeBlock = className && className.includes("language-");

          if (isCodeBlock) {
            // Code block
            return (
              <pre className="bg-muted text-muted-foreground p-4 rounded overflow-x-auto text-sm">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          } else {
            // Inline code
            return (
              <code
                className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono"
                style={{ display: "inline" }}
                {...props}
              >
                {children}
              </code>
            );
          }
        },
      }}
      remarkPlugins={[remarkGfm]}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
