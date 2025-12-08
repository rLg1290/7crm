import * as React from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAutoScroll } from '@/components/hooks/use-auto-scroll'

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean
}

export const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = false, ...props }, _ref) => {
    const { scrollRef, isAtBottom, autoScrollEnabled, scrollToBottom, disableAutoScroll } = useAutoScroll({ smooth, content: children })

    return (
      <div className="relative w-full h-full">
        <div
          className={`flex flex-col w-full h-full p-4 overflow-y-auto ${className}`}
          ref={scrollRef}
          onWheel={disableAutoScroll}
          onTouchMove={disableAutoScroll}
          {...props}
        >
          <div className="flex flex-col gap-6">{children}</div>
        </div>

        {!isAtBottom && (
          <Button onClick={() => { scrollToBottom() }} size="icon" variant="outline" className="absolute bottom-2 right-2 rounded-full">
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }
)
ChatMessageList.displayName = 'ChatMessageList'

