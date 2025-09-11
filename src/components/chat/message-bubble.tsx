
'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { cn, formatBytes } from "@/lib/utils";
import type { Message } from './message-list';
import type { UserProfile } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { Check, CheckCheck, FileText, Download, Play, Image as ImageIcon, Plus, SmilePlus, MessageSquareReply, Pencil, Trash2, ListChecks, AlertCircle } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { getFile } from '@/lib/indexed-db';
import { Skeleton } from '../ui/skeleton';
import { eventBus } from '@/lib/event-bus';
import { AudioPlayer } from './audio-player';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { EmojiPicker } from './emoji-picker';
import { Separator } from '../ui/separator';
import { usePeer } from '@/contexts/peer-context';

type MessageBubbleProps = {
    message: Message;
    isMe: boolean;
    isAiChat: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    currentUser: UserProfile;
    otherUser: { uid: string, name: string, peerId: string };
    nicknames?: Record<string, string>;
    otherUserReadUntil?: Timestamp;
    selectionMode: boolean;
    selected: boolean;
    onReply: (message: Message) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: string) => void;
    onReact: (message: Message, emoji: string) => void;
    onMediaClick: (messageId: string) => void;
    onSelectMessage: (message: Message) => void;
    onEnterSelectionMode: (message: Message) => void;
};


const useFileBlobUrl = (fileId?: string, senderPeerId?: string) => {
    const { requestFile } = usePeer();
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const tryLoadFile = useCallback(async () => {
        if (!fileId) {
            setIsLoading(false);
            return null;
        }
        setIsLoading(true);
        try {
            const file = await getFile(fileId);
            if (file) {
                return file;
            } else if (senderPeerId) {
                requestFile(senderPeerId, fileId);
            }
            return null;
        } catch (error) {
            console.error("Failed to get file from DB", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fileId, senderPeerId, requestFile]);

    useEffect(() => {
        let objectUrl: string | null = null;
        
        const setUrlFromFile = (file: File | null) => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
            if (file) {
                objectUrl = URL.createObjectURL(file);
                setBlobUrl(objectUrl);
                setIsLoading(false); // File loaded, no longer loading
            } else {
                setBlobUrl(null);
            }
        };
        
        tryLoadFile().then(setUrlFromFile);

        const handleFileReceived = (event: Event) => {
            const customEvent = event as CustomEvent<{ fileId: string }>;
            if (customEvent.detail.fileId === fileId) {
                // When file is received, get it from DB and set the URL
                getFile(fileId).then(setUrlFromFile);
            }
        };

        eventBus.addEventListener('file-received', handleFileReceived);
        
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            eventBus.removeEventListener('file-received', handleFileReceived);
        };
    }, [fileId, tryLoadFile]);

    return { blobUrl, isLoading };
};


const ReadReceipt = ({ message, isMe, otherUserReadUntil }: { message: Message, isMe: boolean, otherUserReadUntil?: Timestamp }) => {
    if (!isMe || message.isDeleted) return null;

    const isRead = otherUserReadUntil && message.timestamp && message.timestamp.toMillis() <= otherUserReadUntil.toMillis();
    const Icon = isRead ? CheckCheck : Check;
    return <Icon className={cn("h-4 w-4", isRead ? "text-accent" : "text-muted-foreground")} />;
};

const MessageTimestamp = ({ message, isMe, otherUserReadUntil }: { message: Message; isMe: boolean; otherUserReadUntil?: Timestamp }) => {
    if (!message.timestamp) return null;
    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 px-3">
            <span>{format(message.timestamp.toDate(), 'p')}</span>
            {isMe && <ReadReceipt message={message} isMe={isMe} otherUserReadUntil={otherUserReadUntil} />}
        </div>
    );
};
MessageTimestamp.displayName = "MessageTimestamp";

const ReplyQuote = ({ message, currentUser, otherUser, nicknames }: Pick<MessageBubbleProps, 'message' | 'currentUser' | 'otherUser' | 'nicknames'>) => {
    if (!message.replyTo || !message.replyTo.text) return null;

    const getSenderName = () => {
        if (message.replyTo?.senderUid === currentUser.uid) return 'You';
        return nicknames?.[message.replyTo!.senderUid] || otherUser.name;
    }

    return (
        <div className="reply-quote mb-1 bg-black/5 dark:bg-white/5 p-2 rounded-md">
            <p className="font-semibold text-xs text-primary">{getSenderName()}</p>
            <p className="text-muted-foreground text-sm truncate">{message.replyTo.text}</p>
        </div>
    );
};

