import { useEffect } from 'react';
import { useSocket } from './useSocket';

export const useLazySocket = (eventHandlers = {}) => {
    const { socket, isConnected, connect, disconnect, on, off } = useSocket();

    useEffect(() => {
        if (socket && !isConnected) {
            connect();
        }

        Object.entries(eventHandlers).forEach(([event, handler]) => {
            on(event, handler);
        });

        return () => {
            Object.entries(eventHandlers).forEach(([event, handler]) => {
                off(event, handler);
            });
        };
    }, [socket, isConnected, connect, on, off, eventHandlers]);

    return { socket, isConnected, disconnect };
};