
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import type { Message } from './message-list';
import { Button } from '../ui/button';
import { Download, X } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { getFile } from '@/lib/indexed-db';
import { Skeleton } from '../ui/skeleton';

type MediaViewerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mediaItems: Message[];
  startIndex: number;
  getSenderProfile: (uid: string) => { name: string, avatar: string | null };
};

const MediaViewerItem = ({ item }: { item: Message }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!item.fileId) {
            setIsLoading(false);
            return;
        }
        let objectUrl = '';
        getFile(item.fileId)
            .then(file => {
                if (file) {
                    objectUrl = URL.createObjectURL(file);
                    setBlobUrl(objectUrl);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [item.fileId]);

    if (isLoading) {
        return <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-[80vw] h-[80vh] rounded-lg" /></div>;
    }
    if (!blobUrl) {
         return <div className="w-full h-full flex items-center justify-center text-white">Could not load media.</div>;
    }

    if (item.type === 'image') {
        return <img src={blobUrl} alt={item.fileName || 'Image'} className="max-w-[90vw] max-h-[80vh] object-contain" />;
    }
    
    if (item.type === 'video') {
        return <video src={blobUrl} controls className="max-w-[90vw] max-h-[80vh] object-contain" autoPlay />;
    }

    return null;
}

export function MediaViewer({ isOpen, onOpenChange, mediaItems, startIndex, getSenderProfile }: MediaViewerProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(startIndex);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if(isOpen) {
        setCurrent(startIndex);
        api?.scrollTo(startIndex, true);
    }
  }, [startIndex, api, isOpen]);

  const currentItem = useMemo(() => mediaItems[current], [mediaItems, current]);
  const sender = useMemo(() => currentItem ? getSenderProfile(currentItem.senderUid) : null, [currentItem, getSenderProfile]);

  const handleDownload = async () => {
    if (currentItem?.fileId) {
      const file = await getFile(currentItem.fileId);
      if (file) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = currentItem.fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    }
  };

  if (!currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
       <AnimatePresence>
        {isOpen && (
            <DialogPortal forceMount>
                <DialogOverlay asChild>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-black/80" />
                </DialogOverlay>
                <DialogContent 
                    className="bg-transparent border-none w-screen h-screen max-w-full max-h-screen p-0 flex flex-col focus-visible:outline-none" 
                    onClick={() => setShowControls(prev => !prev)}
                >
                    <DialogTitle className="sr-only">Media Viewer</DialogTitle>
                    <DialogDescription className="sr-only">
                        Viewing media item {current + 1} of {mediaItems.length}. Use arrow keys to navigate.
                    </DialogDescription>
                    <AnimatePresence>
                        {showControls && (
                             <motion.div 
                                initial={{ y: -100, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: -100, opacity: 0 }}
                                className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent"
                            >
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/20" onClick={() => onOpenChange(false)}><X /></Button>
                                        {sender && (
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={sender.name} avatarUrl={sender.avatar} className="h-10 w-10" />
                                                <div>
                                                    <p className="font-semibold">{sender.name}</p>
                                                    <p className="text-xs text-neutral-300">{format(currentItem.timestamp.toDate(), 'PP p')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/20" onClick={handleDownload}><Download /></Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="flex-1 flex items-center justify-center h-full w-full" onClick={(e) => e.stopPropagation()}>
                        <Carousel setApi={setApi} opts={{ startIndex, loop: mediaItems.length > 1 }} className="w-full h-full">
                            <CarouselContent className="h-full items-center">
                                {mediaItems.map((item) => (
                                    <CarouselItem key={item.id} className="flex justify-center">
                                       <MediaViewerItem item={item} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: showControls ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                {mediaItems.length > 1 && <CarouselPrevious className="absolute left-4" />}
                                {mediaItems.length > 1 && <CarouselNext className="absolute right-4" />}
                             </motion.div>
                        </Carousel>
                    </div>
                </DialogContent>
            </DialogPortal>
        )}
       </AnimatePresence>
    </Dialog>
  );
}
