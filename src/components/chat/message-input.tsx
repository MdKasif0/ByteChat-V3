
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smile, Mic, ArrowRight, X, Pencil, MessageSquare, Paperclip, Image as ImageIcon, Video, FileText, Trash2 } from "lucide-react";
import type { Message } from './message-list';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { EmojiPicker } from "./emoji-picker";
import { AnimatePresence, motion } from "framer-motion";
import { formatBytes, cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

type MessageInputProps = {
    onSend: (payload: { text: string; files?: File[]; audioData?: { duration: number; waveform: number[] } }) => void;
    onUpdateMessage: (text: string) => void;
    replyingTo: Message | null;
    editingMessage: Message | null;
    onCancelEditReply: () => void;
    onStartTyping: () => void;
    onStopTyping: () => void;
    isAiChat?: boolean;
}

const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function FilesPreview({ files, onRemove }: { files: File[], onRemove: (file: File) => void }) {
    if (files.length === 0) return null;

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-primary" />;
        if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-primary" />;
        return <FileText className="h-8 w-8 text-muted-foreground" />;
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2 border-t"
            >
                <div className="bg-muted p-2 rounded-lg relative">
                    <p className="text-sm font-semibold mb-2 px-1">Attached Files ({files.length})</p>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {files.map((file, index) => (
                             <div key={`${file.name}-${index}`} className="bg-background p-2 rounded-md flex items-center gap-3 relative">
                                <div className="h-12 w-12 flex items-center justify-center bg-background rounded-md shrink-0">
                                   {getFileIcon(file)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                                </div>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={() => onRemove(file)}>
                                     <X className="h-4 w-4" />
                                 </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

function RecordingView({ onCancel, onSend }: { onCancel: () => void; onSend: (data: {file: File, duration: number, waveform: number[]}) => void; }) {
    const { isRecording, recordingTime, startRecording, stopRecording, resetRecording, getRecordingData, audioBlob } = useVoiceRecorder();
    
    useEffect(() => {
        startRecording();
    }, [startRecording]);

    useEffect(() => {
        if (audioBlob) {
            const data = getRecordingData();
            if (data) {
                onSend(data);
            }
        }
    }, [audioBlob, getRecordingData, onSend]);

    const handleCancel = () => {
        resetRecording();
        onCancel();
    };

    return (
        <div className="flex items-center w-full gap-3 p-1.5 h-12">
            <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={handleCancel}>
                <Trash2 />
            </Button>
            <div className="flex-1 flex items-center justify-center bg-muted rounded-full h-full px-4 text-accent-foreground">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
                <span className="ml-3 font-mono text-lg tabular-nums text-foreground">{formatTime(recordingTime)}</span>
            </div>
             <Button size="icon" className="rounded-full h-12 w-12 shrink-0 bg-primary hover:bg-primary/90" onClick={stopRecording}>
                <ArrowRight className="h-5 w-5" />
            </Button>
        </div>
    )
}

export function MessageInput({ onSend, onUpdateMessage, replyingTo, editingMessage, onCancelEditReply, onStartTyping, onStopTyping, isAiChat = false }: MessageInputProps) {
    const [text, setText] = useState("");
    const [filesToSend, setFilesToSend] = useState<File[]>([]);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.text);
            inputRef.current?.focus();
        } else if (replyingTo) {
            inputRef.current?.focus();
        }
        else {
            setText("");
        }
    }, [editingMessage, replyingTo]);
    
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        
        if (isAiChat) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else {
            onStartTyping();
        }

        typingTimeoutRef.current = setTimeout(() => {
            onStopTyping();
            typingTimeoutRef.current = null;
        }, 1500);
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setFilesToSend(prev => [...prev, ...Array.from(files)]);
        }
        if(e.target) e.target.value = '';
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setFilesToSend(prev => prev.filter(file => file !== fileToRemove));
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim() && filesToSend.length === 0) return;

        if (!isAiChat && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            onStopTyping();
        }

        if (editingMessage) {
            onUpdateMessage(text);
        } else {
            onSend({ text, files: filesToSend });
        }
        setText("");
        setFilesToSend([]);
    }
    
    const handleSendVoiceMessage = (data: {file: File, duration: number, waveform: number[]}) => {
        onSend({ text: '', files: [data.file], audioData: { duration: data.duration, waveform: data.waveform } });
        setIsVoiceMode(false);
    }
    
    const onEmojiClick = (emoji: string) => {
        setText(prev => prev + emoji);
    }

    const mode = editingMessage ? 'edit' : replyingTo ? 'reply' : 'default';

    if (isVoiceMode) {
        return (
             <footer className="p-3 border-t bg-background sticky bottom-0">
                <div className="flex items-center h-12 bg-accent rounded-full text-accent-foreground">
                     <RecordingView onCancel={() => setIsVoiceMode(false)} onSend={handleSendVoiceMessage} />
                </div>
            </footer>
        )
    }

    return (
        <footer className="p-3 border-t bg-background sticky bottom-0">
             <FilesPreview files={filesToSend} onRemove={handleRemoveFile} />
            {mode !== 'default' && !isAiChat && (
                 <div className="flex items-center justify-between bg-accent/10 p-2 rounded-t-xl text-sm">
                     <div className="flex items-center gap-2 overflow-hidden">
                        {mode === 'edit' && <Pencil className="h-4 w-4 shrink-0 text-primary" />}
                        {mode === 'reply' && <MessageSquare className="h-4 w-4 shrink-0 text-primary" />}
                        <div className="flex-1 truncate">
                            <p className="font-semibold text-primary">{mode === 'edit' ? 'Editing Message' : `Replying to ${replyingTo?.senderName}`}</p>
                            <p className="text-muted-foreground truncate">{mode === 'edit' ? editingMessage?.text : replyingTo?.text}</p>
                        </div>
                     </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onCancelEditReply}>
                         <X className="h-4 w-4" />
                     </Button>
                 </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-2">
                <div className={cn(
                    "flex flex-1 items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1.5 text-foreground rounded-full h-12",
                    mode !== 'default' && !isAiChat ? 'rounded-b-full' : 'rounded-full'
                )}>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" type="button" className="bg-background text-card-foreground hover:bg-muted h-9 w-9 rounded-full shrink-0">
                                <Smile />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto border-none mb-2" side="top" align="start">
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                        </PopoverContent>
                    </Popover>
                    <Input
                        ref={inputRef}
                        placeholder="Type something.."
                        value={text}
                        onChange={handleTextChange}
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-9 text-foreground placeholder:text-muted-foreground"
                    />
                    
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button" 
                        className="bg-background text-card-foreground hover:bg-muted h-9 w-9 rounded-full shrink-0" 
                        disabled={isAiChat}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button" 
                        className="bg-background text-card-foreground hover:bg-muted h-9 w-9 rounded-full shrink-0" 
                        disabled={isAiChat}
                        onClick={() => setIsVoiceMode(true)}
                    >
                        <Mic />
                    </Button>
                     
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple />
                </div>

                <Button size="icon" type="submit" disabled={!text.trim() && filesToSend.length === 0} className="rounded-full h-12 w-12 shrink-0 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground">
                    <ArrowRight className="h-5 w-5" />
                </Button>
            </form>
        </footer>
    );
}
