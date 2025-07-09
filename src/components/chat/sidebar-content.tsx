'use client'
import {
  SidebarHeader,
  SidebarContent as SidebarContentArea,
  SidebarFooter,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { LogOut, PlusCircle, Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { NewChatDialog } from "./new-chat-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

type Chat = {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
    lastMessage: string;
    unread?: number;
    username: string;
};

type CurrentUser = {
    name: string;
    username: string;
    avatar: string;
};

type SidebarContentProps = {
    chats: Chat[];
    currentUser: CurrentUser;
    onChatSelect: (chat: Chat) => void;
    activeChat: Chat | null;
}

export function SidebarContent({ chats, currentUser, onChatSelect, activeChat }: SidebarContentProps) {
    const { signOut } = useAuth();
    return (
        <div className="flex flex-col h-full">
            <SidebarHeader>
                <div className="flex items-center gap-3">
                    <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatar} isOnline />
                    <div className="flex flex-col grow">
                        <span className="font-semibold text-sm text-foreground">{currentUser.name}</span>
                        <span className="text-xs text-muted-foreground">@{currentUser.username}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SidebarInput placeholder="Search..." className="pl-9" />
                </div>
            </SidebarHeader>

            <SidebarContentArea>
                <SidebarMenu>
                    {chats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                                onClick={() => onChatSelect(chat)}
                                isActive={activeChat?.id === chat.id}
                                className="h-auto p-2 justify-start gap-3"
                            >
                                <UserAvatar name={chat.name} avatarUrl={chat.avatar} isOnline={chat.online} className="h-10 w-10 shrink-0" data-ai-hint="profile picture" />
                                <div className="flex flex-col items-start text-left flex-1 truncate">
                                    <span className="font-medium">{chat.name}</span>
                                    <p className="text-xs text-muted-foreground truncate w-full">{chat.lastMessage}</p>
                                </div>
                                {chat.unread && chat.unread > 0 && (
                                    <Badge variant="default" className="flex-shrink-0 h-5 w-5 p-0 flex items-center justify-center">{chat.unread}</Badge>
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContentArea>

            <SidebarFooter>
                <NewChatDialog onChatSelect={onChatSelect}>
                    <Button className="w-full justify-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Chat
                    </Button>
                </NewChatDialog>
            </SidebarFooter>
        </div>
    )
}
