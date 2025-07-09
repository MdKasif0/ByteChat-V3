
'use client'

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical, ChevronLeft, Pencil, Trash2, X } from "lucide-react";
import { MessageList, Message } from "./message-list";
import { MessageInput } from "./message-input";
import type { UserProfile } from "@/contexts/auth-context";
import { addDoc, collection, doc, serverTimestamp, updateDoc, writeBatch, query, where, getDocs, onSnapshot, setDoc, orderBy, Timestamp, writeBatch as firestoreWriteBatch, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePeer } from "@/contexts/peer-context";
import { LottieAnimation } from "../lottie-animation";
import { getAiResponse, AiChatInput } from "@/ai/flows/ai-chat-flow";
import { MediaViewer } from "./media-viewer";
import { getFile } from "@/lib/indexed-db";
import { AnimatePresence, motion } from "framer-motion";

type ChatViewProps = {
    chat: {
        id: string;
        name: string;
        avatar: string;
        username: string;
    };
    currentUser: UserProfile;
    onBack: () => void;
};

const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return 'Offline';
    try {
        const date = timestamp.toDate();
        return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
        return 'Offline';
    }
};

const SelectionHeader = ({ count, onCancel, onDelete, onEdit }: { count: number; onCancel: () => void; onDelete: () => void; onEdit: () => void; }) => {
    const canEdit = count === 1;
    return (
        <motion.div 
            className="absolute top-0 left-0 right-0 z-20 flex items-center p-3 bg-background border-b"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <Button variant="ghost" size="icon" onClick={onCancel} className="mr-2 h-10 w-10 rounded-full">
                <X className="h-6 w-6" />
            </Button>
            <p className="font-semibold text-lg flex-1">{count} selected</p>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onEdit} disabled={!canEdit}>
                    <Pencil className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onDelete}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>
        </motion.div>
    );
};


