'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { UserAvatar } from '../user-avatar';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Check, CheckCheck, Image as ImageIcon, Video, FileText, Mic } from 'lucide-react';
import type { UserProfile } from '@/contexts/auth-context';
import { LottieAnimation } from '../lottie-animation';
import PullToRefresh from 'react-pull-to-refresh';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export type Chat = {
  id: string;
  participants: Record<string, ChatParticipant>;
  participantUids: string[];
  lastMessage?: {
    text: string;
    senderUid: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'video' | 'file' | 'audio';
  };
  unreadCounts?: Record<string, number>;
  updatedAt: Timestamp;
  wallpaper?: string;
  nicknames?: Record<string, string>;
};

type ChatParticipant = {
  name: string;
  username: string;
  avatar: string;
};


type ChatListItemProps = {
  chat: Chat;
  currentUser: UserProfile;
  onChatSelect: (chat: any) => void;
};

const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function ChatListItem({ chat, currentUser, onChatSelect }: ChatListItemProps) {
  const isAiChat = chat.id === 'ai-assistant';
  const otherUserUid = chat.participantUids.find((uid) => uid !== currentUser.uid);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const isLongPressHandled = useRef(false);

  useEffect(() => {
    if (isAiChat || !otherUserUid) return;
    const unsub = onSnapshot(doc(db!, 'users', otherUserUid), (doc) => {
      if (doc.exists()) {
        setOtherUser(doc.data() as UserProfile);
      }
    });
    return () => unsub();
  }, [otherUserUid, isAiChat]);

  const handlePointerDown = () => {
    if (isAiChat) return;
    isLongPressHandled.current = false;
    longPressTimer.current = setTimeout(() => {
        setIsDeleteDialogOpen(true);
        isLongPressHandled.current = true;
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  const handlePointerLeave = () => {
      clearTimeout(longPressTimer.current);
  }

  const lastMessage = chat.lastMessage;

  const getLastMessagePreview = () => {
    if (!lastMessage) return "No messages yet.";
    
    const text = lastMessage.text || '';
    
    switch (lastMessage.type) {
        case 'image':
            return <span className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" />{text || 'Photo'}</span>;
        case 'video':
            return <span className="flex items-center gap-1.5"><Video className="h-4 w-4" />{text || 'Video'}</span>;
        case 'file':
            return <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" />{text || 'File'}</span>;
        case 'audio':
             return <span className="flex items-center gap-1.5"><Mic className="h-4 w-4" />{text || 'Voice message'}</span>;
        case 'text':
        default:
            return <span className="flex items-center gap-1.5">
                {lastMessage?.senderUid === currentUser.uid && <CheckCheck className="h-4 w-4 text-primary" />}
                {text}
            </span>;
    }
  };
  
  const otherUserName = isAiChat ? 'ByteChat AI' : (chat.nicknames?.[otherUserUid!] || otherUser?.name);

  const handleSelect = () => {
    onChatSelect({
        id: chat.id,
        name: otherUserName,
        avatar: isAiChat ? '/bytechat-logo.png' : otherUser?.avatar,
        username: isAiChat ? 'ai_assistant' : otherUser?.username,
    });
  }

  const handleClick = () => {
    if (!isLongPressHandled.current) {
        handleSelect();
    }
  };

  const handleDeleteChat = async () => {
      if (isAiChat) return;
      try {
          // Note: This deletes the chat document but not its subcollections (messages).
          // A Cloud Function would be needed for a full cleanup.
          await deleteDoc(doc(db, "chats", chat.id));
          toast({ title: "Chat Deleted", description: "The chat has been removed from your list." });
      } catch (error) {
          console.error("Error deleting chat:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not delete the chat." });
      }
      setIsDeleteDialogOpen(false);
  };


  if (!isAiChat && !otherUser) {
     return null;
  }

  const unreadCount = chat.unreadCounts?.[currentUser.uid] ?? 0;

  return (
    <>
        <button 
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full text-left p-2 rounded-xl hover:bg-accent transition-colors"
        >
        <div className="flex items-center gap-4">
            <UserAvatar 
                name={otherUserName || ''} 
                avatarUrl={isAiChat ? '/bytechat-logo.png' : otherUser?.avatar} 
                status={isAiChat ? undefined : otherUser?.status}
                className="h-14 w-14" 
                ringColor={unreadCount > 0 ? 'ring-primary' : 'ring-transparent'} 
                data-ai-hint={isAiChat ? "robot bot" : ""}
            />
            <div className="flex-1 truncate">
            <div className="flex justify-between items-center">
                <h3 className="font-bold truncate">{otherUserName}</h3>
                <p className="text-xs text-muted-foreground">{formatTimestamp(lastMessage?.timestamp)}</p>
            </div>
            <div className="flex justify-between items-start mt-1">
                <div className="text-sm text-muted-foreground truncate">
                    {getLastMessagePreview()}
                </div>
                {unreadCount > 0 && (
                    <Badge className="h-6 w-6 flex items-center justify-center p-0 rounded-full">{unreadCount}</Badge>
                )}
            </div>
            </div>
        </div>
        </button>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to delete this chat with {otherUserName}? This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={handleDeleteChat}
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

export function ChatList({ onChatSelect }: { onChatSelect: (chat: any) => void }) {
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const chatsRef = collection(db!, 'chats');
    const q = query(chatsRef, where('participantUids', 'array-contains', userProfile.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userChats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        userChats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      // Sort by last message timestamp
      userChats.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp?.toMillis() || a.updatedAt?.toMillis() || 0;
        const timeB = b.lastMessage?.timestamp?.toMillis() || b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });

      const aiChatListItem: Chat = {
          id: 'ai-assistant',
          participants: { 'ai-assistant': { name: 'ByteChat AI', username: 'ai_assistant', avatar: '' } },
          participantUids: ['ai-assistant', userProfile.uid],
          lastMessage: {
              text: 'Ask me anything!',
              senderUid: 'ai-assistant',
              timestamp: Timestamp.now(),
              type: 'text',
          },
          updatedAt: Timestamp.now(),
      };

      setChats([aiChatListItem, ...userChats]);
    }, (error) => {
      console.error("Error fetching chats: ", error);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleRefresh = async () => {
    // In a real app, you might re-fetch data here.
    // For now, we just show a toast.
    toast({ title: "Chats refreshed!" });
  }

  if (chats.length <= 1) { // only AI chat
    return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <LottieAnimation src="https://lottie.host/embed/8488950c-e2f7-4a6c-ab03-a968a3bf602e/rA9g5a4358.json" className="w-64 h-64" />
            <p className="mt-4">No chats yet. Start a new one!</p>
        </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-2">
        {chats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} currentUser={userProfile!} onChatSelect={onChatSelect} />
        ))}
        </div>
    </PullToRefresh>
  );
}
