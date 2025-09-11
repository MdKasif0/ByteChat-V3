
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/contexts/auth-context';
import { Skeleton } from '../ui/skeleton';
import { isSameDay, isSameMinute } from 'date-fns';
import { MessageBubble } from './message-bubble';
import { AnimatePresence, motion } from 'framer-motion';
import { LottieAnimation } from '../lottie-animation';
import { useSound } from '@/hooks/use-sound';
import { formatDateSeparator } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export type Message = {
    id: string;
    senderUid: string;
    text: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'video' | 'file' | 'audio';
    
    // Media fields
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    mediaType?: string; // e.g., 'image/png'

    // Audio fields
    duration?: number;
    waveform?: number[];

    reactions?: Record<string, string[]>; // emoji -> [uid1, uid2]
    editedAt?: Timestamp;
    isDeleted?: boolean;
    replyTo?: {
        messageId: string;
        text: string;
        senderUid: string;
    };
    senderName?: string; // Used for replies
    senderPeerId?: string; // Used for file requests
};

type MessageListProps = {
    messages: Message[];
    loading: boolean;
    isAiChat: boolean;
    currentUser: UserProfile;
    otherUser: {
        uid: string;
        name: string;
        avatar: string;
        username: string;
        peerId: string;
    };
    chatData: any;
    selectionMode: boolean;
    selectedMessages: Message[];
    onReply: (message: Message) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: string) => void;
    onReact: (message: Message, emoji: string) => void;
    onMediaClick: (messageId: string) => void;
    onSelectMessage: (message: Message) => void;
    onEnterSelectionMode: (message: Message) => void;
}

const DateSeparator = ({ date }: { date: Date }) => {
    return (
        <div className="flex items-center my-4" aria-label={`Date separator for ${formatDateSeparator(date)}`}>
            <div className="flex-grow border-t border-border/10"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground">{formatDateSeparator(date)}</span>
            <div className="flex-grow border-t border-border/10"></div>
        </div>
    );
};

export function MessageList(props: MessageListProps) {
    const { messages, loading, isAiChat, currentUser, otherUser, chatData, onReply, onEdit, onDelete, onReact, onMediaClick, selectionMode, selectedMessages, onSelectMessage, onEnterSelectionMode } = props;
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const { play: playReceiveSound } = useSound('/message-receive.mp3');
    const prevMessagesCount = useRef(messages.length);

    const otherUserReadUntil = chatData?.readUntil?.[otherUser.uid];
    const nicknames = chatData?.nicknames;

    useEffect(() => {
        if (!isAiChat && messages.length > prevMessagesCount.current) {
             const lastMessage = messages[messages.length - 1];
             if (lastMessage && lastMessage.senderUid !== currentUser.uid) {
                 playReceiveSound();
             }
        }
        prevMessagesCount.current = messages.length;
    }, [messages, currentUser.uid, playReceiveSound, isAiChat]);

    useEffect(() => {
        setTimeout(() => {
            if (scrollViewportRef.current) {
                scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
            }
        }, 100);
    }, [messages]);

    if (loading) {
        return (
            <div className="flex-1 p-4 space-y-4">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex items-end gap-2 ${i % 2 !== 0 ? "justify-start" : "justify-end"}`}>
                        <Skeleton className={`w-48 h-12 rounded-2xl ${i % 2 !== 0 ? "rounded-bl-md" : "rounded-br-md"}`} />
                    </div>
                 ))}
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
            <div className="p-4 space-y-0">
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                        <LottieAnimation src="https://lottie.host/embed/8488950c-e2f7-4a6c-ab03-a968a3bf602e/rA9g5a4358.json" className="w-80 h-80 -mt-10" />
                        <p className="-mt-10">No messages yet. Say hello!</p>
                    </div>
                )}
                <AnimatePresence initial={false}>
                    {messages.map((message, index) => {
                        if (!message?.timestamp?.toDate) return null;
                        
                        const prevMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];
                        
                        const messageDate = message.timestamp.toDate();
                        const prevMessageDate = prevMessage?.timestamp?.toDate ? prevMessage.timestamp.toDate() : null;
                        const nextMessageDate = nextMessage?.timestamp?.toDate ? nextMessage.timestamp.toDate() : null;

                        const showDateSeparator = !prevMessageDate || !isSameDay(prevMessageDate, messageDate);
                        const isFirstInGroup = !prevMessageDate || prevMessage.senderUid !== message.senderUid || !isSameMinute(prevMessageDate, messageDate);
                        const isLastInGroup = !nextMessageDate || nextMessage.senderUid !== message.senderUid || !isSameMinute(nextMessageDate, messageDate);

                        const isMe = message.senderUid === currentUser.uid;
                        const isSelected = selectedMessages.some(m => m.id === message.id);

                        return (
                            <React.Fragment key={message.id}>
                                {showDateSeparator && (
                                    <DateSeparator date={messageDate} />
                                )}
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        opacity: { duration: 0.2 },
                                        layout: {
                                        type: "spring",
                                        bounce: 0.4,
                                        duration: 0.5,
                                        },
                                    }}
                                >
                                    <MessageBubble
                                        message={message}
                                        isMe={isMe}
                                        isAiChat={isAiChat}
                                        isFirstInGroup={isFirstInGroup}
                                        isLastInGroup={isLastInGroup}
                                        currentUser={currentUser}
                                        otherUser={otherUser}
                                        nicknames={nicknames}
                                        otherUserReadUntil={otherUserReadUntil}
                                        selectionMode={selectionMode}
                                        selected={isSelected}
                                        onReply={onReply}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onReact={onReact}
                                        onMediaClick={onMediaClick}
                                        onSelectMessage={onSelectMessage}
                                        onEnterSelectionMode={onEnterSelectionMode}
                                    />
                                </motion.div>
                            </React.Fragment>
                        )
                    })}
                </AnimatePresence>
            </div>
        </ScrollArea>
    );
}