export function ChatView({ chat, currentUser, onBack }: ChatViewProps) {
    const isAiChat = chat.id === 'ai-assistant';
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [chatData, setChatData] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);

    const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
    const [newNickname, setNewNickname] = useState('');

    const [viewingMedia, setViewingMedia] = useState<{ items: Message[]; startIndex: number } | null>(null);

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);

    const { toast } = useToast();
    const { startCall, sendFile } = usePeer();

    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

    const otherUserUid = isAiChat ? 'ai-assistant' : chat.id.replace(currentUser.uid, '').replace('_', '');
    const isOtherUserTyping = chatData?.typing?.[otherUserUid] === true;

    const handleClearSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedMessages([]);
    }, []);

    useEffect(() => {
        let objectUrl: string | null = null;
        const wallpaperUri = currentUser.wallpaper;

        if (wallpaperUri) {
            if (wallpaperUri.startsWith('indexeddb://')) {
                const fileId = wallpaperUri.replace('indexeddb://', '');
                getFile(fileId).then(file => {
                    if (file) {
                        objectUrl = URL.createObjectURL(file);
                        setBackgroundUrl(objectUrl);
                    } else {
                        setBackgroundUrl(null); 
                    }
                }).catch(err => {
                    console.error("Failed to load wallpaper from IndexedDB", err);
                    setBackgroundUrl(null);
                });
            } else {
                setBackgroundUrl(wallpaperUri);
            }
        } else {
            setBackgroundUrl(null);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [currentUser.wallpaper]);

    useEffect(() => {
        if (isAiChat) {
            setMessages([
                {
                    id: '0',
                    senderUid: 'ai-assistant',
                    text: 'Hello! I am ByteChat AI. How can I assist you today?',
                    timestamp: Timestamp.now(),
                    type: 'text',
                }
            ]);
            setLoading(false);
        } else {
            setLoading(true);
            const messagesCol = collection(db!, 'chats', chat.id, 'messages');
            const q = query(messagesCol, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Message));
                setMessages(fetchedMessages);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching messages:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [chat.id, isAiChat]);

    useEffect(() => {
        if (isAiChat || !chat.id) return;
        const chatDocRef = doc(db!, 'chats', chat.id);
        const unsubscribe = onSnapshot(chatDocRef, (doc) => {
            setChatData(doc.data());
        });
        return () => unsubscribe();
    }, [chat.id, isAiChat]);

    useEffect(() => {
        if (isAiChat || !otherUserUid) return;
        const unsub = onSnapshot(doc(db!, 'users', otherUserUid), (doc) => {
            if (doc.exists()) {
                setOtherUser(doc.data() as UserProfile);
            }
        });
        return () => unsub();
    }, [otherUserUid, isAiChat]);


    const updateTypingStatus = async (isTyping: boolean) => {
        if (isAiChat || !chat.id || !currentUser.uid) return;
        const chatDocRef = doc(db!, 'chats', chat.id);
        try {
            await setDoc(chatDocRef, { 
                typing: { [currentUser.uid]: isTyping }
            }, { merge: true });
        } catch (error) {
            console.error("Could not update typing status:", error);
        }
    };

    const handleStartTyping = () => updateTypingStatus(true);
    const handleStopTyping = useCallback(() => updateTypingStatus(false), [chat.id, currentUser.uid]);


    const markMessagesAsRead = useCallback(async () => {
        if (isAiChat || !currentUser?.uid || !chat.id) return;

        const chatDocRef = doc(db!, 'chats', chat.id);
        try {
            await setDoc(chatDocRef, {
                readUntil: {
                    [currentUser.uid]: serverTimestamp()
                }
            }, { merge: true });
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    }, [chat.id, currentUser.uid, isAiChat]);

    useEffect(() => {
        markMessagesAsRead();
        return () => {
            handleStopTyping();
        }
    }, [markMessagesAsRead, handleStopTyping]);


    const handleSend = async (payload: { text: string; files?: File[]; audioData?: { duration: number; waveform: number[] } }) => {
        const { text, files = [], audioData } = payload;
        if (!text.trim() && files.length === 0 && !audioData) return;
        if (!currentUser) return;
        handleStopTyping();

        const sendOfflineNotification = async () => {
            const otherUserDocRef = doc(db, 'users', otherUserUid);
            const otherUserDoc = await getDoc(otherUserDocRef);
            if (otherUserDoc.exists()) {
                const recipientProfile = otherUserDoc.data() as UserProfile;
                if (recipientProfile.status === 'offline' && recipientProfile.fcmToken) {
                    const messagePreview = text || (files.length > 0 ? `Sent ${files.length} file(s)` : 'New message');
                    
                    fetch('/api/send-notification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: recipientProfile.fcmToken,
                            title: currentUser.name,
                            body: messagePreview,
                            url: `/chat?id=${chat.id}`,
                            avatar: currentUser.avatar,
                            tag: chat.id,
                        }),
                    });
                }
            }
        };

        if (isAiChat) {
            const userMessage: Message = {
                id: String(Date.now()),
                senderUid: currentUser.uid,
                text,
                timestamp: Timestamp.now(),
                type: 'text'
            };
            setMessages(prev => [...prev, userMessage]);
            setIsAiThinking(true);

            const historyForApi: AiChatInput['history'] = [...messages, userMessage]
                .slice(1) 
                .map(msg => ({
                    role: msg.senderUid === currentUser.uid ? 'user' : 'model',
                    content: msg.text
                }));
            
            try {
                const aiResponse = await getAiResponse({ history: historyForApi });
                const aiMessage: Message = {
                    id: String(Date.now() + 1),
                    senderUid: 'ai-assistant',
                    text: aiResponse,
                    timestamp: Timestamp.now(),
                    type: 'text'
                };
                setMessages(prev => [...prev, aiMessage]);
            } catch(e) {
                console.error("Error getting AI response:", e);
                toast({ variant: 'destructive', title: 'AI Error', description: 'The AI assistant is currently unavailable.' });
            } finally {
                setIsAiThinking(false);
            }
        } else {
            const messagesCol = collection(db!, 'chats', chat.id, 'messages');
            const chatDocRef = doc(db!, 'chats', chat.id);

            const sendMessage = async (messageData: Partial<Message>) => {
                await addDoc(messagesCol, messageData);
                await updateDoc(chatDocRef, {
                    lastMessage: {
                        text: messageData.type === 'audio' ? 'Voice message' : (messageData.text || messageData.fileName),
                        senderUid: currentUser.uid,
                        timestamp: serverTimestamp(),
                        type: messageData.type,
                    },
                    updatedAt: serverTimestamp()
                });
                sendOfflineNotification();
            };

            // Case 1: Audio message
            if (audioData && files.length > 0) {
                const audioFile = files[0];
                if (!otherUser?.peerId) {
                    toast({ variant: 'destructive', title: 'Cannot Send File', description: 'User is not available for file transfer.' });
                    return;
                }
                try {
                    const fileMetadata = await sendFile(otherUser.peerId, audioFile);
                    let messageData: Partial<Message> = {
                        senderUid: currentUser.uid,
                        timestamp: serverTimestamp() as Timestamp,
                        text: '',
                        type: 'audio',
                        duration: audioData.duration,
                        waveform: audioData.waveform,
                        ...fileMetadata
                    };
                    if (replyingTo) {
                        messageData.replyTo = { messageId: replyingTo.id, text: replyingTo.text, senderUid: replyingTo.senderUid };
                    }
                    await sendMessage(messageData);
                } catch (error) {
                    console.error("Error sending audio file:", error);
                    toast({ variant: "destructive", title: "Send Failed", description: "Could not send your voice message." });
                }
            }
            // Case 2: Text and/or File messages
            else {
                // Send text-only message if there's text and no files
                if (text.trim() && files.length === 0) {
                    const messageData: Partial<Message> = {
                        senderUid: currentUser.uid,
                        timestamp: serverTimestamp() as Timestamp,
                        text: text,
                        type: 'text',
                    };
                    if (replyingTo) {
                        messageData.replyTo = { messageId: replyingTo.id, text: replyingTo.text, senderUid: replyingTo.senderUid };
                    }
                    await sendMessage(messageData);
                }

                // Send files
                if (files.length > 0) {
                    if (!otherUser?.peerId) {
                        toast({ variant: 'destructive', title: 'Cannot Send File', description: 'User is not available for file transfer.' });
                        return;
                    }
                    for (const [index, file] of files.entries()) {
                        try {
                            const fileMetadata = await sendFile(otherUser.peerId, file);
                            let messageData: Partial<Message> = {
                                senderUid: currentUser.uid,
                                timestamp: serverTimestamp() as Timestamp,
                                text: (index === 0) ? text : '', // Caption with first file only
                                ...fileMetadata
                            };
        
                            if (file.type.startsWith('image/')) messageData.type = 'image';
                            else if (file.type.startsWith('video/')) messageData.type = 'video';
                            else messageData.type = 'file';

                            // Attach replyTo to first message only
                            if (index === 0 && replyingTo) {
                                messageData.replyTo = { messageId: replyingTo.id, text: replyingTo.text, senderUid: replyingTo.senderUid };
                            }
        
                            await sendMessage(messageData);
                        } catch (error) {
                            console.error("Error sending file:", error);
                            toast({ variant: "destructive", title: "Send Failed", description: `Could not send ${file.name}.` });
                        }
                    }
                }
            }

            setReplyingTo(null);
        }
    }

    const handleUpdateMessage = async (text: string) => {
        if (isAiChat || !editingMessage || !text.trim()) return;
        
        const messageRef = doc(db!, 'chats', chat.id, 'messages', editingMessage.id);
        try {
            await updateDoc(messageRef, {
                text,
                editedAt: serverTimestamp(),
            });
            setEditingMessage(null);
            handleClearSelection();
        } catch (error) {
            console.error("Error updating message:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (isAiChat) return;
    
        const messageRef = doc(db!, 'chats', chat.id, 'messages', messageId);
        try {
            await updateDoc(messageRef, {
                text: "This message was deleted",
                isDeleted: true,
                reactions: {},
                replyTo: null,
                fileId: null,
                fileName: null,
                fileSize: null,
                mediaType: null,
                type: 'text'
            });
            toast({ title: `Message deleted.` });
        } catch (error) {
            console.error("Error deleting messages:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete message.' });
        }
    };
    
    const handleReaction = async (message: Message, emoji: string) => {
        if (isAiChat) return;
        const messageRef = doc(db!, 'chats', chat.id, 'messages', message.id);
        const currentReactions = message.reactions || {};
        const userList = currentReactions[emoji] || [];

        const newReactions = { ...currentReactions };

        // Users can have multiple reactions, so we don't check if they've already reacted.
        // If we wanted one reaction per user, we'd iterate through all emojis first.
        newReactions[emoji] = [...userList, currentUser.uid];
        
        // This logic is for toggling a single reaction type per user
        // if (userList.includes(currentUser.uid)) {
        //     const updatedUserList = userList.filter(uid => uid !== currentUser.uid);
        //     if (updatedUserList.length === 0) {
        //         delete newReactions[emoji];
        //     } else {
        //         newReactions[emoji] = updatedUserList;
        //     }
        // } else {
        //     newReactions[emoji] = [...userList, currentUser.uid];
        // }

        try {
            await updateDoc(messageRef, { reactions: newReactions });
        } catch (error) {
            console.error("Error handling reaction:", error);
        }
    };

    const onCancelEditReply = () => {
        setReplyingTo(null);
        setEditingMessage(null);
    }

    const handleSelectMessage = (message: Message) => {
        setSelectedMessages(prev => {
            if (prev.find(m => m.id === message.id)) {
                const newSelection = prev.filter(m => m.id !== message.id);
                if (newSelection.length === 0) {
                    setSelectionMode(false);
                }
                return newSelection;
            } else {
                return [...prev, message];
            }
        });
    };
    
    const handleEnterSelectionMode = (message: Message) => {
        setSelectionMode(true);
        setSelectedMessages([message]);
    };

    const handleDeleteSelectedMessages = async () => {
        if (isAiChat || selectedMessages.length === 0) return;
        
        const batch = firestoreWriteBatch(db);
        selectedMessages.forEach(msg => {
            const messageRef = doc(db!, 'chats', chat.id, 'messages', msg.id);
            batch.update(messageRef, {
                text: "This message was deleted",
                isDeleted: true,
                reactions: {},
                replyTo: null,
                fileId: null,
                fileName: null,
                fileSize: null,
                mediaType: null,
                type: 'text'
            });
        });
        try {
            await batch.commit();
            toast({ title: `${selectedMessages.length} message(s) deleted.` });
        } catch (error) {
            console.error("Error deleting messages:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete messages.' });
        } finally {
            handleClearSelection();
        }
    };

    const handleEditSelectedMessage = () => {
        if (selectedMessages.length !== 1) return;
        setEditingMessage(selectedMessages[0]);
    };
    
    const displayName = isAiChat ? "ByteChat AI" : chatData?.nicknames?.[otherUserUid] || chat.name;

    const getStatusText = () => {
        if (isAiChat) {
            return isAiThinking ? (
                <div className="flex items-center text-sm text-muted-foreground">
                    Typing...
                </div>
            ) : <div className="flex items-center gap-1.5 text-sm text-green-500"><span className="h-2 w-2 rounded-full bg-green-500"></span>Online</div>;
        }
        if (!otherUser) return <div className="text-sm text-muted-foreground">Offline</div>;
        if (isOtherUserTyping) return (
            <div className="flex items-center text-sm text-primary">
                Typing...
            </div>
        );
        if (otherUser.status === 'online') {
            return <div className="flex items-center gap-1.5 text-sm text-green-500"><span className="h-2 w-2 rounded-full bg-green-500"></span>Online</div>;
        }
        return <div className="text-sm text-muted-foreground">{formatLastSeen(otherUser.lastSeen)}</div>;
    };


    const handleOpenNicknameDialog = () => {
        if(isAiChat) return;
        setNewNickname(displayName);
        setNicknameDialogOpen(true);
    };

    const handleSaveNickname = async () => {
        const chatDocRef = doc(db!, 'chats', chat.id);
        try {
            await updateDoc(chatDocRef, {
                [`nicknames.${otherUserUid}`]: newNickname
            });
            toast({ title: "Nickname updated!" });
            setNicknameDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not update nickname." });
        }
    };

    const handleStartCall = async (type: 'audio' | 'video') => {
        if (!otherUser) {
            toast({ variant: 'destructive', title: 'Cannot Call', description: 'This user cannot be called right now.' });
            return;
        }
        try {
            await startCall(otherUser, type);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Call Error',
                description: error.message || 'Could not start the call.',
            });
        }
    };

    const mediaMessages = useMemo(() => 
        messages.filter(m => (m.type === 'image' || m.type === 'video') && m.fileId), 
    [messages]);

    const handleMediaClick = (messageId: string) => {
        const startIndex = mediaMessages.findIndex(m => m.id === messageId);
        if (startIndex > -1) {
            setViewingMedia({ items: mediaMessages, startIndex });
        }
    };
  
    const getSenderProfile = useCallback((uid: string) => {
        if (uid === currentUser.uid) {
            return { name: currentUser.name, avatar: currentUser.avatar || null };
        }
        if (uid === otherUser?.uid) {
            return { name: displayName, avatar: otherUser?.avatar || null };
        }
        return { name: 'Unknown User', avatar: null };
    }, [currentUser, otherUser, displayName]);


    return (
      <div className="flex flex-col h-screen bg-muted relative">
        <AnimatePresence>
            {selectionMode ? (
                <SelectionHeader 
                    count={selectedMessages.length}
                    onCancel={handleClearSelection}
                    onDelete={handleDeleteSelectedMessages}
                    onEdit={handleEditSelectedMessage}
                />
            ) : (
                <motion.header 
                    className="flex items-center p-3 border-b bg-background sticky top-0 z-10 shrink-0"
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                >
                  <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <UserAvatar 
                     name={displayName}
                     avatarUrl={chat.avatar}
                     ringColor="ring-primary"
                     className={cn("ring-2", isAiChat && !chat.avatar && "bg-primary/20 text-primary")}
                  />
                  <div className="ml-3 flex-1 overflow-hidden" onClick={handleOpenNicknameDialog}>
                    <p className="font-semibold truncate cursor-pointer hover:underline">{displayName}</p>
                    <div className="text-xs h-4">
                      {getStatusText()}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {!isAiChat && (
                        <>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50 text-foreground" onClick={() => handleStartCall('video')}><Video /></Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50 text-foreground" onClick={() => handleStartCall('audio')}><Phone /></Button>
                        </>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-foreground"><MoreVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={handleOpenNicknameDialog}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Change Nickname</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.header>
            )}
        </AnimatePresence>
        
        <div 
            className={cn(
                "flex-1 flex flex-col overflow-hidden bg-cover bg-center mt-1 bg-background md:rounded-t-[2.5rem]",
                !backgroundUrl && "bg-background"
            )}
            style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined }}
        >
            <MessageList 
                messages={messages}
                loading={loading}
                isAiChat={isAiChat}
                currentUser={currentUser} 
                otherUser={{ ...chat, name: displayName, uid: otherUserUid }}
                onReply={setReplyingTo}
                onEdit={setEditingMessage}
                onDelete={handleDeleteMessage}
                onReact={handleReaction}
                onMediaClick={handleMediaClick}
                onSelectMessage={handleSelectMessage}
                onEnterSelectionMode={handleEnterSelectionMode}
                selectionMode={selectionMode}
                selectedMessages={selectedMessages}
                chatData={chatData}
            />
            
            <MessageInput 
                onSend={handleSend}
                onUpdateMessage={handleUpdateMessage}
                replyingTo={replyingTo}
                editingMessage={editingMessage}
                onCancelEditReply={onCancelEditReply}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
                isAiChat={isAiChat}
            />
        </div>

        <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Nickname</DialogTitle>
                    <DialogDescription>
                        Set a new nickname for {chat.name}. This is only visible in this chat.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nickname" className="text-right">Nickname</Label>
                        <Input 
                            id="nickname" 
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveNickname}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {viewingMedia && (
            <MediaViewer
                isOpen={!!viewingMedia}
                onOpenChange={(open) => { if (!open) setViewingMedia(null); }}
                mediaItems={viewingMedia.items}
                startIndex={viewingMedia.startIndex}
                getSenderProfile={getSenderProfile}
            />
        )}
      </div>
    );
}
