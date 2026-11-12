'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TicketMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ citation: string; metadata: any }>;
  serialNumber?: string;
  timestamp?: string;
  topics?: string[];
}

export default function TicketMessageBubble({
  role,
  content,
  sources,
  serialNumber,
  timestamp,
  topics,
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={`
          relative max-w-[85%] p-6 rounded-md shadow-md
          transition-all duration-200 border-2
          ${
            isUser
              ? 'bg-gradient-to-br from-[#D4A574] to-[#E8C4A0] border-white'
              : 'bg-gradient-to-br from-[#C8E6C9] to-[#E8F5E9] border-white'
          }
        `}
        style={{
          backgroundImage: isUser
            ? 'linear-gradient(135deg, #D4A574 0%, #E8C4A0 50%, #D4A574 100%)'
            : 'linear-gradient(135deg, #C8E6C9 0%, #E8F5E9 50%, #C8E6C9 100%)',
        }}
      >
        {/* Court line accent dots */}
        <div className={`
          absolute top-3 left-3 flex gap-1
          ${isUser ? 'opacity-40' : 'opacity-40'}
        `}>
          <div className={`w-1 h-1 rounded-full ${isUser ? 'bg-white' : 'bg-wimbledon-500'}`} />
          <div className={`w-1 h-1 rounded-full ${isUser ? 'bg-white' : 'bg-wimbledon-500'}`} />
        </div>

        {/* Metadata header - refined court style */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-white/40">
          <div className="flex items-center gap-2">
            <div className={`
              w-2 h-2 rounded-full
              ${isUser ? 'bg-white' : 'bg-wimbledon-500'}
            `} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isUser ? 'text-white' : 'text-wimbledon-700'
            }`}>
              {isUser ? 'Player' : 'Coach'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-navy-400">{displayTimestamp}</span>
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
          {topics && topics.length > 0 && (
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 list-none p-0 m-0">
              {topics.map((topic) => (
                <li key={topic} className="text-sm text-navy-900">
                  {topic}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