const Reactions = ({ message, isMe }: { message: Message, isMe: boolean }) => {
    if (!message.reactions || Object.keys(message.reactions).length === 0 || message.isDeleted) return null;

    // Aggregate reactions
    const aggregatedReactions = Object.entries(message.reactions).reduce((acc, [emoji, uids]) => {
        if (uids.length > 0) {
            acc[emoji] = (acc[emoji] || 0) + uids.length;
        }
        return acc;
    }, {} as Record<string, number>);

    return (
         <div className={cn(
            "absolute -bottom-3 flex gap-1 z-20",
            isMe ? "right-2" : "left-2"
        )}>
            {Object.entries(aggregatedReactions).map(([emoji, count]) => (
                <div
                    key={emoji}
                    className="flex items-center justify-center rounded-full border bg-card text-xs shadow-sm h-6 px-1.5"
                >
                    <span>{emoji}</span>
                    {count > 1 && <span className="ml-1 font-medium">{count}</span>}
                </div>
            ))}
        </div>
    );
}

const MessageContent = ({ message, isMe, onMediaClick }: { message: Message; isMe: boolean; onMediaClick: (messageId: string) => void; }) => {
    const { requestFile } = usePeer();
    const senderPeerId = isMe ? undefined : message.senderPeerId;
    const { blobUrl, isLoading } = useFileBlobUrl(message.fileId, senderPeerId);
    
    if (isLoading) {
        return <Skeleton className="w-64 h-24 rounded-lg" />;
    }

    if (!blobUrl && (message.type === 'image' || message.type === 'video' || message.type === 'file' || message.type === 'audio')) {
         return (
            <div className="flex items-center gap-3 text-muted-foreground p-3 rounded-lg max-w-xs">
                <AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate text-foreground">File not available</p>
                    <p className="text-xs">The sender might be offline.</p>
                </div>
            </div>
        );
    }

    const handleMediaClick = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        if ((message.type === 'image' || message.type === 'video')) {
            onMediaClick(message.id);
        }
    };
    
    switch (message.type) {
        case 'image':
            return (
                <div className="relative">
                    <div onClick={handleMediaClick} className="relative max-w-xs group/media cursor-pointer">
                        <img
                            src={blobUrl!}
                            alt={message.fileName || "Sent image"}
                            className="rounded-lg object-cover w-full h-auto max-h-[300px]"
                        />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    {message.text && <p className="text-base whitespace-pre-wrap pt-1.5 px-1.5 pb-1">{message.text}</p>}
                </div>
            );
        case 'video':
             return (
                 <div className="relative">
                    <div onClick={handleMediaClick} className="relative max-w-xs group/media cursor-pointer">
                        <img
                            src={blobUrl!}
                            alt={message.fileName || "Sent video"}
                            className="rounded-lg w-full bg-black"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    {message.text && <p className="text-base whitespace-pre-wrap pt-1.5 px-1.5 pb-1">{message.text}</p>}
                </div>
            );
        case 'audio':
            return (
                <AudioPlayer
                    blobUrl={blobUrl!}
                    waveform={message.waveform || []}
                    duration={message.duration || 0}
                    isMe={isMe}
                />
            );
        case 'file':
            return (
                <div>
                    <a href={blobUrl!} download={message.fileName}
                       className="flex items-center gap-3 p-3 rounded-lg transition-colors max-w-xs bg-foreground/5 hover:bg-foreground/10">
                        <FileText className="h-8 w-8 shrink-0" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{message.fileName}</p>
                            <p className="text-xs">{formatBytes(message.fileSize || 0)}</p>
                        </div>
                        <Download className="h-5 w-5 shrink-0" />
                    </a>
                </div>
            );
        default:
             return (
                <div className="flex items-end flex-wrap">
                    <p className="text-base whitespace-pre-wrap">{message.text}</p>
                </div>
            );
    }
};

const defaultReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ContextMenuContent = ({ onReact, onReply, onEdit, onSelect, onDelete, canEdit, canDelete }: {
    onReact: (emoji: string) => void;
    onReply: () => void;
    onEdit: () => void;
    onSelect: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
}) => {
    const actionItemClass = "w-full justify-start text-sm h-9 px-3";

    return (
        <div className="flex flex-col gap-1 w-63">
             <div className="flex items-center justify-between p-1">
                {defaultReactions.map(emoji => (
                    <motion.button 
                        key={emoji} 
                        onClick={() => onReact(emoji)}
                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                        className="p-1 bg-transparent border-none text-2xl"
                    >
                        {emoji}
                    </motion.button>
                ))}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <SmilePlus className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto border-none mb-2" side="bottom" align="start">
                        <EmojiPicker onEmojiClick={(emoji) => onReact(emoji)} />
                    </PopoverContent>
                </Popover>
            </div>
            <Separator />
            <Button variant="ghost" onClick={onReply} className={actionItemClass}><MessageSquareReply className="mr-2 h-4 w-4" /> Reply</Button>
            {canEdit && <Button variant="ghost" onClick={onEdit} className={actionItemClass}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}
            {canDelete && <Button variant="ghost" onClick={onDelete} className={actionItemClass}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>}
            <Button variant="ghost" onClick={onSelect} className={actionItemClass}><ListChecks className="mr-2 h-4 w-4" /> Select Message</Button>
        </div>
    )
};


