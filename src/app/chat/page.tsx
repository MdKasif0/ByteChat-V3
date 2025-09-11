
'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Search, MoreVertical, X, Users, Star, Settings, QrCode, UserPlus, Pin, Archive, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatList, Chat } from '@/components/chat/chat-list';
import { ChatView } from '@/components/chat/chat-view';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingScreen } from '@/components/loading-screen';
import { usePeer } from '@/contexts/peer-context';
import { NewChatDialog } from '@/components/chat/new-chat-dialog';
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
import { buttonVariants } from '../ui/button';

const HomeHeader = ({ onNewChat }: { onNewChat: (chat: any) => void }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isSearchOpen]);

    return (
        <header className="flex items-center justify-between p-4 transition-all duration-300 shrink-0">
            <AnimatePresence>
                {!isSearchOpen && (
                    <motion.div
                        key="title"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1"
                    >
                        <h1 className="text-3xl font-bold">ByteChat</h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {isSearchOpen && (
                <motion.div
                    key="search-input"
                    initial={{ opacity: 0, width: '0%' }}
                    animate={{ opacity: 1, width: '100%' }}
                    exit={{ opacity: 0, width: '0%' }}
                    className="flex-1"
                >
                    <Input
                        ref={searchInputRef}
                        placeholder="Search chats..."
                        className="h-10 rounded-full bg-muted border-none w-full focus-visible:ring-2 focus-visible:ring-primary"
                    />
                </motion.div>
            )}

            <div className="flex items-center gap-1 pl-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                    {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
                <AnimatePresence>
                {!isSearchOpen && (
                    <motion.div
                        key="action-buttons"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1"
                    >
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push('/settings/qrcode')}>
                            <QrCode className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <NewChatDialog onChatSelect={onNewChat}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        <span>New Chat</span>
                                    </DropdownMenuItem>
                                </NewChatDialog>
                                <DropdownMenuItem>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>New Group</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Star className="mr-2 h-4 w-4" />
                                    <span>Starred Messages</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </header>
    );
};

const SelectionHeader = ({ count, onCancel, onDelete }: { count: number; onCancel: () => void; onDelete: () => void; }) => {
    return (
        <motion.div 
            className="absolute top-0 left-0 right-0 z-20 flex items-center p-2.5 bg-background border-b"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <Button variant="ghost" size="icon" onClick={onCancel} className="mr-2 h-10 w-10 rounded-full">
                <X className="h-6 w-6" />
            </Button>
            <p className="font-semibold text-xl flex-1">{count}</p>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <Pin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onDelete}>
                    <Trash2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <Archive className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>
        </motion.div>
    );
};


function ChatPageContent() {
  const { userProfile } = useAuth();
  const { acceptCallFromUrl } = usePeer();
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Chat[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const handleUrlParams = useCallback(async () => {
    if (!userProfile || !db) return;

    const chatId = searchParams.get('id');
    const callId = searchParams.get('callId');
    const action = searchParams.get('action');

    if (callId && action === 'accept') {
        acceptCallFromUrl(callId);
        router.replace('/chat', { scroll: false });
        return;
    }

    if (chatId) {
        const chatDocRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatDocRef);

        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const otherUserId = chatData.participantUids.find((uid: string) => uid !== userProfile.uid);
            
            if(otherUserId) {
                const otherUser = chatData.participants[otherUserId];
                 const chatToOpen = {
                    id: chatId,
                    name: otherUser.name,
                    avatar: otherUser.avatar,
                    username: otherUser.username,
                };
                setActiveChat(chatToOpen);
                router.replace('/chat', { scroll: false });
            }
        }
    }
  }, [searchParams, userProfile, router, acceptCallFromUrl]);


  useEffect(() => {
    handleUrlParams();
  }, [handleUrlParams]);

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    try {
        const chatToOpenRaw = sessionStorage.getItem('chatToOpen');
        if (chatToOpenRaw) {
            const chatToOpen = JSON.parse(chatToOpenRaw);
            setActiveChat(chatToOpen);
            sessionStorage.removeItem('chatToOpen');
        }
    } catch(e) {
        console.error("Failed to parse chatToOpen from sessionStorage", e);
        sessionStorage.removeItem('chatToOpen');
    }
  }, []);
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  };

  const handleClearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedChats([]);
  }, []);
  
  const handleSelectChat = (chat: Chat) => {
    setSelectedChats(prev => {
        const isSelected = prev.find(c => c.id === chat.id);
        if (isSelected) {
            const newSelection = prev.filter(c => c.id !== chat.id);
            if (newSelection.length === 0) {
                setSelectionMode(false);
            }
            return newSelection;
        } else {
            return [...prev, chat];
        }
    });
  };

  const handleEnterSelectionMode = (chat: Chat) => {
      setSelectionMode(true);
      setSelectedChats([chat]);
  };

  const confirmDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedChats.length === 0) return;
    try {
        const deletePromises = selectedChats.map(chat => deleteDoc(doc(db, "chats", chat.id)));
        await Promise.all(deletePromises);
        toast({ title: "Chats Deleted", description: `${selectedChats.length} chat(s) have been removed.` });
    } catch (error) {
        console.error("Error deleting chats:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete the selected chats." });
    } finally {
        handleClearSelection();
        setIsDeleteDialogOpen(false);
    }
  };


  
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }
  
  if (!userProfile) {
    return null;
  }

  if (activeChat) {
    return (
        <ChatView
          chat={activeChat}
          currentUser={userProfile}
          onBack={() => {
            setActiveChat(null);
            handleClearSelection();
          }}
        />
    )
  }

  return (
    <>
    <MobileLayout onChatSelect={setActiveChat}>
        <div className="flex flex-col h-full relative">
            <AnimatePresence>
                {selectionMode ? (
                    <SelectionHeader 
                        count={selectedChats.length}
                        onCancel={handleClearSelection}
                        onDelete={confirmDelete}
                    />
                ) : (
                    <HomeHeader onNewChat={setActiveChat} />
                )}
            </AnimatePresence>
            <main className="flex-1 flex flex-col min-h-0 bg-card md:rounded-t-3xl shadow-t-xl mt-4">
                <Tabs defaultValue="all" className="w-full pt-4 flex flex-col flex-1">
                    <TabsList className="mx-auto flex w-fit bg-transparent px-2 space-x-2 shrink-0">
                        <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground px-4">All</TabsTrigger>
                        <TabsTrigger value="groups" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground px-4">Groups</TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground px-4">Contacts</TabsTrigger>
                        <TabsTrigger value="archive" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground px-4">Archive</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-4 px-4 flex-1 overflow-y-auto">
                        <ChatList 
                            onChatSelect={setActiveChat} 
                            selectionMode={selectionMode}
                            selectedChats={selectedChats}
                            onSelectChat={handleSelectChat}
                            onEnterSelectionMode={handleEnterSelectionMode}
                        />
                    </TabsContent>
                     <TabsContent value="groups" className="mt-4 px-4 flex-1 overflow-y-auto">
                        <div className="text-center text-muted-foreground pt-10">Groups coming soon!</div>
                    </TabsContent>
                     <TabsContent value="contacts" className="mt-4 px-4 flex-1 overflow-y-auto">
                        <div className="text-center text-muted-foreground pt-10">Contacts coming soon!</div>
                    </TabsContent>
                     <TabsContent value="archive" className="mt-4 px-4 flex-1 overflow-y-auto">
                         <div className="text-center text-muted-foreground pt-10">Archived chats coming soon!</div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    </MobileLayout>
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedChats.length} Chat(s)?</AlertDialogTitle>
            <AlertDialogDescription>
            Are you sure you want to permanently delete the selected chats? This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={handleDeleteSelectedChats}
            >
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ChatPageContent />
        </Suspense>
    );
}
