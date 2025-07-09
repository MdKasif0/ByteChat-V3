'use client';
import React from 'react';
import Picker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';

export function EmojiPicker({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) {
    
    const { resolvedTheme } = useTheme();
    const theme = resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT;

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onEmojiClick(emojiData.emoji);
    };

    return (
        <Picker 
            onEmojiClick={handleEmojiClick}
            theme={theme}
            lazyLoadEmojis={true}
            height={350}
        />
    );
}
