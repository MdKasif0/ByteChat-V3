'use client';

import Lottie, { LottieComponentProps } from "lottie-react";

type LottieAnimationProps = Omit<LottieComponentProps, 'animationData' | 'path'> & {
    src: string;
};

export function LottieAnimation({ src, ...props }: LottieAnimationProps) {
    return (
        <Lottie
            path={src}
            loop={true}
            {...props}
        />
    );
}
