
'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
} from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { UserAvatar } from '../user-avatar';
import { Badge } from '../ui/badge';
import { CheckCheck, Image as ImageIcon, Video, FileText, Mic, CheckCircle } from 'lucide-react';
import type { UserProfile } from '@/contexts/auth-context';
import { LottieAnimation } from '../lottie-animation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';


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
  selectionMode: boolean;
  isSelected: boolean;
  onSelectChat: (chat: Chat) => void;
  onEnterSelectionMode: (chat: Chat) => void;
};

const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function ChatListItem({ chat, currentUser, onChatSelect, selectionMode, isSelected, onSelectChat, onEnterSelectionMode }: ChatListItemProps) {
  const isAiChat = chat.id === 'ai-assistant';
  const otherUserUid = chat.participantUids.find((uid) => uid !== currentUser.uid);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  
  const longPressTimer = useRef<NodeJS.Timeout>();
  const isActionTriggered = useRef(false);

  useEffect(() => {
    if (isAiChat || !otherUserUid) return;
    const unsub = onSnapshot(doc(db!, 'users', otherUserUid), (doc) => {
      if (doc.exists()) {
        setOtherUser({ uid: doc.id, ...doc.data() } as UserProfile);
      }
    });
    return () => unsub();
  }, [otherUserUid, isAiChat]);

  const handlePointerDown = () => {
    if (isAiChat) return;
    isActionTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
        if ('vibrate' in navigator) navigator.vibrate(50);
        onEnterSelectionMode(chat);
        isActionTriggered.current = true;
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handlePointerMove = () => {
      clearTimeout(longPressTimer.current);
  };

  const handleSelect = () => {
    onChatSelect({
        id: chat.id,
        name: otherUserName,
        avatar: isAiChat ? '/bytechat-logo.png' : otherUser?.avatar,
        username: isAiChat ? 'ai_assistant' : otherUser?.username,
    });
  }

  const handleClick = () => {
    if (isActionTriggered.current) return;

    if (selectionMode) {
      onSelectChat(chat);
    } else {
      handleSelect();
    }
  };


  const lastMessage = chat.lastMessage;

  const getLastMessagePreview = () => {
    if (!lastMessage) return "No messages yet.";
    
    const text = lastMessage.text || '';
    
    const senderPrefix = lastMessage.senderUid === currentUser.uid 
        ? <CheckCheck className="h-4 w-4 text-primary mr-1 shrink-0" />
        : null;

    switch (lastMessage.type) {
        case 'image':
            return <span className="flex items-center gap-1.5">{senderPrefix}<ImageIcon className="h-4 w-4" />{text || 'Photo'}</span>;
        case 'video':
            return <span className="flex items-center gap-1.5">{senderPrefix}<Video className="h-4 w-4" />{text || 'Video'}</span>;
        case 'file':
            return <span className="flex items-center gap-1.5">{senderPrefix}<FileText className="h-4 w-4" />{text || 'File'}</span>;
        case 'audio':
             return <span className="flex items-center gap-1.5">{senderPrefix}<Mic className="h-4 w-4" />{text || 'Voice message'}</span>;
        case 'text':
        default:
            return <span className="flex items-center gap-1.5">{senderPrefix}{text}</span>;
    }
  };
  
  const otherUserName = isAiChat ? 'ByteChat AI' : (chat.nicknames?.[otherUserUid!] || otherUser?.name);

  if (!isAiChat && !otherUser) {
     return null;
  }

  const unreadCount = chat.unreadCounts?.[currentUser.uid] ?? 0;

  return (
    <div
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onContextMenu={(e) => { e.preventDefault(); if(!isAiChat) onEnterSelectionMode(chat) }}
        className={cn(
            "w-full text-left p-2 rounded-xl transition-colors relative",
            isSelected ? "bg-primary/10" : "hover:bg-accent"
        )}
        style={{ WebkitTouchCallout: 'none' }}
    >
      <div className="flex items-center gap-4">
          <div className="relative">
             <UserAvatar 
                name={otherUserName || ''} 
                avatarUrl={isAiChat ? '/bytechat-logo.png' : otherUser?.avatar} 
                status={isAiChat ? undefined : otherUser?.status}
                className="h-14 w-14" 
                ringColor={unreadCount > 0 ? 'ring-primary' : 'ring-transparent'} 
                data-ai-hint={isAiChat ? "robot bot" : ""}
            />
            <AnimatePresence>
              {isSelected && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <CheckCircle className="h-7 w-7 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1 truncate">
          <div className="flex justify-between items-center">
              <h3 className="font-bold truncate">{otherUserName}</h3>
              <p className="text-xs text-muted-foreground">{formatTimestamp(lastMessage?.timestamp)}</p>
          </div>
          <div className="flex justify-between items-start mt-1">
              <div className="text-sm text-muted-foreground truncate flex items-center">
                  {getLastMessagePreview()}
              </div>
              {unreadCount > 0 && (
                  <Badge className="h-6 w-6 flex items-center justify-center p-0 rounded-full">{unreadCount}</Badge>
              )}
          </div>
          </div>
      </div>
    </div>
  );
}

type ChatListProps = {
  onChatSelect: (chat: any) => void;
  selectionMode: boolean;
  selectedChats: Chat[];
  onSelectChat: (chat: Chat) => void;
  onEnterSelectionMode: (chat: Chat) => void;
};


export function ChatList({ onChatSelect, selectionMode, selectedChats, onSelectChat, onEnterSelectionMode }: ChatListProps) {
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

  if (chats.length <= 1) { // only AI chat
    return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <LottieAnimation src="https://lottie.host/embed/8488950c-e2f7-4a6c-ab03-a968a3bf602e/rA9g5a4358.json" className="w-64 h-64" />
            <p className="mt-4">No chats yet. Start a new one!</p>
        </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <ChatListItem 
            key={chat.id} 
            chat={chat} 
            currentUser={userProfile!} 
            onChatSelect={onChatSelect}
            selectionMode={selectionMode}
            isSelected={selectedChats.some(c => c.id === chat.id)}
            onSelectChat={onSelectChat}
            onEnterSelectionMode={onEnterSelectionMode}
        />
      ))}
    </div>
  );
}