export const MessageBubble = (props: MessageBubbleProps) => {
    const { message, isMe, isAiChat, isFirstInGroup, isLastInGroup, currentUser, otherUser, nicknames, otherUserReadUntil, onReply, onEdit, onDelete, onReact, onMediaClick, selectionMode, selected, onSelectMessage, onEnterSelectionMode } = props;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const longPressTimeout = useRef<NodeJS.Timeout>();
    const isDragging = useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isAiChat || selectionMode) return;
        if (e.pointerType === 'touch' || e.button === 0) {
            isDragging.current = false;
            longPressTimeout.current = setTimeout(() => {
                if (!isDragging.current) {
                    if ('vibrate' in navigator) navigator.vibrate(50);
                    onEnterSelectionMode(message);
                }
            }, 500);
        }
    };

    const handlePointerMove = () => {
        if (isDragging.current) return;
        isDragging.current = true;
        clearTimeout(longPressTimeout.current);
    };

    const handlePointerUp = () => {
        clearTimeout(longPressTimeout.current);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (isAiChat || selectionMode) return;
        e.preventDefault();
        setIsMenuOpen(true);
    };

    const handleClick = () => {
        if (selectionMode) {
            onSelectMessage(message);
            return;
        }

        if ((message.type === 'image' || message.type === 'video') && !message.isDeleted) {
            onMediaClick(message.id);
        }
    };
    
    const hasContent = message.text || message.type !== 'text';
    const isMediaOnly = message.type !== 'text' && !message.text;

    const canEdit = isMe && !message.isDeleted && message.type === 'text';
    const canDelete = isMe && !message.isDeleted;
    
    const bubbleClasses = cn(
        "shadow-sm relative z-0 flex flex-col",
        message.isDeleted
            ? "bg-transparent border border-dashed text-muted-foreground/80 italic text-sm px-4 py-2.5 rounded-2xl"
            : isMe
            ? "bg-[hsl(var(--chat-bubble-outgoing-bg))] text-[hsl(var(--chat-bubble-outgoing-fg))]"
            : "bg-[hsl(var(--chat-bubble-incoming-bg))] text-[hsl(var(--chat-bubble-incoming-fg))]",
        isMediaOnly ? "p-1.5" : message.type === 'audio' ? "p-2" : "px-3 py-2",
        "rounded-2xl",
        isMe ? !isFirstInGroup && "rounded-tr-md" : !isFirstInGroup && "rounded-tl-md",
        isMe ? !isLastInGroup && "rounded-br-md" : !isLastInGroup && "rounded-bl-md"
    );

    return (
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "flex w-full group relative select-none flex-col",
                        isMe ? "items-end" : "items-start",
                        isFirstInGroup ? 'mt-4' : 'mt-0.5'
                    )}
                    style={{ WebkitTouchCallout: 'none', userSelect: 'none' } as React.CSSProperties}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                >
                    <div className={cn("absolute inset-0 z-10 transition-colors pointer-events-none", selected ? (isMe ? 'bg-primary/20' : 'bg-accent/10') : 'bg-transparent')} />

                    <div className={cn("flex items-end gap-2 max-w-[85%] relative", isMe && "flex-row-reverse")}>
                        <div className={bubbleClasses}>
                            {!message.isDeleted && !isAiChat && (
                                <ReplyQuote message={message} currentUser={currentUser} otherUser={otherUser} nicknames={nicknames} />
                            )}
                            <MessageContent
                                message={{ ...message, senderPeerId: isMe ? currentUser.peerId : otherUser.peerId }}
                                isMe={isMe}
                                onMediaClick={onMediaClick}
                            />
                        </div>
                        {!isAiChat && !message.isDeleted && (
                            <Reactions message={message} isMe={isMe} />
                        )}
                    </div>
                    {isLastInGroup && !message.isDeleted && hasContent && (
                        <MessageTimestamp
                            message={message}
                            isMe={isMe}
                            otherUserReadUntil={otherUserReadUntil}
                        />
                    )}
                </div>
            </PopoverTrigger>
            {!isAiChat && !selectionMode && (
                <PopoverContent 
                    side="top" 
                    align={isMe ? "end" : "start"} 
                    className="bg-popover p-0 w-auto rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ContextMenuContent 
                        onReact={(emoji) => { onReact(message, emoji); setIsMenuOpen(false); }}
                        onReply={() => { onReply(message); setIsMenuOpen(false); }}
                        onEdit={() => { onEdit(message); setIsMenuOpen(false); }}
                        onSelect={() => { onEnterSelectionMode(message); setIsMenuOpen(false); }}
                        onDelete={() => { onDelete(message.id); setIsMenuOpen(false); }}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </PopoverContent>
            )}
        </Popover>
    );
};
