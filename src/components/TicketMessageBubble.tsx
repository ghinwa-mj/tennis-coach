'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TicketMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ citation: string; metadata: any }>;
  serialNumber?: string;
  timestamp?: string;
}

export default function TicketMessageBubble({
  role,
  content,
  sources,
  serialNumber,
  timestamp,
}: TicketMessageBubbleProps) {
  const isUser = role === 'user';

  // Generate timestamp if not provided
  const displayTimestamp = timestamp || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Preprocess content to replace [Source X] with markdown links
  const preprocessContent = (text: string): string => {
    if (!sources || sources.length === 0) {
      return text;
    }

    return text.replace(/\[Source\s+(\d+)\]/gi, (match, sourceNumStr) => {
      const sourceNum = parseInt(sourceNumStr, 10);
      const sourceIndex = sourceNum - 1;

      if (sources[sourceIndex]) {
        const source = sources[sourceIndex];
        const url = source.metadata?.url || extractUrlFromCitation(source.citation);

        if (url) {
          return `[${match}](${url})`;
        }
      }
      return match;
    });
  };

  // Extract URL from citation text if present
  const extractUrlFromCitation = (citation: string): string | null => {
    const urlMatch = citation.match(/https?:\/\/[^\s]+$/);
    return urlMatch ? urlMatch[0] : null;
  };

  // Preprocess content when there are sources
  const processedContent = (!isUser && sources && sources.length > 0)
    ? preprocessContent(content)
    : content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          relative max-w-[80%] p-5 rounded-lg shadow-sm
          transition-all duration-200
          ${
            isUser
              ? 'bg-clay-100 border-l-4 border-clay-400'
              : 'bg-ausopen-50 border-l-4 border-ausopen-500'
          }
        `}
      >
        {/* Ticket stub header with timestamp */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10">
          <div className="flex items-center gap-2">
            {/* Serial number hidden per user feedback */}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${isUser ? 'text-clay-400' : 'text-ausopen-500'}`}>
              {isUser ? 'You' : 'TennisCoach AI'}
            </span>
            <span className="text-xs text-navy-50">{displayTimestamp}</span>
          </div>
        </div>

        {/* Message content */}
        <div className="text-sm leading-relaxed text-navy-900">
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-1">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-navy-900">{children}</strong>,
                h1: ({ children }) => <h1 className="text-lg font-heading font-bold mb-2 text-navy-900">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-heading font-bold mb-2 text-navy-900">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-heading font-bold mb-1 text-navy-900">{children}</h3>,
                a: ({ href, children }) => {
                  const isCitation = href?.startsWith('http') && typeof children === 'string' && children.includes('Source');
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isCitation
                        ? "text-ausopen-500 hover:text-ausopen-600 underline font-medium cursor-pointer"
                        : "text-ausopen-500 hover:text-ausopen-600 underline"
                      }
                    >
                      {children}
                    </a>
                  );
                },
                code: ({ children }) => (
                  <code className="bg-clay-200 px-1.5 py-0.5 rounded text-sm font-mono text-navy-900">
                    {children}
                  </code>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
