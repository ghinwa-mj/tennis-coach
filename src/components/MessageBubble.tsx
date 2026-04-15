import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ citation: string; metadata: any }>;
}

export default function MessageBubble({ role, content, sources }: MessageBubbleProps) {
  const isUser = role === 'user';

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
          // Return markdown link format - note: brackets in link text are preserved
          // ReactMarkdown will render [Source 3](url) as a link showing "Source 3" with brackets
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
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-orange-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${isUser ? 'text-white' : 'text-gray-500'}`}>
            {isUser ? 'You' : 'TennisCoach AI'}
          </span>
        </div>
        <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
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
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                a: ({ href, children }) => {
                  // Check if this is a citation link (starts with http and has Source in the text)
                  const isCitation = href?.startsWith('http') && typeof children === 'string' && children.includes('Source');
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isCitation ? "text-green-600 hover:text-green-700 underline font-medium cursor-pointer" : "text-green-600 hover:text-green-700 underline"}
                    >
                      {children}
                    </a>
                  );
                },
                code: ({ children }) => (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
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
